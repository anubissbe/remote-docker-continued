import React, { useState, useEffect } from 'react';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Skeleton,
  useTheme,
  TablePagination
} from '@mui/material';

// Charts
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// Icons
import StorageIcon from '@mui/icons-material/Storage';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import ViewListIcon from '@mui/icons-material/ViewList';
import MemoryIcon from '@mui/icons-material/Memory';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import AppsIcon from '@mui/icons-material/Apps';

import { Environment, ExtensionSettings } from '../App';
import AutoRefreshControls from '../components/AutoRefreshControls';

// Type definitions for the dashboard API responses
interface DashboardOverview {
  containers: {
    total: number;
    running: number;
    stopped: number;
  };
  images: {
    total: number;
    size: string;
  };
  volumes: {
    total: number;
    size: string;
  };
  networks: {
    total: number;
  };
  composeProjects: {
    total: number;
    running: number;
    partial: number;
    stopped: number;
  };
}

interface ContainerResource {
  id: string;
  name: string;
  cpuPerc: string;
  cpuUsage: number;
  memUsage: string;
  memPerc: string;
  memValue: number;
  netIO: string;
  blockIO: string;
}

interface ResourcesResponse {
  containers: ContainerResource[];
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

interface SystemInfoResponse {
  dockerVersion: string;
  apiVersion: string;
  os: string;
  architecture: string;
  cpus: number;
  memory: string;
  dockerRoot: string;
  serverTime: string;
  experimentalMode: boolean;
}

interface DockerEvent {
  time: number;
  timeStr: string;
  type: string;
  action: string;
  actor: string;
  scope: string;
  status: string;
  message: string;
  category: 'info' | 'warning' | 'error';
}

interface EventsResponse {
  events: DockerEvent[];
}

interface DashboardRequest {
  hostname: string;
  username: string;
}

interface DashboardProps {
  activeEnvironment?: Environment;
  settings: ExtensionSettings;
  onSetActiveEnvironment: (environmentId: string | undefined) => void;
}

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

// Helper function to truncate container names
const truncateContainerName = (name: string, maxLength: number = 20): string => {
  if (!name) return '';

  // Remove docker prefix if present
  let cleanName = name;
  if (name.startsWith('/')) {
    cleanName = name.substring(1);
  }

  if (cleanName.length <= maxLength) {
    return cleanName;
  }

  // Try to extract meaningful parts
  const parts = cleanName.split('_');
  if (parts.length > 1) {
    // If there are multiple parts, try to use the last part which might be more specific
    const lastPart = parts[parts.length - 1];
    if (lastPart.length <= maxLength) {
      return lastPart;
    }
  }

  // Fallback to simple truncation with ellipsis
  return cleanName.substring(0, maxLength - 3) + '...';
};

const Dashboard: React.FC<DashboardProps> = ({
                                               activeEnvironment,
                                               settings,
                                               onSetActiveEnvironment
                                             }) => {
  const theme = useTheme();
  const ddClient = useDockerDesktopClient();

  // State for dashboard data
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [resources, setResources] = useState<ResourcesResponse | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfoResponse | null>(null);
  const [events, setEvents] = useState<DockerEvent[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // Default 30 seconds
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Container resource table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Initialize data when component mounts or active environment changes
  useEffect(() => {
    if (activeEnvironment) {
      loadDashboardData();
    } else {
      setOverview(null);
      setResources(null);
      setSystemInfo(null);
      setEvents([]);
      setIsLoading(false);
    }
  }, [activeEnvironment]);

  // Auto-refresh interval setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh && activeEnvironment) {
      intervalId = setInterval(() => {
        loadDashboardData();
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

  // Load all dashboard data
  const loadDashboardData = async () => {
    if (!activeEnvironment) {
      setError('No environment selected');
      return;
    }

    // Don't show full loading spinner on refreshes
    if (!overview || !resources || !systemInfo) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError('');

    try {
      // Check if Docker Desktop service is available
      if (!ddClient.extension?.vm?.service) {
        throw new Error('Docker Desktop service not available');
      }

      // Prepare request payload
      const requestPayload: DashboardRequest = {
        hostname: activeEnvironment.hostname,
        username: activeEnvironment.username,
      };

      // Load overview data
      const overviewResponse = await ddClient.extension.vm.service.post('/dashboard/overview', requestPayload);
      let overviewData = overviewResponse;
      if (overviewResponse && typeof overviewResponse === 'object' && 'data' in overviewResponse) {
        overviewData = overviewResponse.data;
      }
      if (overviewData && typeof overviewData === 'object' && 'error' in overviewData) {
        throw new Error(overviewData.error as string);
      }
      setOverview(overviewData as DashboardOverview);

      // Load resource usage data
      const resourcesResponse = await ddClient.extension.vm.service.post('/dashboard/resources', requestPayload);
      let resourcesData = resourcesResponse;
      if (resourcesResponse && typeof resourcesResponse === 'object' && 'data' in resourcesResponse) {
        resourcesData = resourcesResponse.data;
      }
      if (resourcesData && typeof resourcesData === 'object' && 'error' in resourcesData) {
        throw new Error(resourcesData.error as string);
      }
      setResources(resourcesData as ResourcesResponse);

      // Load system info
      const systemInfoResponse = await ddClient.extension.vm.service.post('/dashboard/systeminfo', requestPayload);
      let systemInfoData = systemInfoResponse;
      if (systemInfoResponse && typeof systemInfoResponse === 'object' && 'data' in systemInfoResponse) {
        systemInfoData = systemInfoResponse.data;
      }
      if (systemInfoData && typeof systemInfoData === 'object' && 'error' in systemInfoData) {
        throw new Error(systemInfoData.error as string);
      }
      setSystemInfo(systemInfoData as SystemInfoResponse);

      // Load events
      const eventsResponse = await ddClient.extension.vm.service.post('/dashboard/events', requestPayload);
      let eventsData = eventsResponse;
      if (eventsResponse && typeof eventsResponse === 'object' && 'data' in eventsResponse) {
        eventsData = eventsResponse.data;
      }
      if (eventsData && typeof eventsData === 'object' && 'error' in eventsData) {
        throw new Error(eventsData.error as string);
      }
      setEvents((eventsData as EventsResponse).events);

      setLastRefreshTime(new Date());
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-refresh handlers
  const handleAutoRefreshChange = (enabled: boolean) => {
    setAutoRefresh(enabled);
  };

  const handleIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Resource Card Component
  const ResourceCard = ({
                          icon,
                          title,
                          count,
                          subtext,
                          color = 'primary'
                        }: {
    icon: React.ReactNode;
    title: string;
    count: number | string;
    subtext?: string;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  }) => (
    <Card sx={{
      height: '100%',
      border: 1,
      borderColor: 'divider',
      boxShadow: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <CardContent sx={{ p: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{
            mr: 1,
            color: `${color}.main`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'medium', mb: 0.5 }}>
          {isLoading ? <Skeleton width="60%" /> : count}
        </Typography>
        {subtext && (
          <Typography variant="body2" color="text.secondary">
            {isLoading ? <Skeleton width="80%" /> : subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Prepare container data for charts
  const prepareContainerChartData = () => {
    if (!resources || resources.containers.length === 0) {
      return [];
    }

    // Sort containers by CPU usage
    return [...resources.containers]
      .sort((a, b) => b.cpuUsage - a.cpuUsage)
      .slice(0, 10) // Top 10 containers
      .map(container => ({
        ...container,
        // Create a shortened version for display
        displayName: truncateContainerName(container.name)
      }));
  };

  // Rendering the container stats chart
  const renderContainerStatsChart = () => {
    const chartData = prepareContainerChartData();

    if (chartData.length === 0) {
      return (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No container resource data available
          </Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="displayName"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
          />
          <YAxis yAxisId="cpu" orientation="left" label={{ value: 'CPU %', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="memory" orientation="right" label={{ value: 'Memory %', angle: 90, position: 'insideRight' }} />
          <RechartsTooltip
            formatter={(value, name) => [`${value}%`, name === 'cpuUsage' ? 'CPU Usage' : 'Memory Usage']}
            labelFormatter={(label, items) => {
              // Find the original container name from the shortened display name
              const item = items[0]?.payload;
              return `Container: ${item?.name || label}`;
            }}
          />
          <Legend />
          <Bar
            yAxisId="cpu"
            dataKey="cpuUsage"
            name="CPU Usage"
            fill={theme.palette.primary.main}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="memory"
            dataKey="memValue"
            name="Memory Usage"
            fill={theme.palette.secondary.main}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render container resource table
  const renderContainerStatsTable = () => {
    if (!resources || resources.containers.length === 0) {
      return (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No container resource data available
          </Typography>
        </Box>
      );
    }

    // Sort containers by CPU usage
    const sortedContainers = [...resources.containers].sort((a, b) => b.cpuUsage - a.cpuUsage);

    // Apply pagination
    const paginatedContainers = sortedContainers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return (
      <Box>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Container</TableCell>
                <TableCell align="right">CPU</TableCell>
                <TableCell align="right">Memory</TableCell>
                <TableCell align="right">Network I/O</TableCell>
                <TableCell align="right">Block I/O</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedContainers.map((container) => (
                <TableRow key={container.id} hover>
                  <TableCell>
                    <Tooltip title={container.name}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <Typography
                          noWrap
                          variant="body2"
                          sx={{ fontWeight: 'medium' }}
                        >
                          {truncateContainerName(container.name)}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={container.cpuPerc}
                      size="small"
                      color={container.cpuUsage > 50 ? "warning" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={container.memUsage}>
                      <Chip
                        label={container.memPerc}
                        size="small"
                        color={container.memValue > 80 ? "error" : container.memValue > 50 ? "warning" : "default"}
                        variant="outlined"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{container.netIO}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{container.blockIO}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={resources.containers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    );
  };

  // Render system resource gauges
  const renderSystemResources = () => {
    if (!resources) {
      return (
        <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isLoading ? (
            <CircularProgress size={30} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No system resource data available
            </Typography>
          )}
        </Box>
      );
    }

    const gaugeData = [
      { name: 'CPU', value: resources.system.cpuUsage, fill: theme.palette.primary.main },
      { name: 'Memory', value: resources.system.memoryUsage, fill: theme.palette.secondary.main },
      { name: 'Disk', value: resources.system.diskUsage, fill: theme.palette.success.main },
    ];

    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-around', p: 2, height: 200 }}>
        {gaugeData.map((item) => (
          <Box key={item.name} sx={{ textAlign: 'center', width: '33%' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {item.name}
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={item.value > 100 ? 100 : item.value}
                size={100}
                thickness={5}
                sx={{
                  color:
                    item.value > 80 ? theme.palette.error.main :
                      item.value > 60 ? theme.palette.warning.main :
                        item.fill
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" component="div" color="text.secondary">
                  {`${Math.round(item.value)}%`}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // Render container distribution pie chart
  const renderContainerDistribution = () => {
    if (!overview) {
      return (
        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isLoading ? (
            <CircularProgress size={30} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No overview data available
            </Typography>
          )}
        </Box>
      );
    }

    const data = [
      { name: 'Running', value: overview.containers.running, fill: theme.palette.success.main },
      { name: 'Stopped', value: overview.containers.stopped, fill: theme.palette.error.light },
    ];

    // Don't render the chart if there are no containers
    if (overview.containers.total === 0) {
      return (
        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No containers found
          </Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <RechartsTooltip formatter={(value) => [`${value} containers`, 'Count']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render events table
  const renderEvents = () => {
    if (events.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recent events found
            </Typography>
          )}
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ maxHeight: 300, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Resource</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.slice(0, 15).map((event, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {event.category === 'error' && (
                      <ErrorIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                    )}
                    {event.category === 'warning' && (
                      <WarningIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                    )}
                    {event.category === 'info' && (
                      <InfoIcon color="info" fontSize="small" sx={{ mr: 1 }} />
                    )}
                    {event.timeStr}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={event.type}
                    size="small"
                    variant="outlined"
                    color={
                      event.type === 'container' ? 'primary' :
                        event.type === 'image' ? 'secondary' :
                          event.type === 'volume' ? 'success' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>{event.action}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Tooltip title={event.actor}>
                    <span>{truncateContainerName(event.actor, 30)}</span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render system info
  const renderSystemInfo = () => {
    if (!systemInfo) {
      return (
        <Box sx={{ p: 2 }}>
          {isLoading ? (
            <Box>
              <Skeleton variant="text" width="100%" height={30} />
              <Skeleton variant="text" width="100%" height={30} />
              <Skeleton variant="text" width="100%" height={30} />
              <Skeleton variant="text" width="100%" height={30} />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No system information available
            </Typography>
          )}
        </Box>
      );
    }

    return (
      <List dense sx={{ width: '100%' }}>
        <ListItem>
          <ListItemIcon>
            <DeveloperBoardIcon />
          </ListItemIcon>
          <ListItemText
            primary="Docker Version"
            secondary={systemInfo.dockerVersion}
            primaryTypographyProps={{ variant: 'body2' }}
            secondaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemIcon>
            <MemoryIcon />
          </ListItemIcon>
          <ListItemText
            primary="System Resources"
            secondary={`${systemInfo.cpus} CPUs, ${systemInfo.memory}`}
            primaryTypographyProps={{ variant: 'body2' }}
            secondaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemIcon>
            <StorageIcon />
          </ListItemIcon>
          <ListItemText
            primary="Docker Root Directory"
            secondary={systemInfo.dockerRoot}
            primaryTypographyProps={{ variant: 'body2' }}
            secondaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemIcon>
            <AppsIcon />
          </ListItemIcon>
          <ListItemText
            primary="OS / Architecture"
            secondary={`${systemInfo.os} / ${systemInfo.architecture}`}
            primaryTypographyProps={{ variant: 'body2' }}
            secondaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      </List>
    );
  };

  return (
    <Box>
      {/* Header with refresh controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Dashboard</Typography>
        <AutoRefreshControls
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
          lastRefreshTime={lastRefreshTime}
          isRefreshing={isRefreshing}
          isDisabled={!activeEnvironment}
          onRefreshClick={loadDashboardData}
          onAutoRefreshChange={handleAutoRefreshChange}
          onIntervalChange={handleIntervalChange}
        />
      </Box>

      {/* No environment */}
      {!activeEnvironment && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select an environment to view the dashboard.
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard content */}
      {activeEnvironment && (
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
                zIndex: 1
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* Resource overview cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <ResourceCard
                icon={<ViewListIcon fontSize="small" />}
                title="Containers"
                count={overview?.containers.total || 0}
                subtext={overview ? `${overview.containers.running} running, ${overview.containers.stopped} stopped` : undefined}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ResourceCard
                icon={<PhotoLibraryIcon fontSize="small" />}
                title="Images"
                count={overview?.images.total || 0}
                subtext={overview?.images.size}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ResourceCard
                icon={<StorageIcon fontSize="small" />}
                title="Volumes"
                count={overview?.volumes.total || 0}
                subtext={overview?.volumes.size}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ResourceCard
                icon={<NetworkCheckIcon fontSize="small" />}
                title="Networks"
                count={overview?.networks.total || 0}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Main dashboard content */}
          <Grid container spacing={3}>
            {/* Left column */}
            <Grid item xs={12} md={8} container spacing={3} direction="column">
              {/* Container stats section with tabs */}
              <Grid item>
                <Card sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                  <CardHeader
                    title="Container Resources"
                    titleTypographyProps={{ variant: 'h6' }}
                    sx={{ borderBottom: 1, borderColor: 'divider', p: 2, pb: 0 }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    {renderContainerStatsTable()}
                  </CardContent>

                </Card>
              </Grid>

              {/* System resources */}
              <Grid item>
                <Card sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                  <CardHeader
                    title="System Resources"
                    titleTypographyProps={{ variant: 'h6' }}
                    sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    {renderSystemResources()}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent events */}
              <Grid item>
                <Card sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                  <CardHeader
                    title="Recent Events"
                    titleTypographyProps={{ variant: 'h6' }}
                    sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    {renderEvents()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Right column */}
            <Grid item xs={12} md={4} container spacing={3} direction="column">
              {/* Container distribution */}
              <Grid item>
                <Card sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                  <CardHeader
                    title="Container Distribution"
                    titleTypographyProps={{ variant: 'h6' }}
                    sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    {renderContainerDistribution()}
                  </CardContent>
                </Card>
              </Grid>

              {/* System information */}
              <Grid item>
                <Card sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                  <CardHeader
                    title="System Information"
                    titleTypographyProps={{ variant: 'h6' }}
                    sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    {renderSystemInfo()}
                  </CardContent>
                </Card>
              </Grid>

              {/* Server time */}
              {systemInfo && (
                <Grid item>
                  <Card sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Server Time
                      </Typography>
                      <Typography variant="body1">
                        {systemInfo.serverTime}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;