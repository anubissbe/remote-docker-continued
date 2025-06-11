import { ViewList as ViewListIcon, Store as StoreIcon } from '@mui/icons-material';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import React, { useState } from 'react';

import MCPCatalog from './MCPCatalog';
import MCPServers from './MCPServers';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mcp-tabpanel-${index}`}
      aria-labelledby={`mcp-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface MCPServersWithCatalogProps {
  currentEnv?: {
    id: string;
    name: string;
    hostname: string;
    username: string;
  };
}

const MCPServersWithCatalog: React.FC<MCPServersWithCatalogProps> = ({ currentEnv }) => {
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInstallComplete = () => {
    // Switch to installed servers tab after installation
    setTabValue(0);
    // Force refresh of the servers list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="MCP servers tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 48,
            },
          }}
        >
          <Tab
            label="Installed Servers"
            icon={<ViewListIcon />}
            iconPosition="start"
            id="mcp-tab-0"
            aria-controls="mcp-tabpanel-0"
          />
          <Tab
            label="Browse Catalog"
            icon={<StoreIcon />}
            iconPosition="start"
            id="mcp-tab-1"
            aria-controls="mcp-tabpanel-1"
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <MCPServers key={refreshKey} currentEnv={currentEnv} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <MCPCatalog currentEnv={currentEnv} onInstallComplete={handleInstallComplete} />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default MCPServersWithCatalog;
