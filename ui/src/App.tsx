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
import { ErrorBoundary } from './components/ErrorBoundary';

// Icons
import ViewListIcon from '@mui/icons-material/ViewList';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import StorageIcon from '@mui/icons-material/Storage';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloudIcon from '@mui/icons-material/Cloud';

// Import pages
import Dashboard from './pages/Dashboard';
import Containers from './pages/docker/Containers';
import Images from './pages/docker/Images';
import Volumes from './pages/docker/Volumes';
import Networks from './pages/docker/Networks';
import Environments from './pages/settings/Environments';
import MCPServersWithCatalog from './components/MCP/MCPServersWithCatalog';

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
  | 'mcp'
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
  const connectionCheckRef = useRef<NodeJS.Timeout | null>(null);

  // New state for logs modal context
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Navigation items
  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, category: 'docker' },
    { key: 'containers', label: 'Containers', icon: <ViewListIcon />, category: 'docker' },
    { key: 'images', label: 'Images', icon: <PhotoLibraryIcon />, category: 'docker' },
    { key: 'volumes', label: 'Volumes', icon: <StorageIcon />, category: 'docker' },
    { key: 'networks', label: 'Networks', icon: <NetworkCheckIcon />, category: 'docker' },
    { key: 'mcp', label: 'MCP Servers', icon: <CloudIcon />, category: 'docker' },
    { key: 'environments', label: 'Environments', icon: <SettingsIcon />, category: 'settings' }
  ];

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Reconnect when extension becomes visible again
  useEffect(() => {
    // Function to check and reconnect if needed
    const checkAndReconnect = () => {
      if (settings.activeEnvironmentId && !isTunnelActive) {
        const env = getActiveEnvironment();
        if (env) {
          console.log('Extension became visible, reconnecting to:', env.id);
          checkAndOpenTunnel(env);
        }
      }
    };

    // Check on mount and when settings change
    checkAndReconnect();

    // Also set up a focus listener for when user returns to the extension
    const handleFocus = () => {
      console.log('Extension regained focus');
      setTimeout(checkAndReconnect, 100); // Small delay to let things stabilize
    };

    // Set up periodic check when extension is active
    if (settings.activeEnvironmentId) {
      // Clear any existing interval
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
      
      // Check every 5 seconds if we have an active environment but no tunnel
      connectionCheckRef.current = setInterval(() => {
        if (settings.activeEnvironmentId && !isTunnelActive && !isTunnelLoading) {
          console.log('Periodic check: tunnel not active, attempting reconnect');
          checkAndReconnect();
        }
      }, 5000);
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [settings.activeEnvironmentId, isTunnelActive]);

  // Remove automatic health checks that cause disconnections
  // Connection will only be managed manually through user actions

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

      // Docker Desktop API wraps the response
      let actualResponse = response;
      if (response && typeof response === 'object' && 'data' in response) {
        actualResponse = response.data;
      }

      // Parse response if it's a string
      let parsedSettings: ExtensionSettings;
      if (typeof actualResponse === 'string') {
        parsedSettings = JSON.parse(actualResponse);
      } else {
        parsedSettings = actualResponse as ExtensionSettings;
      }

      // Ensure settings have required structure
      if (!parsedSettings.environments) {
        parsedSettings.environments = [];
      }

      setSettings(parsedSettings);
      console.log('Settings loaded:', parsedSettings);

      // Check if we have an active environment and if so, open its tunnel
      if (parsedSettings.activeEnvironmentId) {
        const activeEnv = parsedSettings.environments.find(
          env => env.id === parsedSettings.activeEnvironmentId
        );
        if (activeEnv && parsedSettings.autoConnect) {
          console.log('Auto-connecting to saved environment:', activeEnv.id);
          checkAndOpenTunnel(activeEnv);
        } else {
          console.log('Active environment found but auto-connect disabled');
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

      console.log('Save settings response:', response, typeof response);
      
      // Docker Desktop API wraps the response
      let actualResponse = response;
      
      // If response has a 'data' property, that's the actual response from our backend
      if (response && typeof response === 'object' && 'data' in response) {
        actualResponse = response.data;
        console.log('Extracted data from wrapped response:', actualResponse);
      }
      
      // Docker Desktop API might return the response as a string
      let parsedResponse = actualResponse;
      if (typeof actualResponse === 'string') {
        try {
          parsedResponse = JSON.parse(actualResponse);
          console.log('Parsed response:', parsedResponse);
        } catch (e) {
          console.error('Failed to parse response as JSON:', actualResponse);
          // Show error to user
          ddClient.desktopUI.toast.error(`Backend returned invalid response: ${actualResponse}`);
          return false;
        }
      }
      
      // Check if the response indicates success
      // Accept both string "true" and boolean true for success property
      const success = parsedResponse && typeof parsedResponse === 'object' && 
                     ('success' in parsedResponse && (parsedResponse.success === 'true' || parsedResponse.success === true));

      if (success) {
        setSettings(newSettings);
        console.log('Settings saved successfully:', newSettings);
        ddClient.desktopUI.toast.success('Settings saved successfully');
        return true;
      } else {
        console.error('Failed to save settings, unexpected response:', response);
        ddClient.desktopUI.toast.error(`Failed to save settings. Response: ${JSON.stringify(parsedResponse)}`);
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
      });

      // Docker Desktop API wraps the response
      let actualResponse = response;
      if (response && typeof response === 'object' && 'data' in response) {
        actualResponse = response.data;
      }
      
      // Parse if string
      let tunnelResponse: TunnelResponse;
      if (typeof actualResponse === 'string') {
        tunnelResponse = JSON.parse(actualResponse);
      } else {
        tunnelResponse = actualResponse as TunnelResponse;
      }

      if (tunnelResponse && tunnelResponse.success === "true") {
        setIsTunnelActive(true);
        console.log(`SSH tunnel opened for ${env.username}@${env.hostname}`);
        ddClient.desktopUI.toast.success(`Connected to ${env.hostname}`);
      } else {
        throw new Error((tunnelResponse && tunnelResponse.error) || 'Unknown error opening SSH tunnel');
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

  const checkTunnelStatus = async (env: Environment): Promise<boolean> => {
    if (!env) return false;

    try {
      const response = await ddClient.extension.vm?.service?.get(`/tunnel/status?username=${env.username}&hostname=${env.hostname}`);

      if (response && typeof response === 'object') {
        // Handle wrapped response
        let actualResponse = response;
        if ('data' in response && response.data) {
          actualResponse = response.data;
        }
        
        // Parse if string
        if (typeof actualResponse === 'string') {
          try {
            actualResponse = JSON.parse(actualResponse);
          } catch (e) {
            console.error('Failed to parse tunnel status response');
            return false;
          }
        }
        
        const typedResponse = actualResponse as TunnelStatusResponse;
        const isActive = typedResponse.active === true || typedResponse.active === 'true';
        setIsTunnelActive(isActive);
        return isActive;
      }
      return false;
    } catch (err: any) {
      console.error('Failed to check SSH tunnel status:', err);
      setIsTunnelActive(false);
      return false;
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
    const prevEnv = getActiveEnvironment();
    
    console.log('setActiveEnvironment called:', { 
      prevEnv: prevEnv?.id, 
      newEnv: environmentId,
      currentActive: settings.activeEnvironmentId
    });
    
    // If we're setting the same environment, don't do anything
    if (settings.activeEnvironmentId === environmentId) {
      console.log('Same environment selected, no action needed');
      return;
    }

    // Update the active environment in settings first
    const newSettings = {
      ...settings,
      activeEnvironmentId: environmentId
    };

    const success = await saveSettings(newSettings);
    
    if (!success) {
      console.error('Failed to save settings, aborting environment change');
      return;
    }

    // Only close tunnel if switching to a completely different environment
    if (prevEnv && prevEnv.id !== environmentId) {
      console.log('Closing tunnel for previous environment:', prevEnv.id);
      await closeTunnel(prevEnv);
    }

    // If we have a new active environment, open its tunnel
    if (environmentId && environmentId !== prevEnv?.id) {
      const newEnv = settings.environments.find(env => env.id === environmentId);
      if (newEnv) {
        console.log('Opening tunnel for new environment:', newEnv.id);
        await openTunnel(newEnv);
      }
    }
  };

  // Handle environment change
  const handleEnvironmentChange = (event: SelectChangeEvent<string>) => {
    const envId = event.target.value;
    setActiveEnvironment(envId === "none" ? undefined : envId);
  };

  // Don't close tunnels on unmount - let them persist

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
      case 'mcp':
        return (
          <MCPServersWithCatalog
            currentEnv={activeEnvironment}
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
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'background-color 0.2s ease'
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
            bgcolor: 'background.paper',
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
          bgcolor: 'background.default',
          transition: 'background-color 0.2s ease'
        }}
      >

        {/* Render the current page */}
        {renderPage()}
      </Box>
    </Box>
  );
}