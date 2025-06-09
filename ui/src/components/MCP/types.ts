export interface MCPServer {
  id: string;
  name: string;
  type: 'filesystem' | 'docker' | 'shell' | 'custom';
  status: 'running' | 'stopped' | 'error' | 'creating';
  containerId?: string;
  port: number;
  createdAt: string;
  config: MCPConfig;
}

export interface MCPConfig {
  image: string;
  command?: string[];
  env?: Record<string, string>;
  filesystem?: FilesystemConfig;
  docker?: DockerConfig;
  shell?: ShellConfig;
  custom?: CustomConfig;
}

export interface FilesystemConfig {
  rootPath: string;
  readOnly: boolean;
  allowedDirs?: string[];
}

export interface DockerConfig {
  socketPath: string;
  apiVersion: string;
  permissions: 'read' | 'write' | 'admin';
}

export interface ShellConfig {
  shell: 'bash' | 'sh' | 'zsh';
  allowedCmds?: string[];
  blockedCmds?: string[];
  workingDir: string;
}

export interface CustomConfig {
  gitRepo?: string;
  buildCmd?: string;
  runCmd?: string;
  extraVolumes?: Record<string, string>;
}

export interface PredefinedServer {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  config: MCPConfig;
}

export interface MCPServerRequest {
  name: string;
  type: string;
  config: MCPConfig;
}

export interface MCPServerResponse {
  server: MCPServer;
  message?: string;
}

export interface MCPServerListResponse {
  servers: MCPServer[];
  total: number;
}

export interface MCPLogEntry {
  timestamp: string;
  level: string;
  message: string;
  serverId: string;
}