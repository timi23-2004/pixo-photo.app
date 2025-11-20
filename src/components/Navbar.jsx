import React from 'react';
import InstallPWA from './InstallPWA';
import './Navbar.css';

export default function Navbar({ currentPage, onNavigate, userEmail }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/logo.png" alt="Pixo Logo" className="navbar-logo" />
        </div>

        <div className="navbar-menu">
          <button 
            className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            <span className="nav-icon" style={{display: 'flex', alignItems: 'center'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11L12 4l9 7"/><path d="M9 22V12h6v10"/><path d="M21 22H3"/></svg>
            </span>
            <span className="nav-label">Home</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`}
            onClick={() => onNavigate('upload')}
          >
            <span className="nav-icon add-icon">+</span>
            <span className="nav-label">Upload</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
            onClick={() => onNavigate('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </button>
        </div>

        <div className="navbar-user">
          <InstallPWA />
          <span className="user-email">{userEmail}</span>
        </div>
      </div>
    </nav>
  );
}
