// src/pages/Cadastro.js
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { createUser, giveConsent } from '../services/api';

export default function Cadastro() {
  const { users, currentUser, setCurrentUser, loadUsers, showNotification } = useApp();
  const [form, setForm] = useState({ name: '', cpf: '', phone: '', profession: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // form | consent

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.cpf) return showNotification('Nome e CPF são obrigatórios.', 'error');
    setLoading(true);
    try {
      const res = await createUser(form);
      setCurrentUser(res.data);
      await loadUsers();
      setStep('consent');
      showNotification('Usuário cadastrado! Agora dê o consentimento.', 'success');
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConsent() {
    setLoading(true);
    try {
      await giveConsent(currentUser.id, ['transactions', 'balance', 'income']);
      await loadUsers();
      showNotification('Consentimento registrado com sucesso!', 'success');
      setStep('form');
      setForm({ name: '', cpf: '', phone: '', profession: '' });
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConsentExisting() {
    if (!currentUser) return;
    setLoading(true);
    try {
      await giveConsent(currentUser.id, ['transactions', 'balance', 'income']);
      await loadUsers();
      showNotification('Consentimento registrado!', 'success');
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Cadastro</div>
        <div className="page-sub">Cadastre novos usuários e gerencie o consentimento Open Finance</div>
      </div>

      <div className="grid-2">
        {/* Formulário */}
        <div className="card">
          {step === 'form' ? (
            <>
              <div className="section-title">Novo usuário</div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome completo *</label>
                  <input name="name" value={form.name} onChange={handle} placeholder="Ex: João Silva" />
                </div>
                <div className="form-group">
                  <label>CPF *</label>
                  <input name="cpf" value={form.cpf} onChange={handle} placeholder="000.000.000-00" />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input name="phone" value={form.phone} onChange={handle} placeholder="(11) 99999-0000" />
                </div>
                <div className="form-group">
                  <label>Profissão</label>
                  <select name="profession" value={form.profession} onChange={handle}>
                    <option value="">Selecione...</option>
                    <option>Motorista de App</option>
                    <option>Entregador</option>
                    <option>Freelancer</option>
                    <option>Vendedor Autônomo</option>
                    <option>Prestador de Serviços</option>
                    <option>Outro Autônomo</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '⏳ Salvando...' : '✅ Cadastrar'}
                </button>
              </form>
            </>
          ) : (
            <ConsentStep onConfirm={handleConsent} onSkip={() => setStep('form')} loading={loading} />
          )}
        </div>

        {/* Lista de usuários */}
        <div className="card">
          <div className="section-title">Usuários cadastrados ({users.length})</div>
          {users.length === 0 ? (
            <div className="empty">Nenhum usuário cadastrado.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {users.map(u => (
                <div key={u.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px', border: `1px solid ${currentUser?.id === u.id ? 'var(--accent)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.cpf} · {u.profession}</div>
                    </div>
                    <span className={`badge ${u.consentGiven ? 'badge-green' : 'badge-yellow'}`}>
                      {u.consentGiven ? 'Consentiu' : 'Pendente'}
                    </span>
                  </div>
                  {!u.consentGiven && (
                    <button className="btn btn-secondary" style={{ marginTop: 8, fontSize: 12, padding: '6px 12px' }}
                      onClick={() => { setCurrentUser(u); handleConsentExisting(); }}>
                      Registrar consentimento
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsentStep({ onConfirm, onSkip, loading }) {
  return (
    <div>
      <div className="section-title">🔐 Consentimento Open Finance</div>
      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        Para análise de crédito, precisamos de sua autorização para acessar seus dados financeiros.
      </div>
      <div style={{ marginBottom: 16 }}>
        {['Histórico de transações (90 dias)', 'Saldo médio de conta', 'Fontes de renda identificadas'].map(item => (
          <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>
            <span style={{ fontSize: 14 }}>{item}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        Seus dados serão usados apenas para análise de crédito, conforme a LGPD e as normas do Banco Central. Você pode revogar o consentimento a qualquer momento.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={onConfirm} disabled={loading}>
          {loading ? '...' : '✅ Autorizar'}
        </button>
        <button className="btn btn-secondary" onClick={onSkip}>Depois</button>
      </div>
    </div>
  );
}
