import React, { useState } from 'react';
import {
  Box,
  Button,
  Alert,
  Stack,
  Typography,
  Chip,
  Link,
} from '@mui/material';
import {
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

const UpdateCheckerSimple: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Get current version from package.json
  const CURRENT_VERSION = '1.0.31';
  
  const copyUpdateCommand = async () => {
    const command = `docker extension update telkombe/remote-docker:latest`;
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(command);
        // Show success message
        setShowInstructions(false);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <Chip
          label={`Current: v${CURRENT_VERSION}`}
          color="primary"
          size="small"
          variant="outlined"
          icon={<CheckCircleIcon />}
        />
        
        <Button
          variant="outlined"
          startIcon={<UpdateIcon />}
          onClick={() => setShowInstructions(!showInstructions)}
        >
          Check for Updates
        </Button>
        
        <Link
          href="https://hub.docker.com/r/telkombe/remote-docker/tags"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          View on Docker Hub
          <OpenInNewIcon fontSize="small" />
        </Link>
      </Stack>
      
      {showInstructions && (
        <Alert 
          severity="info" 
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={copyUpdateCommand}>
              Copy Command
            </Button>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            To update to the latest version:
          </Typography>
          <Box
            component="pre"
            sx={{
              mt: 1,
              p: 1,
              bgcolor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 1,
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            }}
          >
            docker extension update telkombe/remote-docker:latest
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Current version: v{CURRENT_VERSION}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default UpdateCheckerSimple;