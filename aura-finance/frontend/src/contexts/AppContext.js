// src/contexts/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsers } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await getUsers();
      setUsers(res.data);
      if (res.data.length > 0 && !currentUser) setCurrentUser(res.data[0]);
    } catch (e) {
      showNotification('Erro ao carregar usuários: ' + e.message, 'error');
    }
  }

  function showNotification(message, type = 'success') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }

  return (
    <AppContext.Provider value={{ users, setUsers, currentUser, setCurrentUser, loading, setLoading, notification, showNotification, loadUsers }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
