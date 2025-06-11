import { createDockerDesktopClient } from '@docker/extension-api-client';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { Environment, ExtensionSettings } from '../../App';
import AutoRefreshControls from '../../components/AutoRefreshControls';
import ConfirmationDialog from '../../components/ConfirmationDialog';

// Volume interface
interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  created: string;
  size: string;
  labels: string[];
}

// Error response interface
interface ErrorResponse {
  error: string;
  output?: string;
}

interface VolumesProps {
  activeEnvironment?: Environment;
  settings: ExtensionSettings;
}

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

const Volumes: React.FC<VolumesProps> = ({ activeEnvironment, settings }) => {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const ddClient = useDockerDesktopClient();

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // Default 30 seconds
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // For refresh indicator overlay

  // Confirmation dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);

  // Load volumes when active environment changes
  useEffect(() => {
    if (activeEnvironment) {
      loadVolumes();
    } else {
      // Clear volumes if no environment is selected
      setVolumes([]);
    }
  }, [activeEnvironment]);

  // Auto-refresh interval setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh && activeEnvironment) {
      intervalId = setInterval(() => {
        loadVolumes();
      }, refreshInterval * 1000);
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, activeEnvironment]);

  // Reset auto-refresh when tab changes or component unmounts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        setAutoRefresh(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setAutoRefresh(false);
    };
  }, []);

  // Load volumes from the active environment
  const loadVolumes = async () => {
    if (!activeEnvironment) {
      setError('No environment selected');
      return;
    }

    // For initial loading (empty volumes list)
    if (volumes.length === 0) {
      setIsLoading(true);
    } else {
      // For refreshing when we already have data
      setIsRefreshing(true);
    }

    setError('');

    try {
      // Check if Docker Desktop service is available
      if (!ddClient.extension?.vm?.service) {
        throw new Error('Docker Desktop service not available');
      }

      // Make API call to fetch volumes
      const response = await ddClient.extension.vm.service.post('/volumes/list', {
        hostname: activeEnvironment.hostname,
        username: activeEnvironment.username,
      });

      // Docker Desktop API wraps the response
      let actualResponse = response;
      if (response && typeof response === 'object' && 'data' in response) {
        actualResponse = response.data;
      }

      // Check for error response
      if (actualResponse && typeof actualResponse === 'object' && 'error' in actualResponse) {
        const errorResponse = actualResponse as ErrorResponse;
        throw new Error(errorResponse.error);
      }

      // Cast response to Volume array
      const volumeData = actualResponse as Volume[];
      setVolumes(volumeData);
      setLastRefreshTime(new Date()); // Update last refresh time
      console.log('Volumes loaded:', volumeData);
    } catch (err: any) {
      console.error('Failed to load volumes:', err);
      setError(`Failed to load volumes: ${err.message || 'Unknown error'}`);
      setVolumes([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Delete a volume
  const deleteVolume = async (volumeName: string) => {
    if (!activeEnvironment) {
      return;
    }

    setIsRefreshing(true);
    try {
      if (!ddClient.extension?.vm?.service) {
        throw new Error('Docker Desktop service not available');
      }

      const response = await ddClient.extension.vm.service.post('/volumes/remove', {
        hostname: activeEnvironment.hostname,
        username: activeEnvironment.username,
        volumeName,
      });

      // Docker Desktop API wraps the response
      let actualResponse = response;
      if (response && typeof response === 'object' && 'data' in response) {
        actualResponse = response.data;
      }

      if (actualResponse && typeof actualResponse === 'object' && 'error' in actualResponse) {
        const errorResponse = actualResponse as ErrorResponse;
        throw new Error(errorResponse.error);
      }

      // Reload volumes after successful operation
      await loadVolumes();
    } catch (err: any) {
      console.error('Failed to delete volume:', err);
      setError(`Failed to delete volume: ${err.message || 'Unknown error'}`);
      setIsRefreshing(false);
    }
  };

  // Confirmation dialog handlers
  const confirmDeleteVolume = (volume: Volume) => {
    setSelectedVolume(volume);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedVolume) {
      deleteVolume(selectedVolume.name);
    }
    setConfirmDialogOpen(false);
  };

  // Format volume size if available
  const formatSize = (size: string): string => {
    if (!size || size === 'N/A') {
      return 'N/A';
    }

    const sizeNum = parseInt(size, 10);
    if (isNaN(sizeNum)) {
      return size;
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let formattedSize = sizeNum;

    while (formattedSize >= 1024 && i < units.length - 1) {
      formattedSize /= 1024;
      i++;
    }

    return `${formattedSize.toFixed(2)} ${units[i]}`;
  };

  // Auto-refresh handlers
  const handleAutoRefreshChange = (enabled: boolean) => {
    setAutoRefresh(enabled);
  };

  const handleIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Volumes</Typography>

        <AutoRefreshControls
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
          lastRefreshTime={lastRefreshTime}
          isRefreshing={isRefreshing}
          isDisabled={!activeEnvironment}
          onRefreshClick={loadVolumes}
          onAutoRefreshChange={handleAutoRefreshChange}
          onIntervalChange={handleIntervalChange}
        />
      </Box>

      {/* Warning when no environment is selected */}
      {!activeEnvironment ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select an environment to view volumes.
        </Alert>
      ) : null}

      {/* Error message */}
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {/* Loading indicator for initial load only */}
      {isLoading && !volumes.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {/* Volumes table with refresh overlay */}
      {!isLoading && activeEnvironment && volumes.length > 0 ? (
        <Box sx={{ position: 'relative' }}>
          {/* Refresh overlay */}
          {isRefreshing && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: (theme) => theme.palette.background.default,
                opacity: 0.5,
                zIndex: 1,
                borderRadius: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Mount Point</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Labels</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {volumes.map((volume) => (
                  <TableRow key={volume.name} hover>
                    <TableCell>{volume.name}</TableCell>
                    <TableCell>{volume.driver}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Tooltip title={volume.mountpoint}>
                        <span>{volume.mountpoint}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{volume.created}</TableCell>
                    <TableCell>{formatSize(volume.size)}</TableCell>
                    <TableCell>
                      {volume.labels && volume.labels.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {volume.labels.map((label, index) => (
                            <Chip key={index} label={label} size="small" variant="outlined" />
                          ))}
                        </Box>
                      ) : (
                        'None'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => confirmDeleteVolume(volume)}
                          disabled={isRefreshing}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : !isLoading && activeEnvironment ? (
        <Alert severity="info">No volumes found in the selected environment.</Alert>
      ) : null}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Delete Volume"
        message={
          'Are you sure you want to delete this volume? All data stored in this volume will be permanently lost.'
        }
        confirmText="Delete"
        confirmColor="error"
        resourceName={selectedVolume?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </Box>
  );
};

export default Volumes;
