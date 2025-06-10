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

  // Load catalog
  const loadCatalog = async (page: number = 1, search: string = '', category: string = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);
      
      const response = await ddClient.extension?.vm?.service?.get(`/mcp/catalog?${params.toString()}`);
      
      if (response && typeof response === 'object') {
        setCatalog(response as CatalogResponse);
      }
    } catch (err) {
      console.error('Error loading MCP catalog:', err);
      setError('Failed to load MCP catalog');
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
    if (!currentEnv || !selectedItem) return;
    
    setInstalling(selectedItem.full_name);
    
    try {
      const request = {
        fullName: selectedItem.full_name,
        name: customName || selectedItem.name,
        username: currentEnv.username,
        hostname: currentEnv.hostname,
        autoStart: true,
      };
      
      await ddClient.extension?.vm?.service?.post('/mcp/catalog/install', request);
      
      ddClient.desktopUI?.toast?.success(`Installing ${selectedItem.name}...`);
      
      // Close dialog and notify parent
      setInstallDialogOpen(false);
      setSelectedItem(null);
      setCustomName('');
      
      if (onInstallComplete) {
        onInstallComplete();
      }
    } catch (err) {
      console.error('Error installing MCP server:', err);
      ddClient.desktopUI?.toast?.error('Failed to install MCP server');
    } finally {
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
        onClose={() => setInstallDialogOpen(false)}
        maxWidth="sm"
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
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInstall}
            variant="contained"
            disabled={!selectedItem || installing !== null}
          >
            Install & Start
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MCPCatalog;