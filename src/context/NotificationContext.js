// src/context/NotificationContext.js
import React, { createContext, useState, useCallback, useContext } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({ message: '', type: 'info', key: 0 });

  const addNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type, key: Date.now() }); // Key forces re-render for same message
  }, []);

  const clearNotification = useCallback(() => {
    // Called by Notification component when its timer ends or it's manually closed
    setNotification(prev => ({ ...prev, message: '' }));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <Notification
        key={notification.key}
        message={notification.message}
        type={notification.type}
        onClose={clearNotification}
      />
    </NotificationContext.Provider>
  );
};
