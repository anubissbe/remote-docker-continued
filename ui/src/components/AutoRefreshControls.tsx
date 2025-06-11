import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import React from 'react';

interface AutoRefreshControlsProps {
  autoRefresh: boolean;
  refreshInterval: number;
  lastRefreshTime: Date | null;
  isRefreshing: boolean;
  isDisabled: boolean;
  onRefreshClick: () => void;
  onAutoRefreshChange: (enabled: boolean) => void;
  onIntervalChange: (interval: number) => void;
}

const AutoRefreshControls: React.FC<AutoRefreshControlsProps> = ({
  autoRefresh,
  refreshInterval,
  lastRefreshTime,
  isRefreshing,
  isDisabled,
  onRefreshClick,
  onAutoRefreshChange,
  onIntervalChange,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {lastRefreshTime && (
        <Typography variant="body2" color="text.secondary">
          Last updated: {lastRefreshTime.toLocaleTimeString()}
        </Typography>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={autoRefresh}
            onChange={(e) => onAutoRefreshChange(e.target.checked)}
            disabled={isDisabled}
          />
        }
        label="Auto-refresh"
      />

      <TextField
        type="number"
        label="Interval (seconds)"
        value={refreshInterval}
        onChange={(e) => onIntervalChange(Number(e.target.value))}
        disabled={!autoRefresh || isDisabled}
        size="small"
        InputProps={{
          inputProps: { min: 5, max: 300 },
        }}
        sx={{ width: 150 }}
      />

      <Button
        variant="contained"
        onClick={onRefreshClick}
        disabled={isDisabled}
        startIcon={<RefreshIcon />}
      >
        Refresh
      </Button>
    </Box>
  );
};

export default AutoRefreshControls;
