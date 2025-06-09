import { createDockerDesktopClient } from '@docker/extension-api-client';

// Create a singleton instance of the Docker Desktop client
export const ddClient = createDockerDesktopClient();