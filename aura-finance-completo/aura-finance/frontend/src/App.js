// src/App.js
import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Dashboard from './pages/Dashboard';
import Cadastro from './pages/Cadastro';
import Score from './pages/Score';
import Credito from './pages/Credito';
import Transacoes from './pages/Transacoes';
import './App.css';

function Layout() {
  const [page, setPage] = useState('dashboard');
  const { currentUser, users, setCurrentUser, notification } = useApp();

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'cadastro', label: 'Cadastro', icon: '👤' },
    { id: 'transacoes', label: 'Transações', icon: '💳' },
    { id: 'score', label: 'Score', icon: '🎯' },
    { id: 'credito', label: 'Crédito', icon: '💰' },
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <div>
            <div className="logo-title">CréditoAutônomo</div>
            <div className="logo-sub">Open Finance</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(n => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-label">Usuário ativo</div>
          <select
            className="user-select"
            value={currentUser?.id || ''}
            onChange={e => setCurrentUser(users.find(u => u.id === e.target.value))}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          {currentUser && (
            <div className={`consent-badge ${currentUser.consentGiven ? 'ok' : 'warn'}`}>
              {currentUser.consentGiven ? '✅ Consentimento dado' : '⚠️ Sem consentimento'}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        {page === 'dashboard' && <Dashboard setPage={setPage} />}
        {page === 'cadastro' && <Cadastro />}
        {page === 'transacoes' && <Transacoes />}
        {page === 'score' && <Score />}
        {page === 'credito' && <Credito />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
