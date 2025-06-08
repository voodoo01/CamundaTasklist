// src/components/Notification.js
import React, { useState, useEffect } from 'react';

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, duration, onClose]);

  if (!visible || !message) return null;

  const baseStyle = "fixed top-5 right-5 p-4 rounded-md shadow-lg text-white transition-opacity duration-300 ease-in-out z-50"; // Added z-index
  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500 text-black",
  };

  return (
    <div className={`${baseStyle} ${typeStyles[type] || typeStyles.info} ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {message}
      <button onClick={() => { setVisible(false); if (onClose) onClose(); }} className="ml-4 text-lg font-semibold leading-none">&times;</button>
    </div>
  );
};

export default Notification;
