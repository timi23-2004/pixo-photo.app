import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import HomePage from './HomePage';
import UploadPage from './UploadPage';
import ProfilePage from './ProfilePage';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentPage('home'); // Vissza a home page-re feltöltés után
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage refreshTrigger={refreshTrigger} />;
      case 'upload':
        return <UploadPage onUploadSuccess={handleUploadSuccess} />;
      case 'profile':
        return <ProfilePage refreshTrigger={refreshTrigger} />;
      default:
        return <HomePage refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="dashboard">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        userEmail={user?.email}
      />
      <main className="dashboard-main">
        {renderPage()}
      </main>
    </div>
  );
}
