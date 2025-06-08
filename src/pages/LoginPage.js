// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { authService } from '../auth/authService';

function LoginPage() {
  const navigate = useNavigate();
  // Initialize state with environment variables or fallback to stored config / defaults
  const [clientId, setClientId] = useState(process.env.REACT_APP_CAMUNDA_OAUTH_CLIENT_ID || '');
  const [clientSecret, setClientSecret] = useState(process.env.REACT_APP_CAMUNDA_OAUTH_CLIENT_SECRET || '');
  const [clusterUrl, setClusterUrl] = useState(process.env.REACT_APP_CAMUNDA_CLUSTER_URL || 'https://188.121.100.199');
  const [error, setError] = useState('');

  useEffect(() => {
    // If env vars are empty, try to load from localStorage as a secondary fallback
    // This allows previously entered values to persist if env vars are not set.
    const existingConfig = authService.getConfig();
    if (existingConfig) {
      if (!process.env.REACT_APP_CAMUNDA_OAUTH_CLIENT_ID) { // Only if env var is not set
        setClientId(existingConfig.clientId || '');
      }
      if (!process.env.REACT_APP_CAMUNDA_CLUSTER_URL) { // Only if env var is not set
         // Ensure existingConfig.clusterUrl is not null or undefined before setting
        setClusterUrl(existingConfig.clusterUrl || 'https://188.121.100.199');
      }
      // Client secret is generally not stored in existingConfig by authService for safety
    }
  }, []); // Run once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!clientId.trim() || !clusterUrl.trim()) {
      setError('Client ID and Camunda URL are required.');
      return;
    }

    // authService.login will store the used clusterUrl and clientId (excluding secret)
    const success = await authService.login(clientId, clientSecret, clusterUrl);
    if (success) {
      navigate('/');
    } else {
      setError('Login failed. Please check credentials and URL. (Using placeholder logic)');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connect to Camunda
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Defaults from environment variables (if set).
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="rounded-md shadow-sm">
            <div className="mb-4">
              <label htmlFor="cluster-url" className="block text-sm font-medium text-gray-700">
                Camunda URL
              </label>
              <input
                id="cluster-url"
                name="cluster-url"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Camunda Cluster URL"
                value={clusterUrl}
                onChange={(e) => setClusterUrl(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="client-id" className="block text-sm font-medium text-gray-700">
                Client ID
              </label>
              <input
                id="client-id"
                name="client-id"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="OAuth Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="client-secret" className="block text-sm font-medium text-gray-700">
                Client Secret <span className="text-xs text-gray-500">(Handle with care)</span>
              </label>
              <input
                id="client-secret"
                name="client-secret"
                type="password"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="OAuth Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Connect & Sign In
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          Note: Client Secret handling in frontend is generally insecure.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
