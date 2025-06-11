import { render } from '@testing-library/react';
import App from './App';

// Mock Docker Desktop Extension API
const mockDdClient = {
  extension: {
    vm: {
      service: {
        get: jest.fn().mockResolvedValue({ data: {} }),
        post: jest.fn().mockResolvedValue({ data: {} }),
      },
    },
  },
};

// Set up global mock
(global as any).window.ddClient = mockDdClient;

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Basic smoke test - if it renders without throwing, the test passes
  });
});