// src/auth/authService.js

const CAMUNDA_TOKEN_KEY = 'camundaUserToken';
const CAMUNDA_CONFIG_KEY = 'camundaConfig'; // For storing client ID, etc.

// Store Camunda connection configuration (e.g., Client ID)
// In a real app, client secret should NOT be stored in localStorage for frontend.
// This is a simplification. For client credentials, this would typically be a backend operation.
// For PKCE, the client secret is not used by the frontend.
const storeConfig = (config) => {
  localStorage.setItem(CAMUNDA_CONFIG_KEY, JSON.stringify(config));
};

const getConfig = () => {
  const config = localStorage.getItem(CAMUNDA_CONFIG_KEY);
  return config ? JSON.parse(config) : null;
};

const storeToken = (token) => {
  localStorage.setItem(CAMUNDA_TOKEN_KEY, JSON.stringify(token));
};

const getToken = () => {
  const token = localStorage.getItem(CAMUNDA_TOKEN_KEY);
  if (!token) return null;

  const parsedToken = JSON.parse(token);
  // Add check for token expiration if expiry information is available
  // For example: if (parsedToken.expires_at && new Date(parsedToken.expires_at) < new Date()) {
  //   logout(); // Token expired
  //   return null;
  // }
  return parsedToken;
};

const isAuthenticated = () => {
  return !!getToken();
};

// Placeholder for login logic.
// This will need to be updated with actual OAuth calls.
// For now, it simulates getting and storing a token.
const login = async (clientId, clientSecret, clusterUrl) => {
  // In a real OAuth flow (e.g., Authorization Code with PKCE or Client Credentials):
  // 1. Redirect to Camunda Identity authorization endpoint or send a POST request.
  // 2. Exchange authorization code for a token (if PKCE) or directly get token (if Client Credentials).
  // IMPORTANT: Storing clientSecret in the frontend is insecure for most flows.
  // This is a major simplification.

  console.log('Attempting login with:', { clientId, clusterUrl });
  // Simulate API call and token reception
  if (clientId && clusterUrl) {
    // In a real scenario, you'd make an API call here to Camunda Identity.
    // e.g., using fetch or axios to '/oauth/token' with grant_type, client_id, client_secret.
    const simulatedToken = {
      access_token: 'fake-access-token-' + Date.now(),
      refresh_token: 'fake-refresh-token',
      expires_in: 3600, // typically in seconds
      token_type: 'Bearer',
      // expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // Example expiry
    };
    storeToken(simulatedToken);
    storeConfig({ clientId, clusterUrl }); // Store for later use, clientSecret omitted for safety
    console.log('Login successful, token stored.');
    return true;
  }
  console.error('Login failed: Client ID and Cluster URL are required.');
  return false;
};

const logout = () => {
  localStorage.removeItem(CAMUNDA_TOKEN_KEY);
  localStorage.removeItem(CAMUNDA_CONFIG_KEY);
  // Potentially redirect to login page or notify other parts of the app.
  console.log('User logged out, token removed.');
};

const getAuthHeaders = () => {
  const token = getToken();
  if (token && token.access_token) {
    return {
      'Authorization': `Bearer ${token.access_token}`,
    };
  }
  return {};
};

export const authService = {
  login,
  logout,
  getToken,
  isAuthenticated,
  getAuthHeaders,
  getConfig,
  storeConfig, // Exposing this for now if login page needs to set it without immediate login
};
