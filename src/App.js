// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import LoginPage from './pages/LoginPage';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';
import { authService } from './auth/authService'; // Import authService
// import './index.css'; // Assuming this is where Tailwind is imported

function App() {
  // Use a state that can be updated
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  // This effect will re-check authentication status when the route changes.
  // This is important after login/logout actions that cause navigation.
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, [location]); // Re-check on location change


  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false); // Update state immediately
    navigate('/login', { replace: true }); // Navigate to login
  };

  // LoginPage will call authService.login and then navigate,
  // which will trigger the useEffect above to update isAuthenticated.

  return (
    <div>
      <nav className="bg-gray-800 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-bold text-xl">Camunda Tasklist</span>
          <div>
            {isAuthenticated && (
              <button onClick={handleLogout} className="mr-4 bg-red-500 hover:bg-red-700 px-3 py-1 rounded">
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
      <main> {/* Removed p-4, pages can manage their own padding */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={isAuthenticated ? <TaskListPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/task/:taskId"
            element={isAuthenticated ? <TaskDetailPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
