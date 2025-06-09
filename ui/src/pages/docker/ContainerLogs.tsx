import React, { useState, useEffect, useRef } from 'react';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Switch,
  TextField,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Environment } from '../../App';

interface ErrorResponse {
  error: string;
  output?: string;
}

interface ContainerLogsResponse {
  success?: boolean;
  logs: string[];
}

interface ContainerLogsProps {
  activeEnvironment?: Environment;
  logsType: 'container' | 'compose';
  resourceId: string;    // containerId OR composeProject
  resourceName: string;  // containerName OR projectName
  onClose: () => void;
}

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

const CONTAINER_COLORS = [
  '#c586c0', // lavender
  '#89d185', // greenish
  '#ce9178', // salmon
  '#4fc1ff', // cyan
  '#d7ba7d', // yellowish
  '#d16969', // red
  '#b5cea8', // pale green
  '#dcdcaa', // pale yellow
  '#569cd6', // light blue
];

/**
 * Pattern-based log highlighting
 * Recognizes levels (INFO, WARN, ERROR), HTTP methods/status,
 * as well as known app messages (Spring, NATS, etc.),
 * and timestamps with fractional seconds + optional trailing 'Z'.
 */
function colorizeLog(line: string): string {
  const patterns: { regex: RegExp; className: string }[] = [
    // Common log levels
    { regex: /\b(INFO|DEBUG|TRACE)\b/, className: 'log-info' },
    { regex: /\b(WARN)\b/, className: 'log-warn' },
    { regex: /\b(ERROR|FATAL|CRITICAL)\b/, className: 'log-error' },

    // HTTP methods/statuses
    { regex: /\b(HTTP\/\d\.\d|\bGET\b|\bPOST\b|\bPUT\b|\bDELETE\b)\b/, className: 'log-http' },
    {
      regex: /\b(200 OK|301 Moved|302 Found|400 Bad Request|403 Forbidden|404 Not Found|500 Internal Server Error)\b/,
      className: 'log-http-status'
    },

    // NATS
    { regex: /\b(NATS Connected|NATS Disconnected|NATS Error)\b/, className: 'log-nats' },

    // Spring Boot / Hibernate
    { regex: /\b(Spring Boot started|Spring Context Loaded|Hibernate Initialized)\b/, className: 'log-spring' },

    // Nginx
    { regex: /\b(nginx error|nginx started|nginx stopped)\b/, className: 'log-nginx' },

    // DB / Connection
    { regex: /\b(connection refused|database error|timeout)\b/, className: 'log-db' },

    // Timestamps (supports fractional seconds and optional trailing 'Z')
    { regex: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/, className: 'log-timestamp' },
  ];

  patterns.forEach(({ regex, className }) => {
    line = line.replace(regex, (match) => `<span class="${className}">${match}</span>`);
  });
  return line;
}

