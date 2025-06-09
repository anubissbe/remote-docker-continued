import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Terminal as TerminalIcon,
  Storage as StorageIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ddClient } from '../../utils/ddClient';
import { MCPServer, PredefinedServer } from './types';

interface MCPServersProps {
  currentEnv?: {
    name: string;
    hostname: string;
    username: string;
  };
}

const MCPServers: React.FC<MCPServersProps> = ({ currentEnv }) => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [predefinedServers, setPredefinedServers] = useState<PredefinedServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPredefined, setSelectedPredefined] = useState<PredefinedServer | null>(null);
  const [customName, setCustomName] = useState('');

  // Load servers
  const loadServers = async () => {
    if (!currentEnv) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await ddClient.extension?.vm?.service?.get('/mcp/servers');
      if (response && typeof response === 'object' && 'servers' in response) {
        setServers((response as any).servers);
      }
    } catch (err) {
      console.error('Error loading MCP servers:', err);
      setError('Failed to load MCP servers');
    } finally {
      setLoading(false);
    }
  };

  // Load predefined server configurations
  const loadPredefinedServers = async () => {
    try {
      const response = await ddClient.extension?.vm?.service?.get('/mcp/predefined');
      if (Array.isArray(response)) {
        setPredefinedServers(response);
      } else {
        setPredefinedServers([]);
      }
    } catch (err) {
      console.error('Error loading predefined servers:', err);
    }
  };

  useEffect(() => {
    loadPredefinedServers();
  }, []);

  useEffect(() => {
    if (currentEnv) {
      loadServers();
    }
  }, [currentEnv]);

  // Create a new MCP server
  const handleCreateServer = async () => {
    if (!currentEnv || !selectedPredefined) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const request = {
        name: customName || selectedPredefined.name,
        type: selectedPredefined.type,
        config: selectedPredefined.config,
      };
      
      await ddClient.extension?.vm?.service?.post(
        `/mcp/servers?username=${currentEnv.username}&hostname=${currentEnv.hostname}`,
        request
      );
      
      // Close dialog and reload
      setCreateDialogOpen(false);
      setSelectedPredefined(null);
      setCustomName('');
      loadServers();
      
      ddClient.desktopUI?.toast?.success('MCP server created successfully');
    } catch (err) {
      console.error('Error creating MCP server:', err);
      setError('Failed to create MCP server');
      ddClient.desktopUI?.toast?.error('Failed to create MCP server');
    } finally {
      setLoading(false);
    }
  };

  // Start/stop server
  const handleToggleServer = async (server: MCPServer) => {
    if (!currentEnv) return;
    
    const action = server.status === 'running' ? 'stop' : 'start';
    
    try {
      await ddClient.extension?.vm?.service?.post(
        `/mcp/servers/${server.id}/${action}?username=${currentEnv.username}&hostname=${currentEnv.hostname}`,
        {}
      );
      
      ddClient.desktopUI?.toast?.success(`MCP server ${action}ed successfully`);
      loadServers();
    } catch (err) {
      console.error(`Error ${action}ing MCP server:`, err);
      ddClient.desktopUI?.toast?.error(`Failed to ${action} MCP server`);
    }
  };

  // Delete server
  const handleDeleteServer = async (server: MCPServer) => {
    if (!currentEnv) return;
    
    if (!confirm(`Are you sure you want to delete the MCP server "${server.name}"?`)) {
      return;
    }
    
    try {
      await ddClient.extension?.vm?.service?.delete(
        `/mcp/servers/${server.id}?username=${currentEnv.username}&hostname=${currentEnv.hostname}`
      );
      
      ddClient.desktopUI?.toast?.success('MCP server deleted successfully');
      loadServers();
    } catch (err) {
      console.error('Error deleting MCP server:', err);
      ddClient.desktopUI?.toast?.error('Failed to delete MCP server');
    }
  };

  // Get icon for server type
  const getServerIcon = (type: string) => {
    switch (type) {
      case 'filesystem':
        return <FolderIcon />;
      case 'docker':
        return <StorageIcon />;
      case 'shell':
        return <TerminalIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'default';
      case 'error':
        return 'error';
      case 'creating':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!currentEnv) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          Please connect to a remote environment to manage MCP servers
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">MCP Servers</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={loadServers} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading}
          >
            New Server
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && servers.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : servers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            No MCP servers configured
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Create your first MCP server
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {servers.map((server) => (
            <Grid item xs={12} md={6} lg={4} key={server.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getServerIcon(server.type)}
                      <Typography variant="h6">{server.name}</Typography>
                    </Stack>
                    <Chip
                      label={server.status}
                      color={getStatusColor(server.status) as any}
                      size="small"
                    />
                  </Stack>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Type: {server.type}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Port: {server.port}
                  </Typography>

                  <Stack direction="row" spacing={1} mt={2}>
                    <Tooltip title={server.status === 'running' ? 'Stop' : 'Start'}>
                      <IconButton
                        onClick={() => handleToggleServer(server)}
                        disabled={server.status === 'creating' || server.status === 'error'}
                        color={server.status === 'running' ? 'error' : 'success'}
                      >
                        {server.status === 'running' ? <StopIcon /> : <PlayIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDeleteServer(server)}
                        disabled={server.status === 'running'}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Server Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create MCP Server</DialogTitle>
        <DialogContent>
          {!selectedPredefined ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {predefinedServers.map((server) => (
                <Grid item xs={12} sm={6} key={server.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setSelectedPredefined(server)}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        {getServerIcon(server.type)}
                        <Typography variant="h6">{server.name}</Typography>
                      </Stack>
                      <Typography variant="body2" color="textSecondary">
                        {server.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                Selected: {selectedPredefined.name} - {selectedPredefined.description}
              </Alert>
              <TextField
                label="Server Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={selectedPredefined.name}
                fullWidth
                helperText="Leave empty to use default name"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {selectedPredefined && (
            <Button onClick={() => setSelectedPredefined(null)}>
              Back
            </Button>
          )}
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          {selectedPredefined && (
            <Button
              onClick={handleCreateServer}
              variant="contained"
              disabled={loading}
            >
              Create
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MCPServers;