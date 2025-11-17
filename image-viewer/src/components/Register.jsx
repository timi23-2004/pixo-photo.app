import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register({ onToggle }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Kérlek töltsd ki az összes mezőt');
      return;
    }

    if (password !== confirmPassword) {
      setError('A jelszavak nem egyeznek');
      return;
    }

    if (password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signUp(email, password);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Érvénytelen email cím';
      case 'auth/email-already-in-use':
        return 'Ez az email cím már használatban van';
      case 'auth/weak-password':
        return 'A jelszó túl gyenge';
      default:
        return 'Hiba történt a regisztráció során';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Regisztráció</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Jelszó megerősítése</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Regisztráció...' : 'Regisztráció'}
          </button>
        </form>

        <p className="auth-toggle">
          Már van fiókod? 
          <button onClick={onToggle} className="btn-link">
            Jelentkezz be
          </button>
        </p>
      </div>
    </div>
  );
}
