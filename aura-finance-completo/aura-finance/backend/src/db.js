// db.js — in-memory store (substitui banco de dados real)
const { v4: uuidv4 } = require('uuid');

const db = {
  users: [],
  transactions: [],
  creditRequests: [],
  activeLoans: [],
};

// Semeia dados de exemplo
function seed() {
  // Usuário 1 — motorista de app com bom comportamento
  const u1 = {
    id: uuidv4(),
    name: 'João Silva',
    cpf: '123.456.789-00',
    phone: '(11) 99999-1111',
    profession: 'Motorista de App',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    consentGiven: true,
    deviceId: 'dev-abc-001',
  };

  // Usuário 2 — entregadora com renda irregular
  const u2 = {
    id: uuidv4(),
    name: 'Maria Oliveira',
    cpf: '987.654.321-00',
    phone: '(11) 98888-2222',
    profession: 'Entregadora',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    consentGiven: true,
    deviceId: 'dev-xyz-002',
  };

  db.users.push(u1, u2);

  // Transações de João — frequentes, consistentes
  const now = Date.now();
  for (let i = 90; i >= 0; i--) {
    const day = new Date(now - i * 86400000);
    const weekday = day.getDay();
    if (weekday !== 0) {
      const income = 120 + Math.floor(Math.random() * 200);
      db.transactions.push({
        id: uuidv4(),
        userId: u1.id,
        type: 'income',
        amount: income,
        description: 'Corridas Uber',
        date: day.toISOString(),
        source: 'uber',
      });
      const expense = 30 + Math.floor(Math.random() * 60);
      db.transactions.push({
        id: uuidv4(),
        userId: u1.id,
        type: 'expense',
        amount: expense,
        description: 'Combustível',
        date: day.toISOString(),
        source: 'posto',
      });
    }
  }

  // Transações de Maria — inconsistentes
  for (let i = 30; i >= 0; i--) {
    const day = new Date(now - i * 86400000);
    if (Math.random() > 0.4) {
      const income = 50 + Math.floor(Math.random() * 300);
      db.transactions.push({
        id: uuidv4(),
        userId: u2.id,
        type: 'income',
        amount: income,
        description: 'Entregas iFood',
        date: day.toISOString(),
        source: 'ifood',
      });
    }
  }
}

seed();

module.exports = db;
