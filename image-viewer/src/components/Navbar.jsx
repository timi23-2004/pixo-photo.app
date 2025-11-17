import React from 'react';
import './Navbar.css';

export default function Navbar({ currentPage, onNavigate, userEmail }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>Image Viewer</h1>
        </div>

        <div className="navbar-menu">
          <button 
            className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`}
            onClick={() => onNavigate('upload')}
          >
            <span className="nav-icon add-icon">+</span>
            <span className="nav-label">Feltöltés</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
            onClick={() => onNavigate('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profil</span>
          </button>
        </div>

        <div className="navbar-user">
          <span className="user-email">{userEmail}</span>
        </div>
      </div>
    </nav>
  );
}
