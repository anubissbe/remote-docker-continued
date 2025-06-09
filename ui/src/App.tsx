import React, { useState, useEffect, useRef } from 'react';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Button,
  useTheme
} from '@mui/material';

// Icons
import ViewListIcon from '@mui/icons-material/ViewList';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import StorageIcon from '@mui/icons-material/Storage';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';

// Import pages
import Dashboard from './pages/Dashboard';
import Containers from './pages/docker/Containers';
import Images from './pages/docker/Images';
import Volumes from './pages/docker/Volumes';
import Networks from './pages/docker/Networks';
import Environments from './pages/settings/Environments';

// Note: This line relies on Docker Desktop's presence as a host application.
const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

// Environment interface
export interface Environment {
  id: string;
  name: string;
  hostname: string;
  username: string;
}

// Settings interface
export interface ExtensionSettings {
  environments: Environment[];
  activeEnvironmentId?: string;
  autoConnect?: boolean;
}

// Create a type for pages
type PageKey =
  | 'dashboard'
  | 'containers'
  | 'images'
  | 'volumes'
  | 'networks'
  | 'environments';

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  category: 'docker' | 'settings';
}

const drawerWidth = 240;

export function App() {
  const theme = useTheme();
  const ddClient = useDockerDesktopClient();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [settings, setSettings] = useState<ExtensionSettings>({
    environments: [],
    autoConnect: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // New state for SSH tunnel management
  const [isTunnelActive, setIsTunnelActive] = useState(false);
  const [tunnelError, setTunnelError] = useState('');
  const [isTunnelLoading, setIsTunnelLoading] = useState(false);
  const visibilityRef = useRef(true);

  // New state for logs modal context
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Navigation items
  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, category: 'docker' },
    { key: 'containers', label: 'Containers', icon: <ViewListIcon />, category: 'docker' },
    { key: 'images', label: 'Images', icon: <PhotoLibraryIcon />, category: 'docker' },
    { key: 'volumes', label: 'Volumes', icon: <StorageIcon />, category: 'docker' },
    { key: 'networks', label: 'Networks', icon: <NetworkCheckIcon />, category: 'docker' },
    { key: 'environments', label: 'Environments', icon: <SettingsIcon />, category: 'settings' }
  ];

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Set up visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      visibilityRef.current = isVisible;

      // If we return to the extension and have an active environment, ensure tunnel is open
      if (isVisible && settings.activeEnvironmentId && settings.autoConnect) {
        const env = getActiveEnvironment();
        if (env && settings.autoConnect) {
          checkAndOpenTunnel(env);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings.activeEnvironmentId]);

  // Load settings from extension storage
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Add detailed debugging
      console.log('Starting loadSettings...');
      console.log('ddClient:', ddClient);
      console.log('ddClient.extension:', ddClient.extension);
      console.log('ddClient.extension?.vm:', ddClient.extension?.vm);
      console.log('ddClient.extension?.vm?.service:', ddClient.extension?.vm?.service);
      
      if (!ddClient.extension?.vm?.service) {
        throw new Error('Docker Desktop service not available - Extension API not initialized properly');
      }

      const response = await ddClient.extension.vm.service.get('/settings');

      // Parse response if it's a string
      let parsedSettings: ExtensionSettings;
      if (typeof response === 'string') {
        parsedSettings = JSON.parse(response);
      } else {
        parsedSettings = response as ExtensionSettings;
      }

      setSettings(parsedSettings);
      console.log('Settings loaded:', parsedSettings);

      // Check if we have an active environment and if so, open its tunnel
      if (parsedSettings.activeEnvironmentId) {
        const activeEnv = parsedSettings.environments.find(
          env => env.id === parsedSettings.activeEnvironmentId
        );
        if (activeEnv && settings.autoConnect) {
          checkAndOpenTunnel(activeEnv);
        }
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings: ' + (err.message || 'Unknown error'));
      // Only show toast if ddClient.desktopUI is available
      if (ddClient.desktopUI?.toast) {
        ddClient.desktopUI.toast.error('Failed to load settings: ' + (err.message || 'Unknown error'));
      }
      // Initialize with empty settings if loading fails
      setSettings({
        environments: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings to extension storage
  const saveSettings = async (newSettings: ExtensionSettings): Promise<boolean> => {
    try {
      if (!ddClient.extension?.vm?.service) {
        throw new Error('Docker Desktop service not available');
      }

      const stringifiedSettings = JSON.stringify(newSettings);
      const response = await ddClient.extension.vm.service.post('/settings', stringifiedSettings);

      // Check if the response indicates success
      const success = response && typeof response === 'object' && 'success' in response;

      if (success) {
        setSettings(newSettings);
        console.log('Settings saved successfully:', newSettings);
        return true;
      } else {
        console.error('Failed to save settings, unexpected response:', response);
        return false;
      }
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings: ' + (err.message || 'Unknown error'));
      ddClient.desktopUI.toast.error('Failed to save settings: ' + (err.message || 'Unknown error'));
      return false;
    }
  };

  // Get active environment
  const getActiveEnvironment = (): Environment | undefined => {
    if (!settings.activeEnvironmentId) return undefined;
    return settings.environments.find(env => env.id === settings.activeEnvironmentId);
  };

  interface TunnelResponse {
    success?: string;
    error?: string;
  }

  // SSH Tunnel management functions
  const openTunnel = async (env: Environment) => {
    if (!env) return;

    setIsTunnelLoading(true);
    try {
      setTunnelError('');
      const response = await ddClient.extension.vm?.service?.post('/tunnel/open', {
        hostname: env.hostname,
        username: env.username
      }) as TunnelResponse;

      if (response && response.success === "true") {
        setIsTunnelActive(true);
        console.log(`SSH tunnel opened for ${env.username}@${env.hostname}`);
      } else {
        throw new Error((response && response.error) || 'Unknown error opening SSH tunnel');
      }
    } catch (err: any) {
      console.error('Failed to open SSH tunnel:', err);
      setTunnelError(`Failed to open SSH tunnel: ${err.message || 'Unknown error'}`);
      ddClient.desktopUI.toast.error('Failed to open SSH tunnel: ' + (err.message || 'Unknown error'));
      setIsTunnelActive(false);
    } finally {
      setIsTunnelLoading(false);
    }
  };

  const closeTunnel = async (env: Environment) => {
    if (!env) return;

    setIsTunnelLoading(true);
    try {
      const response = await ddClient.extension.vm?.service?.post('/tunnel/close', {
        hostname: env.hostname,
        username: env.username
      }) as TunnelResponse;

      if (response && response.success === "true") {
        setIsTunnelActive(false);
        console.log(`SSH tunnel closed for ${env.username}@${env.hostname}`);
      }
    } catch (err: any) {
      console.error('Failed to close SSH tunnel:', err);
      // Even if we fail to close it cleanly, consider it closed from the UI perspective
      setIsTunnelActive(false);
    } finally {
      setIsTunnelLoading(false);
    }
  };

  interface TunnelStatusResponse {
    active: string | boolean;
  }

  const checkTunnelStatus = async (env: Environment) => {
    if (!env) return;

    try {
      const response = await ddClient.extension.vm?.service?.get(`/tunnel/status?username=${env.username}&hostname=${env.hostname}`);

      if (response && typeof response === 'object') {
        const typedResponse = response as TunnelStatusResponse;
        setIsTunnelActive(typedResponse.active === true);
      }
    } catch (err: any) {
      console.error('Failed to check SSH tunnel status:', err);
      setIsTunnelActive(false);
    }
  };

  const checkAndOpenTunnel = async (env: Environment) => {
    if (!env) return;

    // First check if tunnel is already active
    await checkTunnelStatus(env);

    // If not active, open it
    if (!isTunnelActive) {
      await openTunnel(env);
    }
  };

  // Set active environment and manage the tunnel
  const setActiveEnvironment = async (environmentId: string | undefined) => {
    // If we had a previous active environment, close its tunnel
    const prevEnv = getActiveEnvironment();
    if (prevEnv) {
      await closeTunnel(prevEnv);
    }

    // Update the active environment in settings
    const newSettings = {
      ...settings,
      activeEnvironmentId: environmentId
    };

    const success = await saveSettings(newSettings);

    // If we have a new active environment, open its tunnel
    if (success && environmentId) {
      const newEnv = settings.environments.find(env => env.id === environmentId);
      if (newEnv) {
        await openTunnel(newEnv);
      }
    }
  };

  // Handle environment change
  const handleEnvironmentChange = (event: SelectChangeEvent<string>) => {
    const envId = event.target.value;
    setActiveEnvironment(envId === "none" ? undefined : envId);
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Close any active tunnels when component unmounts
      const activeEnv = getActiveEnvironment();
      if (activeEnv) {
        closeTunnel(activeEnv);
      }
    };
  }, []);

  // Render current page
  const renderPage = () => {
    const activeEnvironment = getActiveEnvironment();

    if (currentPage === 'environments') {
      return (
        <Environments
          settings={settings}
          onSaveSettings={saveSettings}
          onSetActiveEnvironment={setActiveEnvironment}
        />
      );
    }

    if (!isTunnelActive) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Alert severity="error">
            SSH tunnel is not connected. Please select an environment to connect or try to reconnect.
          </Alert>
        </Box>
      );
    }


    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            activeEnvironment={activeEnvironment}
            settings={settings}
            onSetActiveEnvironment={setActiveEnvironment}
          />
        );
      case 'containers':
        return (
          <Containers
            activeEnvironment={activeEnvironment}
            settings={settings}
            isLogsOpen={isLogsOpen}
            setIsLogsOpen={setIsLogsOpen}
          />
        );
      case 'images':
        return (
          <Images
            activeEnvironment={activeEnvironment}
            settings={settings}
          />
        );
      case 'volumes':
        return (
          <Volumes
            activeEnvironment={activeEnvironment}
            settings={settings}
          />
        );
      case 'networks':
        return (
          <Networks
            activeEnvironment={activeEnvironment}
            settings={settings}
          />
        );
      default:
        return <Typography>Page not found</Typography>;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Extension initialization failed
          </Typography>
          <Typography variant="body2" paragraph>
            {error}
          </Typography>
          <Typography variant="body2" paragraph>
            Please check:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Docker Desktop is running</li>
            <li>The extension is properly installed</li>
            <li>Try reinstalling the extension</li>
          </ul>
          <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Reload
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* App bar with SSH tunnel status */}
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: 'inherit',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'background-color 0.2s ease',
          filter: isLogsOpen ? 'brightness(0.97)' : 'none'
        }}
      >
        <Toolbar sx={{
          minHeight: '56px',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: '1rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              height: '100%'
            }}
          >
            {navItems.find(item => item.key === currentPage)?.label || 'Remote Docker'}
          </Typography>

          {/* SSH Tunnel Status Indicator */}
          {getActiveEnvironment() && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2,
              typography: 'body2',
              color: isTunnelActive ? 'success.main' : 'error.main',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}>
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isTunnelActive ? 'success.main' : 'error.main',
                  mr: 1
                }}
              />
              {isTunnelActive ? 'SSH Connected' : 'SSH Disconnected'}
              {isTunnelActive && (
                <Button
                  size="small"
                  color="primary"
                  variant="text"
                  onClick={() => {
                    const env = getActiveEnvironment();
                    if (env) closeTunnel(env);
                  }}
                  disabled={isTunnelLoading || isLogsOpen}
                  sx={{ ml: 1, py: 0, minWidth: 'auto' }}
                >
                  {isTunnelLoading ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              )}
              {!isTunnelActive && (
                <Button
                  size="small"
                  color="primary"
                  variant="text"
                  onClick={() => {
                    const env = getActiveEnvironment();
                    if (env) openTunnel(env);
                  }}
                  disabled={isTunnelLoading || isLogsOpen}
                  sx={{ ml: 1, py: 0, minWidth: 'auto' }}
                >
                  {isTunnelLoading ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </Box>
          )}

          {/* Environment selector dropdown */}
          {currentPage !== 'environments' && settings.environments.length > 0 && (
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                opacity: isLogsOpen ? 0.6 : 1,
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: (theme) => theme.palette.background.default
                },
                '& .MuiSelect-select': {
                  py: 1,
                  color: (theme) => theme.palette.background.default + 1,
                },
                '& .MuiInputLabel-root': {
                  color: (theme) => theme.palette.background.default + 1,
                }
              }}
            >
              <InputLabel id="environment-select-label">Environment</InputLabel>
              <Select
                labelId="environment-select-label"
                id="environment-select"
                value={settings.activeEnvironmentId || "none"}
                label="Environment"
                onChange={handleEnvironmentChange}
                disabled={isLogsOpen}
              >
                <MenuItem value="none">-- Select Environment --</MenuItem>
                {settings.environments.map((env) => (
                  <MenuItem key={env.id} value={env.id}>
                    {env.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar navigation */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: isLogsOpen ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
            filter: isLogsOpen ? 'brightness(0.97)' : 'none',
            transition: 'background-color 0.2s ease'
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar sx={{
          minHeight: '56px',
          px: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontSize: '1rem',
              fontWeight: (theme) => theme.typography.fontWeightMedium
            }}
          >
            Remote Docker
          </Typography>
        </Toolbar>

        {/* Docker resources section */}
        <List sx={{ py: 0 }}>
          {navItems.filter(item => item.category === 'docker').map((item) => (
            <ListItem key={item.key} disablePadding>
              <ListItemButton
                selected={currentPage === item.key}
                onClick={() => setCurrentPage(item.key)}
                disabled={isLogsOpen} // Disable while logs are open
                sx={{
                  py: 1,
                  minHeight: 48,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: currentPage === item.key ? 500 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />

        {/* Settings section */}
        <List sx={{ py: 0 }}>
          {navItems.filter(item => item.category === 'settings').map((item) => (
            <ListItem key={item.key} disablePadding>
              <ListItemButton
                selected={currentPage === item.key}
                onClick={() => setCurrentPage(item.key)}
                disabled={isLogsOpen} // Disable while logs are open
                sx={{
                  py: 1,
                  minHeight: 48,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: currentPage === item.key ? 500 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '56px', // Matches the toolbar height
          overflow: 'auto',
          bgcolor: isLogsOpen ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
          filter: isLogsOpen ? 'brightness(0.97)' : 'none',
          transition: 'background-color 0.2s ease'
        }}
      >

        {/* Render the current page */}
        {renderPage()}
      </Box>
    </Box>
  );
}