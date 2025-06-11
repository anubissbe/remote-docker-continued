// API Response Types

export interface MCPServer {
  id: string;
  name: string;
  type: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  port?: number;
  image?: string;
  createdAt?: string;
  config?: MCPConfig;
  connectionInfo?: MCPConnectionInfo;
}

export interface MCPConfig {
  image?: string;
  env?: Record<string, string>;
  volumes?: Record<string, string>;
  ports?: Record<string, string>;
  command?: string[];
}

export interface MCPConnectionInfo {
  type: string;
  instructions: string;
  capabilities: string[];
}

export interface MCPServerResponse {
  servers?: MCPServer[];
  data?: {
    servers?: MCPServer[];
  };
  result?: {
    servers?: MCPServer[];
  };
}

export interface PredefinedMCPServer {
  name: string;
  type: string;
  description: string;
  icon: string;
  config: MCPConfig;
}

export interface PredefinedMCPResponse {
  servers?: PredefinedMCPServer[];
  data?: {
    servers?: PredefinedMCPServer[];
  };
  result?: {
    servers?: PredefinedMCPServer[];
  };
}

export interface MCPCatalogItem {
  name: string;
  namespace: string;
  description: string;
  publisher: string;
  updatedAt: string;
  pullCount: number;
  starCount: number;
  tags: string[];
  icon: string;
  categories: string[];
  fullName: string;
  installReady: boolean;
}

export interface MCPCatalogResponse {
  items: MCPCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
}

export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

export interface SuccessResponse {
  success: boolean | 'true' | 'false';
  message?: string;
}

// Type guards
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ErrorResponse).error === 'string'
  );
}

export function isMCPServerResponse(response: unknown): response is MCPServerResponse {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const r = response as MCPServerResponse;
  return Boolean(
    Array.isArray(r.servers) ||
    (r.data && Array.isArray(r.data.servers)) ||
    (r.result && Array.isArray(r.result.servers))
  );
}

export function extractMCPServers(response: unknown): MCPServer[] {
  if (!response) {
    return [];
  }

  // Direct array
  if (Array.isArray(response)) {
    return response;
  }

  // String response
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      return extractMCPServers(parsed);
    } catch {
      return [];
    }
  }

  // Object response
  if (isMCPServerResponse(response)) {
    if (response.servers) {
      return response.servers;
    }
    if (response.data?.servers) {
      return response.data.servers;
    }
    if (response.result?.servers) {
      return response.result.servers;
    }
  }

  return [];
}
