// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';

export default function Dashboard({ setPage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty">⏳ Carregando dashboard...</div>;

  const stats = data || { usuarios: 0, totalSolicitacoes: 0, aprovadas: 0, negadas: 0, taxaAprovacao: 0, totalEmprestado: 0, emprestimosAtivos: 0, inadimplentes: 0 };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">Visão geral da plataforma de crédito alternativo</div>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        <Kpi label="Usuários" value={stats.usuarios} icon="👥" color="#22d3ee" />
        <Kpi label="Solicitações" value={stats.totalSolicitacoes} icon="📋" color="#818cf8" />
        <Kpi label="Taxa de Aprovação" value={`${stats.taxaAprovacao}%`} icon="✅" color="#4ade80" />
        <Kpi label="Total Emprestado" value={`R$ ${stats.totalEmprestado?.toLocaleString('pt-BR') || '0'}`} icon="💸" color="#fbbf24" />
      </div>

      {/* Como funciona */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">⚡ Como funciona a plataforma</div>
        <div className="grid-3" style={{ marginBottom: 0 }}>
          {[
            { n: '1', title: 'Cadastro e Consentimento', desc: 'O usuário se cadastra e autoriza o compartilhamento de dados financeiros via Open Finance.' },
            { n: '2', title: 'Análise de Score Alternativo', desc: 'O motor analisa frequência de renda, consistência, volume e saúde financeira — sem exigir comprovante formal.' },
            { n: '3', title: 'Crédito Rápido via Pix', desc: 'Se aprovado, o crédito é liberado rapidamente. O usuário recebe explicação clara da decisão.' },
          ].map(s => (
            <div key={s.n} style={{ background: 'var(--surface2)', borderRadius: 10, padding: 20, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{s.n}</div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status dos empréstimos */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Status Financeiro</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <StatusRow label="Empréstimos ativos" value={stats.emprestimosAtivos} color="var(--green)" />
            <StatusRow label="Inadimplentes" value={stats.inadimplentes} color="var(--red)" />
            <StatusRow label="Total aprovados" value={stats.aprovadas} color="var(--accent)" />
            <StatusRow label="Total negados" value={stats.negadas} color="var(--text-muted)" />
          </div>
        </div>

        <div className="card">
          <div className="card-title">Atalhos rápidos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {[
              { label: '👤 Cadastrar novo usuário', page: 'cadastro' },
              { label: '💳 Ver transações', page: 'transacoes' },
              { label: '🎯 Calcular score', page: 'score' },
              { label: '💰 Solicitar crédito', page: 'credito' },
            ].map(a => (
              <button key={a.page} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setPage(a.page)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, color }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="card-title">{label}</div>
          <div className="card-value" style={{ color, fontSize: 26 }}>{value}</div>
        </div>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
    </div>
  );
}

function StatusRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}
