// src/pages/Transacoes.js
import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { getTransactions, addTransaction, simulateTransactions } from '../services/api';

export default function Transacoes() {
  const { currentUser, showNotification } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: 'income', amount: '', description: '', source: 'manual' });
  const [simDias, setSimDias] = useState(30);

  useEffect(() => {
    if (currentUser) load();
  }, [currentUser]);

  async function load() {
    setLoading(true);
    try {
      const res = await getTransactions(currentUser.id);
      setTransactions(res.data);
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.amount) return showNotification('Informe o valor.', 'error');
    if (!currentUser?.consentGiven) return showNotification('Usuário precisa dar consentimento primeiro.', 'error');
    setLoading(true);
    try {
      await addTransaction({ userId: currentUser.id, ...form, amount: parseFloat(form.amount) });
      setForm({ type: 'income', amount: '', description: '', source: 'manual' });
      await load();
      showNotification('Transação adicionada!', 'success');
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    if (!currentUser?.consentGiven) return showNotification('Consentimento necessário.', 'error');
    setLoading(true);
    try {
      const res = await simulateTransactions(currentUser.id, simDias);
      await load();
      showNotification(res.message, 'success');
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const income = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Transações</div>
        <div className="page-sub">Histórico financeiro de {currentUser?.name || '—'}</div>
      </div>

      {!currentUser?.consentGiven && (
        <div className="alert alert-warn">⚠️ Este usuário ainda não deu consentimento para compartilhamento de dados.</div>
      )}

      {/* Resumo */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Total Entradas</div>
          <div className="card-value" style={{ color: 'var(--green)', fontSize: 24 }}>R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Saídas</div>
          <div className="card-value" style={{ color: 'var(--red)', fontSize: 24 }}>R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card">
          <div className="card-title">Saldo Período</div>
          <div className="card-value" style={{ color: income - expense >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 24 }}>
            R$ {(income - expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Adicionar transação */}
        <div className="card">
          <div className="section-title">Adicionar transação</div>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="income">Entrada (renda)</option>
                <option value="expense">Saída (despesa)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Valor (R$)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Corridas Uber" />
            </div>
            <div className="form-group">
              <label>Fonte</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                <option value="manual">Manual</option>
                <option value="uber">Uber</option>
                <option value="ifood">iFood</option>
                <option value="openfinance">Open Finance</option>
                <option value="getninjas">GetNinjas</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>Adicionar</button>
          </form>

          <hr style={{ borderColor: 'var(--border)', margin: '20px 0' }} />

          <div className="section-title">🤖 Simular dados Open Finance</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <select value={simDias} onChange={e => setSimDias(e.target.value)} style={{ width: 'auto', flex: 1 }}>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
            <button className="btn btn-secondary" onClick={handleSimulate} disabled={loading}>Simular</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gera transações fictícias para fins de demo e teste do score.</div>
        </div>

        {/* Lista */}
        <div className="card">
          <div className="section-title">Histórico ({transactions.length})</div>
          {loading ? (
            <div className="empty">⏳ Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="empty">Nenhuma transação. Adicione manualmente ou simule.</div>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Desc</th>
                    <th>Fonte</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map(t => (
                    <tr key={t.id}>
                      <td style={{ fontSize: 12 }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                      <td style={{ fontSize: 13 }}>{t.description || '—'}</td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{t.source}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: t.type === 'income' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        {t.type === 'income' ? '+' : '-'}R${t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
