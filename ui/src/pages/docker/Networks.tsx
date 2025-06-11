import { createDockerDesktopClient } from '@docker/extension-api-client';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
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

// Network interface
interface Network {
  id: string;
  name: string;
  driver: string;
  scope: string;
  ipamDriver: string;
  subnet: string;
  gateway: string;
  internal: boolean;
}

// Error response interface
interface ErrorResponse {
  error: string;
  output?: string;
}

interface NetworksProps {
  activeEnvironment?: Environment;
  settings: ExtensionSettings;
}

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

const Networks: React.FC<NetworksProps> = ({ activeEnvironment, settings }) => {
  const [networks, setNetworks] = useState<Network[]>([]);
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
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

  // Load networks when active environment changes
  useEffect(() => {
    if (activeEnvironment) {
      loadNetworks();
    } else {
      // Clear networks if no environment is selected
      setNetworks([]);
    }
  }, [activeEnvironment]);

  // Auto-refresh interval setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh && activeEnvironment) {
      intervalId = setInterval(() => {
        loadNetworks();
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

  // Load networks from the active environment
  const loadNetworks = async () => {
    if (!activeEnvironment) {
      setError('No environment selected');
      return;
    }

    // For initial loading (empty networks list)
    if (networks.length === 0) {
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

      // Make API call to fetch networks
      const response = await ddClient.extension.vm.service.post('/networks/list', {
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

      // Cast response to Network array
      const networkData = actualResponse as Network[];
      setNetworks(networkData);
      setLastRefreshTime(new Date()); // Update last refresh time
      console.log('Networks loaded:', networkData);
    } catch (err: any) {
      console.error('Failed to load networks:', err);
      setError(`Failed to load networks: ${err.message || 'Unknown error'}`);
      setNetworks([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Delete a network
  const deleteNetwork = async (networkId: string) => {
    if (!activeEnvironment) {
      return;
    }

    setIsRefreshing(true);
    try {
      if (!ddClient.extension?.vm?.service) {
        throw new Error('Docker Desktop service not available');
      }

      const response = await ddClient.extension.vm.service.post('/networks/remove', {
        hostname: activeEnvironment.hostname,
        username: activeEnvironment.username,
        networkId,
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

      // Reload networks after successful operation
      await loadNetworks();
    } catch (err: any) {
      console.error('Failed to delete network:', err);
      setError(`Failed to delete network: ${err.message || 'Unknown error'}`);
      setIsRefreshing(false);
    }
  };

  // Confirmation dialog handlers
  const confirmDeleteNetwork = (network: Network) => {
    setSelectedNetwork(network);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedNetwork) {
      deleteNetwork(selectedNetwork.id);
    }
    setConfirmDialogOpen(false);
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
        <Typography variant="h5">Networks</Typography>

        <AutoRefreshControls
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
          lastRefreshTime={lastRefreshTime}
          isRefreshing={isRefreshing}
          isDisabled={!activeEnvironment}
          onRefreshClick={loadNetworks}
          onAutoRefreshChange={handleAutoRefreshChange}
          onIntervalChange={handleIntervalChange}
        />
      </Box>

      {/* Warning when no environment is selected */}
      {!activeEnvironment ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select an environment to view networks.
        </Alert>
      ) : null}

      {/* Error message */}
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {/* Loading indicator for initial load only */}
      {isLoading && !networks.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {/* Networks table with refresh overlay */}
      {!isLoading && activeEnvironment && networks.length > 0 ? (
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
                  <TableCell>ID</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Subnet</TableCell>
                  <TableCell>Gateway</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {networks.map((network) => (
                  <TableRow key={network.id} hover>
                    <TableCell>{network.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {network.id.substring(0, 12)}
                    </TableCell>
                    <TableCell>{network.driver}</TableCell>
                    <TableCell>{network.scope}</TableCell>
                    <TableCell>{network.subnet || 'N/A'}</TableCell>
                    <TableCell>{network.gateway || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={network.internal ? 'Internal' : 'External'}
                        color={network.internal ? 'default' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Inspect">
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={isRefreshing}
                            sx={{ mr: 1 }}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmDeleteNetwork(network)}
                            disabled={isRefreshing}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : !isLoading && activeEnvironment ? (
        <Alert severity="info">No networks found in the selected environment.</Alert>
      ) : null}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Delete Network"
        message={
          'Are you sure you want to delete this network? Any containers still connected to this network will be disconnected.'
        }
        confirmText="Delete"
        confirmColor="error"
        resourceName={selectedNetwork?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </Box>
  );
};

export default Networks;
