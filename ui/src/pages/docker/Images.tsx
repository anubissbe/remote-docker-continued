import React, { useState, useEffect } from 'react';
import { createDockerDesktopClient } from '@docker/extension-api-client';
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
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Environment, ExtensionSettings } from '../../App';
import AutoRefreshControls from '../../components/AutoRefreshControls';
import ConfirmationDialog from '../../components/ConfirmationDialog';

// Image interface
interface Image {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

// Error response interface
interface ErrorResponse {
  error: string;
  output?: string;
}

interface ImagesProps {
  activeEnvironment?: Environment;
  settings: ExtensionSettings;
}

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

const Images: React.FC<ImagesProps> = ({ activeEnvironment, settings }) => {
  const [images, setImages] = useState<Image[]>([]);
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
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  // Load images when active environment changes
  useEffect(() => {
    if (activeEnvironment) {
      loadImages();
    } else {
      // Clear images if no environment is selected
      setImages([]);
    }
  }, [activeEnvironment]);

  // Auto-refresh interval setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh && activeEnvironment) {
      intervalId = setInterval(() => {
        loadImages();
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

  // Load images from the active environment
  const loadImages = async () => {
    if (!activeEnvironment) {
      setError('No environment selected');
      return;
    }

    // For initial loading (empty images list)
    if (images.length === 0) {
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

      // Make API call to fetch images
      const response = await ddClient.extension.vm.service.post('/images/list', {
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

      // For now, we're assuming this endpoint isn't implemented yet
      // So we'll handle it gracefully with a custom message
      // This should be replaced with actual implementation
      if (!actualResponse || !Array.isArray(actualResponse)) {
        setImages([]);
        setError('Images API endpoint not implemented yet');
        return;
      }

      // Cast response to Image array
      const imageData = actualResponse as Image[];
      setImages(imageData);
      setLastRefreshTime(new Date()); // Update last refresh time
      console.log('Images loaded:', imageData);
    } catch (err: any) {
      console.error('Failed to load images:', err);
      setError(`Failed to load images: ${err.message || 'Unknown error'}`);
      setImages([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Remove an image
  const removeImage = async (imageId: string) => {
    if (!activeEnvironment) return;

    setIsRefreshing(true);
    try {
      if (!ddClient.extension?.vm?.service) {
        throw new Error('Docker Desktop service not available');
      }

      // This would be the actual implementation once the API endpoint is available
      const response = await ddClient.extension.vm.service.post('/image/remove', {
        hostname: activeEnvironment.hostname,
        username: activeEnvironment.username,
        imageId: imageId
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

      // Reload images after successful removal
      await loadImages();
    } catch (err: any) {
      console.error('Failed to remove image:', err);
      setError(`Failed to remove image: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Confirmation dialog handlers
  const confirmRemoveImage = (image: Image) => {
    setSelectedImage(image);
    setConfirmDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    if (selectedImage) {
      removeImage(selectedImage.id);
    }
    setConfirmDialogOpen(false);
  };

  // Format byte size to human-readable format
  const formatSize = (bytes: string): string => {
    const size = parseInt(bytes, 10);
    if (isNaN(size)) return 'Unknown';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let formattedSize = size;

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
        <Typography variant="h5">Images</Typography>

        <AutoRefreshControls
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
          lastRefreshTime={lastRefreshTime}
          isRefreshing={isRefreshing}
          isDisabled={!activeEnvironment}
          onRefreshClick={loadImages}
          onAutoRefreshChange={handleAutoRefreshChange}
          onIntervalChange={handleIntervalChange}
        />
      </Box>

      {/* Warning when no environment is selected */}
      {!activeEnvironment ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select an environment to view images.
        </Alert>
      ) : null}

      {/* Error message */}
      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {/* Loading indicator for initial load only */}
      {isLoading && !images.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {/* Images table with refresh overlay */}
      {!isLoading && activeEnvironment && images.length > 0 ? (
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
                borderRadius: 1
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell width="20%">Repository</TableCell>
                  <TableCell width="15%">Tag</TableCell>
                  <TableCell width="15%">Image ID</TableCell>
                  <TableCell width="20%">Created</TableCell>
                  <TableCell width="20%">Size</TableCell>
                  <TableCell width="10%" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {images.map((image) => (
                  <TableRow key={image.id} hover>
                    <TableCell>{image.repository}</TableCell>
                    <TableCell>
                      <Chip
                        label={image.tag || 'latest'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {image.id.substring(0, 12)}
                    </TableCell>
                    <TableCell>{image.created}</TableCell>
                    <TableCell>{formatSize(image.size)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => confirmRemoveImage(image)}
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
      ) : !isLoading && activeEnvironment && !error ? (
        <Alert severity="info">
          No images found in the selected environment.
        </Alert>
      ) : null}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Remove Image"
        message={
          selectedImage?.repository === '<none>'
            ? "Are you sure you want to remove this dangling image?"
            : "Are you sure you want to remove this image? This will permanently delete the image from the remote host."
        }
        confirmText="Remove"
        confirmColor="error"
        resourceName={selectedImage ? `${selectedImage.repository}:${selectedImage.tag || 'latest'}` : ''}
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </Box>
  );
};

export default Images;