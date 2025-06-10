import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Pagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
  Folder as FolderIcon,
  Storage as DockerIcon,
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Cloud as CloudIcon,
  DataObject as DatabaseIcon,
  GitHub as GitIcon,
  Monitor as MonitoringIcon,
  Psychology as AIIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ddClient } from '../../utils/ddClient';

interface CatalogItem {
  name: string;
  namespace: string;
  description: string;
  publisher: string;
  updated_at: string;
  pull_count: number;
  star_count: number;
  tags: string[];
  icon: string;
  categories: string[];
  full_name: string;
  install_ready: boolean;
}

interface CatalogResponse {
  items: CatalogItem[];
  total: number;
  page: number;
  page_size: number;
  categories: string[];
}

interface MCPCatalogProps {
  currentEnv?: {
    id: string;
    name: string;
    hostname: string;
    username: string;
  };
  onInstallComplete?: () => void;
}

const MCPCatalog: React.FC<MCPCatalogProps> = ({ currentEnv, onInstallComplete }) => {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [customName, setCustomName] = useState('');
  const [installLog, setInstallLog] = useState<string[]>([]);

  // Load catalog
  const loadCatalog = async (page: number = 1, search: string = '', category: string = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);
      
      console.log('Loading MCP catalog with params:', params.toString());
      const response = await ddClient.extension?.vm?.service?.get(`/mcp/catalog?${params.toString()}`);
      
      console.log('MCP catalog raw response:', response);
      console.log('Response type:', typeof response);
      
      // Handle Docker Desktop API response wrapping
      let catalogData = response;
      if (response && typeof response === 'object') {
        // Check if response is wrapped in 'data' property
        if ('data' in response && response.data) {
          catalogData = response.data;
          console.log('Extracted catalog data from wrapper:', catalogData);
        }
        
        // Parse if it's a string
        if (typeof catalogData === 'string') {
          try {
            catalogData = JSON.parse(catalogData);
            console.log('Parsed catalog data from string:', catalogData);
          } catch (parseErr) {
            console.error('Failed to parse catalog response:', parseErr);
            throw new Error('Invalid JSON response from catalog API');
          }
        }
        
        // Validate the structure
        if (catalogData && typeof catalogData === 'object' && 'items' in catalogData) {
          setCatalog(catalogData as CatalogResponse);
          console.log('Successfully set catalog with', (catalogData as CatalogResponse).items?.length || 0, 'items');
        } else {
          console.error('Invalid catalog response structure:', catalogData);
          throw new Error('Invalid catalog response structure');
        }
      } else {
        throw new Error('Empty or invalid response from catalog API');
      }
    } catch (err) {
      console.error('Error loading MCP catalog:', err);
      setError('Failed to load MCP catalog: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCatalog();
  }, []);

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
    loadCatalog(1, event.target.value, selectedCategory);
  };

  // Handle category change
  const handleCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const category = event.target.value as string;
    setSelectedCategory(category);
    setCurrentPage(1);
    loadCatalog(1, searchQuery, category);
  };

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    loadCatalog(page, searchQuery, selectedCategory);
  };

  // Get icon component for server type
  const getServerIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactElement } = {
      folder: <FolderIcon />,
      docker: <DockerIcon />,
      terminal: <TerminalIcon />,
      settings: <SettingsIcon />,
      kubernetes: <CloudIcon />,
      database: <DatabaseIcon />,
      git: <GitIcon />,
      monitoring: <MonitoringIcon />,
      ai: <AIIcon />,
    };
    return iconMap[iconName] || <SettingsIcon />;
  };

  // Install from catalog
  const handleInstall = async () => {
    try {
      setInstallLog([]); // Clear previous logs
      const addLog = (message: string) => {
        setInstallLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
      };
      
      addLog('Install button clicked');
      addLog(`Environment: ${currentEnv?.name || 'None'}`);
      addLog(`Server: ${selectedItem?.name || 'None'}`);
      
      if (!currentEnv || !selectedItem) {
        addLog('❌ ERROR: Missing environment or server selection');
        setError('Missing environment or server selection');
        return;
      }
      
      addLog(`Starting installation of ${selectedItem.name}`);
      setInstalling(selectedItem.full_name);
      
      try {
      const request = {
        fullName: selectedItem.full_name,
        name: customName || selectedItem.name,
        username: currentEnv.username,
        hostname: currentEnv.hostname,
        autoStart: true,
      };
      
      addLog('Sending install request to backend...');
      addLog(`Request: ${JSON.stringify(request, null, 2)}`);
      
      // Check if ddClient is available
      if (!ddClient || !ddClient.extension || !ddClient.extension.vm || !ddClient.extension.vm.service) {
        addLog('❌ ERROR: Docker Desktop client not available');
        addLog(`ddClient: ${!!ddClient}`);
        addLog(`ddClient.extension: ${!!ddClient?.extension}`);
        addLog(`ddClient.extension.vm: ${!!ddClient?.extension?.vm}`);
        addLog(`ddClient.extension.vm.service: ${!!ddClient?.extension?.vm?.service}`);
        throw new Error('Docker Desktop client not available');
      }
      
      addLog('Docker Desktop client is available');
      addLog('Calling POST /mcp/catalog/install...');
      
      let response;
      try {
        addLog('About to call ddClient.extension.vm.service.post...');
        response = await ddClient.extension.vm.service.post('/mcp/catalog/install', request);
        addLog('API call completed');
      } catch (apiErr) {
        addLog(`❌ API call failed: ${apiErr}`);
        addLog(`Error type: ${typeof apiErr}`);
        addLog(`Error name: ${apiErr instanceof Error ? apiErr.name : 'Not an Error object'}`);
        addLog(`Error message: ${apiErr instanceof Error ? apiErr.message : String(apiErr)}`);
        addLog(`Error stack: ${apiErr instanceof Error ? apiErr.stack : 'No stack trace'}`);
        
        // Check if it's a specific Docker Desktop error
        if (apiErr && typeof apiErr === 'object') {
          addLog(`Error object keys: ${Object.keys(apiErr).join(', ')}`);
          addLog(`Error object: ${JSON.stringify(apiErr, null, 2)}`);
        }
        
        throw apiErr;
      }
      
      addLog('Received response from backend');
      addLog(`Response type: ${typeof response}`);
      addLog(`Response: ${JSON.stringify(response, null, 2)}`);
      
      // Check if response indicates success
      if (!response) {
        throw new Error('No response from install endpoint');
      }
      
      // Handle wrapped response
      let actualResponse: any = response;
      if (response && typeof response === 'object' && 'data' in response) {
        actualResponse = (response as any).data;
        addLog('Extracted data from wrapped response');
      }
      
      addLog(`Actual response: ${JSON.stringify(actualResponse, null, 2)}`);
      
      // Check for error in response
      if (actualResponse && typeof actualResponse === 'object' && 'error' in actualResponse) {
        throw new Error(actualResponse.error);
      }
      
      ddClient.desktopUI?.toast?.success(`Installing ${selectedItem.name}...`);
      addLog('✅ Installation request sent successfully');
      addLog('Note: Installation happens in the background. Check MCP Servers list for status.');
      
      // Keep dialog open for a moment to show success
      setTimeout(() => {
        setInstallDialogOpen(false);
        setSelectedItem(null);
        setCustomName('');
        setInstallLog([]);
        
        if (onInstallComplete) {
          onInstallComplete();
        }
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`❌ ERROR: ${errorMessage}`);
      addLog(`Error stack: ${err instanceof Error ? err.stack : 'No stack trace'}`);
      setError(`Failed to install: ${errorMessage}`);
      ddClient.desktopUI?.toast?.error('Failed to install MCP server: ' + errorMessage);
    } finally {
      setInstalling(null);
    }
    } catch (outerErr) {
      // Catch any errors that weren't caught in the inner try-catch
      const addLog = (message: string) => {
        setInstallLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
      };
      addLog(`❌ UNCAUGHT ERROR: ${outerErr}`);
      addLog(`Error type: ${typeof outerErr}`);
      addLog(`Error details: ${outerErr instanceof Error ? outerErr.stack : String(outerErr)}`);
      setError(`Unexpected error: ${outerErr instanceof Error ? outerErr.message : String(outerErr)}`);
      setInstalling(null);
    }
  };

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!currentEnv) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          Please connect to a remote environment to browse the MCP catalog
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search MCP servers..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
          size="small"
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange as any}
            label="Category"
            startAdornment={<CategoryIcon sx={{ mr: 1, ml: -0.5 }} />}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {catalog?.categories.map(cat => (
              <MenuItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton onClick={() => loadCatalog(currentPage, searchQuery, selectedCategory)}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Loading State */}
      {loading && !catalog ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : catalog && catalog.items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No MCP servers found
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Catalog Grid */}
          <Grid container spacing={2}>
            {catalog?.items.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.full_name}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      {getServerIcon(item.icon)}
                      <Typography variant="h6" component="div">
                        {item.name}
                      </Typography>
                      {item.install_ready && (
                        <Chip label="Quick Install" size="small" color="success" />
                      )}
                    </Stack>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      by {item.publisher}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {item.description}
                    </Typography>
                    
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <StarIcon fontSize="small" color="action" />
                        <Typography variant="caption">
                          {formatNumber(item.star_count)}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <DownloadIcon fontSize="small" color="action" />
                        <Typography variant="caption">
                          {formatNumber(item.pull_count)}
                        </Typography>
                      </Stack>
                      
                      <Typography variant="caption" color="textSecondary">
                        {item.tags.slice(0, 3).join(', ')}
                      </Typography>
                    </Stack>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => {
                        console.log('Opening install dialog for:', item.name);
                        console.log('Item full_name:', item.full_name);
                        setSelectedItem(item);
                        setInstallDialogOpen(true);
                      }}
                      disabled={installing === item.full_name}
                      startIcon={installing === item.full_name ? <CircularProgress size={16} /> : <DownloadIcon />}
                    >
                      {installing === item.full_name ? 'Installing...' : 'Install'}
                    </Button>
                    <Tooltip title="View on Docker Hub">
                      <IconButton
                        size="small"
                        onClick={() => window.open(`https://hub.docker.com/r/${item.full_name}`, '_blank')}
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {catalog && catalog.total > catalog.page_size && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(catalog.total / catalog.page_size)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Install Dialog */}
      <Dialog
        open={installDialogOpen}
        onClose={() => {
          setInstallDialogOpen(false);
          setInstallLog([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Install MCP Server</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  {selectedItem.name}
                </Typography>
                <Typography variant="body2">
                  {selectedItem.description}
                </Typography>
              </Alert>
              
              <TextField
                label="Installation Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={selectedItem.name}
                fullWidth
                helperText="Give this server a custom name (optional)"
              />
              
              <Typography variant="caption" color="textSecondary">
                This will pull the image <code>{selectedItem.full_name}</code> and create a new MCP server instance.
              </Typography>
              
              {/* Debug Log Display */}
              {installLog.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: 'grey.100', maxHeight: 300, overflow: 'auto' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Installation Log:
                  </Typography>
                  <Box component="pre" sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}>
                    {installLog.join('\n')}
                  </Box>
                </Paper>
              )}
              
              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setInstallDialogOpen(false);
            setInstallLog([]);
            setError(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              console.log('Install & Start button clicked!');
              console.log('Button disabled state:', !selectedItem || installing !== null);
              console.log('selectedItem exists:', !!selectedItem);
              console.log('installing state:', installing);
              handleInstall();
            }}
            variant="contained"
            disabled={!selectedItem || installing !== null}
            startIcon={installing ? <CircularProgress size={16} /> : null}
          >
            {installing ? 'Installing...' : 'Install & Start'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MCPCatalog;