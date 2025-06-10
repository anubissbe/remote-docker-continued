import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { Environment, ExtensionSettings } from '../../App';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpdateCheckerSimple from '../../components/UpdateCheckerSimple';

interface EnvironmentsProps {
  settings: ExtensionSettings;
  onSaveSettings: (settings: ExtensionSettings) => Promise<boolean>;
  onSetActiveEnvironment: (environmentId: string | undefined) => Promise<void>;
}

const Environments: React.FC<EnvironmentsProps> = ({
                                                     settings,
                                                     onSaveSettings,
                                                     onSetActiveEnvironment
                                                   }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment | null>(null);
  const [envName, setEnvName] = useState('');
  const [envHostname, setEnvHostname] = useState('');
  const [envUsername, setEnvUsername] = useState('');
  const [autoConnect, setAutoConnect] = useState(settings.autoConnect || false);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Open add dialog
  const handleOpenAddDialog = () => {
    setEnvName('');
    setEnvHostname('');
    setEnvUsername('');
    setShowAddDialog(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (env: Environment) => {
    setCurrentEnvironment(env);
    setEnvName(env.name);
    setEnvHostname(env.hostname);
    setEnvUsername(env.username);
    setShowEditDialog(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (env: Environment) => {
    setCurrentEnvironment(env);
    setShowDeleteDialog(true);
  };

  // Close all dialogs
  const handleCloseDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
    setCurrentEnvironment(null);
  };

  // Generate a unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Add new environment
  const handleAddEnvironment = async () => {
    if (!envName || !envHostname || !envUsername) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    try {
      const newEnvironment: Environment = {
        id: generateId(),
        name: envName,
        hostname: envHostname,
        username: envUsername
      };

      const newSettings: ExtensionSettings = {
        ...settings,
        environments: [...settings.environments, newEnvironment]
      };

      console.log('Saving new environment:', newEnvironment);
      const success = await onSaveSettings(newSettings);

      if (success) {
        setNotification('Environment added successfully');
        handleCloseDialogs();
      } else {
        setError('Failed to add environment');
      }
    } catch (err: any) {
      console.error('Error adding environment:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit environment
  const handleEditEnvironment = async () => {
    if (!currentEnvironment || !envName || !envHostname || !envUsername) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);
    try {
      const updatedEnvironment: Environment = {
        ...currentEnvironment,
        name: envName,
        hostname: envHostname,
        username: envUsername
      };

      const newSettings: ExtensionSettings = {
        ...settings,
        environments: settings.environments.map(env =>
          env.id === currentEnvironment.id ? updatedEnvironment : env
        )
      };

      console.log('Updating environment:', updatedEnvironment);
      const success = await onSaveSettings(newSettings);

      if (success) {
        setNotification('Environment updated successfully');
        handleCloseDialogs();
      } else {
        setError('Failed to update environment');
      }
    } catch (err: any) {
      console.error('Error updating environment:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete environment
  const handleDeleteEnvironment = async () => {
    if (!currentEnvironment) return;

    setIsLoading(true);
    try {
      const newSettings: ExtensionSettings = {
        ...settings,
        environments: settings.environments.filter(env => env.id !== currentEnvironment.id),
        activeEnvironmentId: settings.activeEnvironmentId === currentEnvironment.id
          ? undefined
          : settings.activeEnvironmentId
      };

      console.log('Deleting environment:', currentEnvironment.id);
      const success = await onSaveSettings(newSettings);

      if (success) {
        setNotification('Environment deleted successfully');
        handleCloseDialogs();
      } else {
        setError('Failed to delete environment');
      }
    } catch (err: any) {
      console.error('Error deleting environment:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Set active environment
  const handleSetActive = async (env: Environment) => {
    setIsLoading(true);
    try {
      console.log('Setting active environment:', env.id);
      await onSetActiveEnvironment(env.id);
      setNotification(`${env.name} set as active environment`);
    } catch (err: any) {
      console.error('Error setting active environment:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save auto-connect setting
  const handleSaveAutoConnect = async () => {
    setIsLoading(true);
    try {
      const newSettings: ExtensionSettings = {
        ...settings,
        autoConnect
      };

      console.log('Saving auto-connect setting:', autoConnect);
      const success = await onSaveSettings(newSettings);

      if (success) {
        setNotification('Settings saved successfully');
      } else {
        setError('Failed to save settings');
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Environments
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your remote Docker environments.
      </Typography>

      {/* Settings */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Settings
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoConnect}
                onChange={(e) => setAutoConnect(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-connect with active environment"
          />

          <Button
            variant="outlined"
            onClick={handleSaveAutoConnect}
            disabled={isLoading}
          >
            Save Settings
          </Button>
        </Stack>
      </Paper>

      {/* Update Checker */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Extension Updates
        </Typography>
        <UpdateCheckerSimple />
      </Paper>

      {/* Environment List */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6">
            Your Environments
          </Typography>
          <Button
            variant="outlined"
            onClick={handleOpenAddDialog}
            disabled={isLoading}
          >
            Add Environment
          </Button>
        </Stack>

        {settings.environments.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No environments configured. Click "Add Environment" to create one.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {settings.environments.map((env) => (
              <Grid item xs={12} sm={6} md={4} key={env.id}>
                <Card variant="outlined" sx={{
                  position: 'relative',
                  borderColor: settings.activeEnvironmentId === env.id ? 'primary.main' : undefined,
                  borderWidth: settings.activeEnvironmentId === env.id ? 2 : 1,
                }}>
                  {settings.activeEnvironmentId === env.id && (
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'primary.main'
                    }}>
                      <Tooltip title="Active Environment">
                        <CheckCircleIcon />
                      </Tooltip>
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {env.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Hostname:</strong> {env.hostname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Username:</strong> {env.username}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSetActive(env)}
                      disabled={settings.activeEnvironmentId === env.id || isLoading}
                    >
                      Set Active
                    </Button>
                    <IconButton
                      onClick={() => handleOpenEditDialog(env)}
                      size="small"
                      disabled={isLoading}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpenDeleteDialog(env)}
                      size="small"
                      disabled={isLoading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Add Environment Dialog */}
      <Dialog open={showAddDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Add Environment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1, minWidth: 400 }}>
            <TextField
              label="Environment Name"
              fullWidth
              value={envName}
              onChange={(e) => setEnvName(e.target.value)}
              placeholder="e.g., Production Server"
            />
            <TextField
              label="Hostname"
              fullWidth
              value={envHostname}
              onChange={(e) => setEnvHostname(e.target.value)}
              placeholder="e.g., my-server.example.com or 192.168.1.100"
            />
            <TextField
              label="Username"
              fullWidth
              value={envUsername}
              onChange={(e) => setEnvUsername(e.target.value)}
              placeholder="SSH username"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialogs}
            variant="outlined"
            disabled={isLoading}
          >Cancel
          </Button>
          <Button
            onClick={handleAddEnvironment}
            variant="contained"
            disabled={isLoading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Environment Dialog */}
      <Dialog open={showEditDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Edit Environment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1, minWidth: 400 }}>
            <TextField
              label="Environment Name"
              fullWidth
              value={envName}
              onChange={(e) => setEnvName(e.target.value)}
            />
            <TextField
              label="Hostname"
              fullWidth
              value={envHostname}
              onChange={(e) => setEnvHostname(e.target.value)}
            />
            <TextField
              label="Username"
              fullWidth
              value={envUsername}
              onChange={(e) => setEnvUsername(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialogs}
            variant="outlined"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditEnvironment}
            variant="contained"
            disabled={isLoading}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Environment Dialog */}
      <Dialog open={showDeleteDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Delete Environment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the environment "{currentEnvironment?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} disabled={isLoading}>Cancel</Button>
          <Button
            onClick={handleDeleteEnvironment}
            color="error"
            disabled={isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification('')}
        message={notification}
      />

      {/* Error */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError('')}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default Environments;