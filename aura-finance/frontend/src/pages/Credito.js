// src/pages/Credito.js
import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { requestCredit, getCreditRequests, getLoans, payInstallment, getScore } from '../services/api';

export default function Credito() {
  const { currentUser, showNotification } = useApp();
  const [scoreData, setScoreData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loans, setLoans] = useState([]);
  const [form, setForm] = useState({ valorSolicitado: '', finalidade: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (currentUser?.consentGiven) {
      loadAll();
    }
  }, [currentUser]);

  async function loadAll() {
    try {
      const [scoreRes, reqRes, loanRes] = await Promise.all([
        getScore(currentUser.id),
        getCreditRequests(currentUser.id),
        getLoans(currentUser.id),
      ]);
      setScoreData(scoreRes.data);
      setRequests(reqRes.data);
      setLoans(loanRes.data);
    } catch (e) {}
  }

  async function handleRequest(e) {
    e.preventDefault();
    if (!form.valorSolicitado) return showNotification('Informe o valor.', 'error');
    if (!currentUser?.consentGiven) return showNotification('Consentimento necessário.', 'error');
    setLoading(true);
    setResult(null);
    try {
      const res = await requestCredit({ userId: currentUser.id, ...form, valorSolicitado: parseFloat(form.valorSolicitado) });
      setResult(res.data);
      await loadAll();
      showNotification(res.data.status !== 'negado' ? 'Crédito aprovado!' : 'Crédito negado.', res.data.status !== 'negado' ? 'success' : 'error');
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(loanId) {
    setLoading(true);
    try {
      const res = await payInstallment(loanId);
      showNotification(res.message, 'success');
      await loadAll();
    } catch (e) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function statusBadge(status) {
    const map = { aprovado: 'badge-green', aprovado_parcial: 'badge-yellow', negado: 'badge-red' };
    const label = { aprovado: 'Aprovado', aprovado_parcial: 'Parcial', negado: 'Negado' };
    return <span className={`badge ${map[status] || 'badge-blue'}`}>{label[status] || status}</span>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Crédito</div>
        <div className="page-sub">Solicite e gerencie crédito para {currentUser?.name || '—'}</div>
      </div>

      {!currentUser?.consentGiven && (
        <div className="alert alert-warn">⚠️ Usuário precisa dar consentimento para solicitar crédito.</div>
      )}

      {/* Score resumido */}
      {scoreData && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="card-title">Score atual</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{scoreData.score}</span>
                <span style={{ color: 'var(--text-muted)' }}>/ 1000 · {scoreData.classificacao}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="card-title">Limite disponível</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                R$ {scoreData.limiteCredito?.toLocaleString('pt-BR') || '0'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Formulário */}
        <div className="card">
          <div className="section-title">Nova solicitação</div>
          <form onSubmit={handleRequest}>
            <div className="form-group">
              <label>Valor solicitado (R$)</label>
              <input type="number" step="100" min="100" value={form.valorSolicitado}
                onChange={e => setForm(f => ({ ...f, valorSolicitado: e.target.value }))}
                placeholder="Ex: 1500.00" />
              {scoreData && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Limite: R$ {scoreData.limiteCredito?.toLocaleString('pt-BR')}</div>
              )}
            </div>
            <div className="form-group">
              <label>Finalidade</label>
              <select value={form.finalidade} onChange={e => setForm(f => ({ ...f, finalidade: e.target.value }))}>
                <option value="">Selecione...</option>
                <option>Capital de giro</option>
                <option>Equipamentos de trabalho</option>
                <option>Emergência pessoal</option>
                <option>Educação/capacitação</option>
                <option>Manutenção de veículo</option>
                <option>Outro</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !currentUser?.consentGiven}>
              {loading ? '⏳ Analisando...' : '🚀 Solicitar Crédito'}
            </button>
          </form>

          {/* Resultado */}
          {result && (
            <div style={{ marginTop: 20 }}>
              <div className={`alert ${result.status !== 'negado' ? 'alert-success' : 'alert-error'}`}>
                <strong>{result.status !== 'negado' ? '✅ Crédito aprovado' : '❌ Crédito negado'}</strong>
                <div style={{ marginTop: 6, fontSize: 13, fontWeight: 400 }}>{result.motivo}</div>
              </div>
              {result.status !== 'negado' && (
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Valor aprovado</span>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>R$ {result.valorAprovado?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Prazo</span>
                    <span>{result.prazoMeses} meses</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Parcela mensal</span>
                    <span style={{ fontWeight: 700 }}>R$ {result.parcelaMensal?.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {/* Fatores explicativos — compliance */}
              {result.fatores && result.fatores.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Motivos da decisão</div>
                  {result.fatores.map((f, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: f.impacto === 'positivo' ? 'var(--green)' : f.impacto === 'negativo' ? 'var(--red)' : 'var(--yellow)', marginRight: 6 }}>
                        {f.impacto === 'positivo' ? '▲' : f.impacto === 'negativo' ? '▼' : '●'}
                      </span>
                      {f.descricao}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Histórico e empréstimos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Empréstimos ativos */}
          <div className="card">
            <div className="section-title">Empréstimos ativos ({loans.filter(l => l.status === 'ativo').length})</div>
            {loans.filter(l => l.status === 'ativo').length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>Nenhum empréstimo ativo.</div>
            ) : (
              loans.filter(l => l.status === 'ativo').map(loan => (
                <div key={loan.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14, marginBottom: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Saldo devedor</span>
                    <span style={{ fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>R$ {loan.saldoDevedor?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Parcelas</span>
                    <span>{loan.parcelasPagas}/{loan.prazoMeses} pagas</span>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 10 }}>
                    <div className="progress-fill" style={{ width: `${(loan.parcelasPagas / loan.prazoMeses) * 100}%`, background: 'var(--accent)' }} />
                  </div>
                  <button className="btn btn-success" style={{ fontSize: 12, padding: '7px 14px' }}
                    onClick={() => handlePay(loan.id)} disabled={loading}>
                    💳 Pagar parcela (R$ {loan.parcelaMensal?.toFixed(2)})
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Histórico de solicitações */}
          <div className="card">
            <div className="section-title">Histórico de solicitações</div>
            {requests.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>Nenhuma solicitação ainda.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontSize: 12 }}>{new Date(r.criadoEm).toLocaleDateString('pt-BR')}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>R$ {r.valorSolicitado?.toFixed(2)}</td>
                        <td>{statusBadge(r.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
