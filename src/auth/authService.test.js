// src/auth/authService.test.js

import { authService } from './authService';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('authService', () => {
  const mockClientId = 'test-client-id';
  const mockClientSecret = 'test-client-secret';
  const mockClusterUrl = 'https://test.cluster.url';
  const mockTokenData = {
    access_token: 'fake-access-token-test',
    refresh_token: 'fake-refresh-token-test',
    expires_in: 3600,
    token_type: 'Bearer',
  };

  beforeEach(() => {
    // Clear localStorage mock before each test
    localStorageMock.clear();
    // Reset mocks for setItem, getItem, removeItem
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
    // Clear any console spies if used
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should store token and config on successful login and return true', async () => {
      const result = await authService.login(mockClientId, mockClientSecret, mockClusterUrl);
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('camundaUserToken', expect.stringContaining('fake-access-token-'));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('camundaConfig', JSON.stringify({ clientId: mockClientId, clusterUrl: mockClusterUrl }));
    });

    it('should return false and log an error if clientId is missing', async () => {
      const result = await authService.login('', mockClientSecret, mockClusterUrl);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Login failed: Client ID and Cluster URL are required.');
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('camundaUserToken', expect.anything());
    });

    it('should return false and log an error if clusterUrl is missing', async () => {
      const result = await authService.login(mockClientId, mockClientSecret, '');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Login failed: Client ID and Cluster URL are required.');
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('camundaUserToken', expect.anything());
    });
  });

  describe('logout', () => {
    it('should remove token and config from localStorage', () => {
      // First, simulate a login to store items
      localStorageMock.setItem('camundaUserToken', JSON.stringify(mockTokenData));
      localStorageMock.setItem('camundaConfig', JSON.stringify({ clientId: mockClientId, clusterUrl: mockClusterUrl }));

      authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('camundaUserToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('camundaConfig');
    });
  });

  describe('getToken', () => {
    it('should return parsed token if a valid token exists', () => {
      localStorageMock.setItem('camundaUserToken', JSON.stringify(mockTokenData));
      const token = authService.getToken();
      expect(token).toEqual(mockTokenData);
    });

    it('should return null if no token exists', () => {
      // Ensure camundaUserToken is not set
      localStorageMock.removeItem('camundaUserToken'); // ensure it's clean for this test
      const token = authService.getToken();
      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if a valid token exists', () => {
      localStorageMock.setItem('camundaUserToken', JSON.stringify(mockTokenData));
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false if no token exists', () => {
      localStorageMock.removeItem('camundaUserToken');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return correct Authorization header if authenticated', () => {
      localStorageMock.setItem('camundaUserToken', JSON.stringify(mockTokenData));
      const headers = authService.getAuthHeaders();
      expect(headers).toEqual({
        'Authorization': `Bearer ${mockTokenData.access_token}`,
      });
    });

    it('should return an empty object if not authenticated', () => {
      localStorageMock.removeItem('camundaUserToken');
      const headers = authService.getAuthHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('storeConfig and getConfig', () => {
    it('should store and retrieve configuration correctly', () => {
      const config = { clientId: 'cfg-client', clusterUrl: 'cfg-url' };
      authService.storeConfig(config);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('camundaConfig', JSON.stringify(config));

      // Mock getItem to return what was set for the getConfig part of the test
      // Ensure this mock is specific to this test or reset if it affects others.
      // For this test, we expect 'camundaConfig' to be read.
      localStorageMock.getItem.mockImplementation(key => {
        if (key === 'camundaConfig') return JSON.stringify(config);
        return null;
      });
      const retrievedConfig = authService.getConfig();
      expect(retrievedConfig).toEqual(config);
    });

    it('getConfig should return null if no config is stored', () => {
       localStorageMock.getItem.mockImplementation(key => {
        if (key === 'camundaConfig') return null; // Simulate no config in storage
        return null;
      });
       const retrievedConfig = authService.getConfig();
       expect(retrievedConfig).toBeNull();
    });
  });
});