const ContainerLogs: React.FC<ContainerLogsProps> = ({
                                                       activeEnvironment,
                                                       logsType,
                                                       resourceId,
                                                       resourceName,
                                                       onClose,
                                                     }) => {
  const ddClient = useDockerDesktopClient();

  // State
  // Container logs: simple string array
  const [containerLogs, setContainerLogs] = useState<string[]>([]);
  // Compose logs: an array of parsed objects
  const [composeLogs, setComposeLogs] = useState<ComposeLogLine[]>([]);

  const [containerColorMap, setContainerColorMap] = useState<Record<string, string>>({});

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [timestamps] = useState(true);

  const [tailLines, setTailLines] = useState(500);
  const [tempTailLines, setTempTailLines] = useState(tailLines);

  // Font size
  const [logFontSize, setLogFontSize] = useState<number>(0.75);

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const POLL_INTERVAL_MS = 1000;
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom if enabled
  const scrollToBottom = () => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Check if user scrolled away from bottom to toggle autoScroll
  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    if (atBottom !== autoScroll) {
      setAutoScroll(atBottom);
    }
  };

  useEffect(() => {
    if (autoScroll) {
      if (logsType === 'container' && containerLogs.length > 0) {
        scrollToBottom();
      } else if (logsType === 'compose' && composeLogs.length > 0) {
        scrollToBottom();
      }
    }
  }, [containerLogs, composeLogs, autoScroll]);

  // Setup log polling
  useEffect(() => {
    // Clear any existing timer
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }

    setContainerLogs([]);
    setComposeLogs([]);

    setError('');
    setIsLoading(true);

    if (!activeEnvironment || !resourceId) {
      setError('No environment or container selected');
      setIsLoading(false);
      return;
    }

    let isMounted = true; // Prevent running after unmount

    const pollLogs = async () => {
      await fetchLogs(false); // Step 1: Fetch logs and wait for it to finish
      if (isMounted) {
        pollTimer.current = setTimeout(pollLogs, POLL_INTERVAL_MS); // Step 2: Wait for interval before fetching again
      }
    };

    // Start the first fetch, then begin polling
    fetchLogs().then(() => {
      if (isMounted) {
        // Then set up repeated polling
        pollLogs();
      }
    });

    return () => {
      // Stop further execution if the component unmounts
      isMounted = false;
      if (pollTimer.current) {
        clearTimeout(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [activeEnvironment, resourceId, timestamps]);

  const handleReload = () => {
    fetchLogs(true);
  };

  const fetchLogs = async (resetLogs = true) => {
    if (!activeEnvironment) {
      setError('No environment selected');
      return;
    }

    try {
      if (resetLogs) {
        setIsLoading(true);
        setContainerLogs([]);
        setComposeLogs([]);
      }

      if (!ddClient.extension?.vm?.service) {
        throw new Error('Docker Desktop service not available');
      }

      // Decide which endpoint to call
      let endpoint = '';
      let payload: any = {
        hostname: activeEnvironment.hostname,
        username: activeEnvironment.username
      };

      if (logsType === 'container') {
        endpoint = '/container/logs';
        payload.containerId = resourceId;
      } else {
        // Compose logs
        endpoint = '/compose/logs';
        payload.composeProject = resourceId;
      }

      payload.tail = tailLines;
      payload.timestamps = true;

      const response = await ddClient.extension.vm.service.post(endpoint, payload);

      // Docker Desktop API wraps the response
      let actualResponse = response;
      if (response && typeof response === 'object' && 'data' in response) {
        actualResponse = response.data;
      }

      if (actualResponse && typeof actualResponse === 'object' && 'error' in actualResponse) {
        // If the response shape includes an error field
        const errorResponse = actualResponse as ErrorResponse;
        throw new Error(errorResponse.error);
      }

      const newLines = (actualResponse as ContainerLogsResponse).logs || [];

      if (logsType === 'container') {
        setContainerLogs((old) => {
          if (resetLogs || old.length === 0) {
            return newLines;
          }
          return mergeContainerLogs(old, newLines);
        });
      } else {
        // parse new lines into ComposeLogLine
        const parsed = newLines
          .map((l) => parseComposeLine(l))
          .filter((lineObj): lineObj is ComposeLogLine => !!lineObj);

        // Now assign colors for any containerName we haven't seen yet
        setContainerColorMap(oldMap => {
          const updatedMap = { ...oldMap };
          parsed.forEach(lineObj => {
            const cname = lineObj.containerName;
            if (cname && !updatedMap[cname]) {
              // pick next color
              const existingKeys = Object.keys(updatedMap).length;
              const colorIndex = existingKeys % CONTAINER_COLORS.length;
              updatedMap[cname] = CONTAINER_COLORS[colorIndex];
            }
          });
          return updatedMap;
        });

        setComposeLogs((old) => {
          if (resetLogs || old.length === 0) {
            return parsed;
          }
          return mergeComposeLogsByTimestamp(old, parsed);
        });
      }

      setError('');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
      setError(err.message || 'Failed to fetch logs');
      setIsLoading(false);
    }
  };

  // -----------------------------------------
  // Merge for Container logs: naive last line
  // -----------------------------------------
  function mergeContainerLogs(oldLines: string[], newLines: string[]): string[] {
    const lastOld = oldLines[oldLines.length - 1];
    const idx = newLines.indexOf(lastOld);
    if (idx === -1) {
      return [...oldLines, ...newLines];
    } else if (idx === newLines.length - 1) {
      return oldLines;
    } else {
      const toAppend = newLines.slice(idx + 1);
      return [...oldLines, ...toAppend];
    }
  }

  // -----------------------------------------
  // Merge for Compose logs by timestamp
  // -----------------------------------------
  function mergeComposeLogsByTimestamp(oldLines: ComposeLogLine[], newLines: ComposeLogLine[]): ComposeLogLine[] {
    // We'll assume oldLines is already sorted by timestamp
    // We only add truly "new" lines that have a timestamp >= the last line's timestamp
    const lastTs = oldLines[oldLines.length - 1].timestamp;
    const newOnly = newLines.filter((nl) => nl.timestamp > lastTs);
    // If some lines share the exact same timestamp but different text, you'd do a tie-breaker
    return [...oldLines, ...newOnly].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  function stripComposePrefix(line: string): string {
    // Docker Compose lines often look like: "<service-name>    | <the rest>"
    // We'll split just on the FIRST '|' character.
    const idx = line.indexOf('|');
    if (idx !== -1) {
      // everything after the '|'
      return line.slice(idx + 1).trimStart().trimEnd();
    }
    return line.trimStart().trimEnd(); // if no '|' found, just return original
  }

  /**
   * Finds the index in `newLines` whose *normalized* version matches `oldLast`.
   */
  function findIndexOfLastOldInNew(
    oldLast: string,
    newLines: string[],
    logsType: 'container' | 'compose'
  ): number {
    // Normalize oldLast if logsType is compose
    const oldLastNormalized =
      logsType === 'compose' ? stripComposePrefix(oldLast) : oldLast;

    // Scan newLines
    for (let i = 0; i < newLines.length; i++) {
      // Normalize each new line if logsType is compose
      const newLineNormalized =
        logsType === 'compose' ? stripComposePrefix(newLines[i]) : newLines[i];

      if (newLineNormalized === oldLastNormalized) {
        return i;
      }
    }
    return -1;
  }

  // Each parsed line if logsType === "compose"
  interface ComposeLogLine {
    containerName: string;
    timestamp: Date;
    rawLine: string;   // the original line
    logText: string;   // the part after the timestamp
  }


  /**
   * Example parse for a line like:
   *   "service-1  | 2025-02-27T12:34:56.123Z Some log text"
   */
  function parseComposeLine(line: string): ComposeLogLine | null {
    if (!line.trim()) return null; // empty line

    // Split at the first "|" to separate container from the rest
    const idx = line.indexOf('|');
    let containerName = '';
    let remainder = line;
    if (idx !== -1) {
      containerName = line.slice(0, idx).trim();
      remainder = line.slice(idx + 1).trim();
    }

    // remainder might be "2025-02-27T12:34:56.123Z Some log text"
    // We'll parse out the timestamp from the log text
    const match = remainder.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)(?:\s+(.*))?$/);
    if (!match) {
      // If it doesn't match, you might have lines without timestamps
      // or different formatting. We fallback to a "now" timestamp
      throw new Error(`Failed to parse line: ${line}`);
    }

    const timestampStr = match[1];  // e.g. "2025-02-27T12:34:56.123Z"
    const text = match[3];         // e.g. "Some log text"

    return {
      containerName,
      timestamp: new Date(timestampStr),
      rawLine: line,
      logText: text,
    };
  }

  // Font size increment/decrement
  const increaseFontSize = () => setLogFontSize((prev) => Math.min(prev + 0.1, 2));
  const decreaseFontSize = () => setLogFontSize((prev) => Math.max(prev - 0.1, 0.5));

  const handleKeyDownForInput = (e: any) => {
    if (e.key === 'Enter') {
      // triggers handleBlur
      e.target.blur();
    }
  };

  const handleBlurForInput = () => {
    // On blur, validate and update the "final" state.
    let numericValue = Number(tempTailLines);
    if (isNaN(numericValue) || numericValue < 500) {
      numericValue = 500; // enforce minimum
    }
    if (numericValue > 5000) {
      numericValue = 5000; // enforce maximum
    }
    setTailLines(numericValue);
    setTempTailLines(numericValue);
  };

  const handleChangeForInput = (e: any) => {
    // Keep track of user input in local state.
    setTempTailLines(e.target.value);
  };


  // -----------------------------------------
  // Render
  // -----------------------------------------
  // For display, we show either containerLogs or composeLogs
  // We'll convert composeLogs -> rawLine strings if needed
// For Compose logs, build a "render string" that has the container name colored
  const finalLinesToRender: string[] = logsType === 'container'
    ? containerLogs
    : composeLogs.map((lineObj) => {
      const cname = lineObj.containerName;
      const color = containerColorMap[cname] || '#fff';

      // We want something like:
      // "<span style='color: #ce9178'>service-1</span> | 2025-02-27T12:34:56.123Z Some log text"
      // Then pass that to colorizeLog.

      // Original lineObj.rawLine might be "service-1 | 2025-02-27T12:34:56.123Z Some log text"
      // We can remove the original container prefix and re-inject it with color, or we can just
      // replace the container name portion. Let's reconstruct it for clarity:

      const idx = lineObj.rawLine.indexOf('|');
      if (idx === -1) {
        // no pipe found, just color the containerName
        // e.g. if line was just "service-1" with no logs
        return `<span style="color: ${color}; font-weight: bold;">${cname}</span> ${lineObj.rawLine}`;
      } else {
        // everything after '|'
        const remainder = lineObj.rawLine.slice(idx + 1).trimStart();
        return `<span style="color: ${color}; font-weight: bold;">${cname}</span> | ${remainder}`;
      }
    });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header with controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontSize: '1rem' }}>
          {resourceName} ({resourceId.substring(0, 12)})
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}</span>
          <FormControlLabel
            control={
              <Switch
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                size="small"
              />
            }
            label="Follow"
            sx={{ mr: 0 }}
          />

          {/* Tail lines input */}
          <TextField
            type="number"
            label="Tail lines"
            value={tempTailLines}
            onChange={handleChangeForInput}
            onBlur={handleBlurForInput}
            onKeyDown={handleKeyDownForInput}
            size="small"
            InputProps={{
              inputProps: { min: 500 },
            }}
            sx={{ width: 100 }}
          />

          {/* Font size controls */}
          <Tooltip title="Decrease font size">
            <IconButton onClick={decreaseFontSize} size="small">
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Increase font size">
            <IconButton onClick={increaseFontSize} size="small">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Reload button */}
          <Tooltip title="Reload logs">
            <IconButton onClick={handleReload} disabled={isLoading} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Close button */}
          <Tooltip title="Close logs">
            <IconButton onClick={onClose} edge="end" size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      {/* Logs area */}
      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
          color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
          p: 1,
          fontFamily: 'monospace',
          fontSize: `${logFontSize}rem`,
          position: 'relative',
          '& .log-info': { color: '#0dbc79' },
          '& .log-warn': { color: '#e5e510' },
          '& .log-error': { color: '#f14c4c' },
          '& .log-http': { color: '#2472c8' },
          '& .log-http-status': { color: '#bc3fbc' },
          '& .log-nats': { color: '#11a8cd' },
          '& .log-spring': { color: '#d670d6' },
          '& .log-nginx': { color: '#f5f543' },
          '& .log-db': { color: '#cd3131' },
          '& .log-timestamp': { color: '#666666' },
        }}
        ref={logsContainerRef}
        onScroll={handleScroll}
      >
        {/* Loading indicator if no logs yet */}
        {isLoading && finalLinesToRender.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress color="inherit" size={24} />
          </Box>
        ) : finalLinesToRender.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            No logs available
          </Box>
        ) : (
          <>
            {finalLinesToRender.map((line, index) => (
              <Box
                key={index}
                sx={{
                  py: 0.1,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
                dangerouslySetInnerHTML={{
                  __html: colorizeLog(line),
                }}
              />
            ))}
            <div ref={logsEndRef} />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ContainerLogs;
