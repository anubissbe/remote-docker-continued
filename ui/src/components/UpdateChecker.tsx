import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  NewReleases as NewReleasesIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Link,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

const ddClient = createDockerDesktopClient();

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  releaseUrl?: string;
  publishedAt?: string;
}

const UpdateChecker: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Get current version from package.json
  const CURRENT_VERSION = '1.0.22'; // This should match package.json

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);

    try {
      // Check Docker Hub for latest version
      // Use backend proxy to avoid CORS issues
      const response = await ddClient.extension?.vm?.service?.get('/updates/check');

      console.log('Update check response:', response);

      // Handle wrapped response
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }

      // Parse if string
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          throw new Error('Invalid response format');
        }
      }

      // Type assertion after validation
      const dockerHubResponse = data as { results?: any[] };

      if (!dockerHubResponse.results || dockerHubResponse.results.length === 0) {
        throw new Error('No versions found');
      }

      // Find the latest version tag (exclude 'latest' and commit hashes)
      const versionTags = dockerHubResponse.results
        .filter((tag: any) => tag.name.match(/^\d+\.\d+(\.\d+)?$/))
        .sort((a: any, b: any) => {
          // Sort by version number
          const versionA = a.name.split('.').map((n: string) => parseInt(n, 10));
          const versionB = b.name.split('.').map((n: string) => parseInt(n, 10));

          for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
            const numA = versionA[i] || 0;
            const numB = versionB[i] || 0;
            if (numA !== numB) {
              return numB - numA;
            }
          }
          return 0;
        });

      if (versionTags.length === 0) {
        throw new Error('No version tags found');
      }

      const latestTag = versionTags[0];
      const latestVersion = latestTag.name;

      // Compare versions
      const currentParts = CURRENT_VERSION.split('.').map((n) => parseInt(n, 10));
      const latestParts = latestVersion.split('.').map((n: string) => parseInt(n, 10));

      let isNewer = false;
      for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const current = currentParts[i] || 0;
        const latest = latestParts[i] || 0;
        if (latest > current) {
          isNewer = true;
          break;
        } else if (latest < current) {
          break;
        }
      }

      const info: UpdateInfo = {
        currentVersion: CURRENT_VERSION,
        latestVersion,
        isUpdateAvailable: isNewer,
        releaseUrl: `https://hub.docker.com/r/anubissbe/remote-docker/tags`,
        publishedAt: latestTag.last_updated,
      };

      setUpdateInfo(info);
      setLastChecked(new Date());

      if (isNewer) {
        setShowUpdateDialog(true);
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
      setError('Failed to check for updates. Please try again later.');
    } finally {
      setChecking(false);
    }
  };

  const performUpdate = async () => {
    if (!updateInfo || !updateInfo.isUpdateAvailable) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      // Use Docker Desktop CLI to update the extension
      const updateCommand = `docker extension update anubissbe/remote-docker:${updateInfo.latestVersion}`;

      // Show instructions since we can't directly execute the command
      setShowUpdateDialog(false);

      // Try to copy command to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(updateCommand);
        ddClient.desktopUI?.toast?.success(
          'Update command copied to clipboard! Run it in your terminal.',
        );
      }

      // Show update instructions
      ddClient.desktopUI?.toast?.warning(`To update, run: ${updateCommand}`);
    } catch (err) {
      console.error('Failed to update:', err);
      setError('Failed to update. Please update manually using Docker CLI.');
    } finally {
      setUpdating(false);
    }
  };

  // Check for updates on component mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  const formatLastChecked = () => {
    if (!lastChecked) {
      return '';
    }
    const now = new Date();
    const diff = now.getTime() - lastChecked.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return 'just now';
    }
    if (minutes === 1) {
      return '1 minute ago';
    }
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
      return '1 hour ago';
    }
    if (hours < 24) {
      return `${hours} hours ago`;
    }

    return lastChecked.toLocaleDateString();
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="outlined"
          startIcon={checking ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={checkForUpdates}
          disabled={checking || updating}
        >
          Check for Updates
        </Button>

        {updateInfo && (
          <>
            <Chip
              label={`v${updateInfo.currentVersion}`}
              color="primary"
              size="small"
              variant="outlined"
            />

            {updateInfo.isUpdateAvailable ? (
              <Chip
                label={`Update available: v${updateInfo.latestVersion}`}
                color="success"
                size="small"
                icon={<NewReleasesIcon />}
                onClick={() => setShowUpdateDialog(true)}
                clickable
              />
            ) : (
              <Chip label="Up to date" color="default" size="small" icon={<CheckCircleIcon />} />
            )}
          </>
        )}

        {lastChecked && (
          <Typography variant="caption" color="text.secondary">
            Last checked: {formatLastChecked()}
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Update Dialog */}
      <Dialog
        open={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <UpdateIcon color="primary" />
            <span>Update Available</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>A new version of Remote Docker is available!</DialogContentText>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Current version:</strong> v{updateInfo?.currentVersion}
              </Typography>
              <Typography variant="body2">
                <strong>Latest version:</strong> v{updateInfo?.latestVersion}
              </Typography>
              {updateInfo?.publishedAt && (
                <Typography variant="body2">
                  <strong>Published:</strong>{' '}
                  {new Date(updateInfo.publishedAt).toLocaleDateString()}
                </Typography>
              )}
            </Stack>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            To update the extension, run the following command in your terminal:
            <Box
              component="pre"
              sx={{
                mt: 1,
                p: 1,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              docker extension update anubissbe/remote-docker:{updateInfo?.latestVersion}
            </Box>
          </Alert>

          {updateInfo?.releaseUrl && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              <Link href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer">
                View release notes
              </Link>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDialog(false)}>Later</Button>
          <Button
            onClick={performUpdate}
            variant="contained"
            disabled={updating}
            startIcon={updating ? <CircularProgress size={16} /> : <UpdateIcon />}
          >
            Copy Update Command
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UpdateChecker;
