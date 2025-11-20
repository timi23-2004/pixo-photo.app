import React, { useState, useEffect } from 'react';
import './OfflineNotification.css';

export default function OfflineNotification() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-notification">
      <div className="offline-content">
        <span className="offline-icon">📡</span>
        <p className="offline-text">You are offline</p>
        <p className="offline-subtext">Some features may be unavailable</p>
      </div>
    </div>
  );
}
