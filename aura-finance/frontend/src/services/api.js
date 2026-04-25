// services/api.js — Aura Finance
// A URL base vem da variável de ambiente configurada no Vercel
const BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001') + '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMessage = `Erro ${res.status}`;
    try {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return res.json();
}

// --- Usuários ---
export const getUsers = () => request('/users');
export const getUserById = (id) => request(`/users/${id}`);
export const createUser = (body) =>
  request('/users', { method: 'POST', body: JSON.stringify(body) });
export const giveConsent = (id, scope) =>
  request(`/users/${id}/consent`, {
    method: 'PATCH',
    body: JSON.stringify({ scope }),
  });

// --- Transações ---
export const getTransactions = (userId) =>
  request(`/transactions?userId=${userId}`);
export const addTransaction = (body) =>
  request('/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const simulateTransactions = (userId, dias) =>
  request(`/transactions/simulate/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ dias }),
  });

// --- Crédito ---
export const getScore = (userId) => request(`/credit/score/${userId}`);
export const requestCredit = (body) =>
  request('/credit/request', {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const getCreditRequests = (userId) =>
  request(`/credit/requests/${userId}`);
export const getLoans = (userId) => request(`/credit/loans/${userId}`);
export const payInstallment = (loanId) =>
  request(`/credit/loans/${loanId}/pay`, { method: 'POST' });
export const getDashboard = () => request('/credit/dashboard');
