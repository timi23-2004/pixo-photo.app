import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import OfflineNotification from './components/OfflineNotification';

function AuthFlow() {
  const [showLogin, setShowLogin] = useState(true);
  const { user } = useAuth();

  if (user) {
    return <Dashboard />;
  }

  return showLogin ? (
    <Login onToggle={() => setShowLogin(false)} />
  ) : (
    <Register onToggle={() => setShowLogin(true)} />
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthFlow />
      <OfflineNotification />
    </AuthProvider>
  );
}

export default App;
