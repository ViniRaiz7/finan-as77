# 🚀 Aura Finance — Guia de Deploy

Plataforma de crédito alternativo para trabalhadores autônomos.
**Backend → Render** | **Frontend → Vercel**

---

## Estrutura do Projeto

```
aura-finance/
├── backend/          → API Node.js/Express → deploy no Render
└── frontend/         → React SPA → deploy no Vercel
```

---

## ✅ Correções Aplicadas

| Problema | Correção |
|---|---|
| `api.js` usava URL hardcoded | Agora usa `REACT_APP_API_URL` via `.env` |
| Faltava o prefixo `/api` nas chamadas | Adicionado em `api.js` |
| `package.json` do frontend tinha `proxy` (quebra em produção) | Removido |
| Script de build usava caminho manual frágil | Substituído por `react-scripts build` padrão |
| CORS do backend rejeitava origem do Vercel | Configurado para aceitar `FRONTEND_URL` do env |
| Backend sem binding `0.0.0.0` | Corrigido para `app.listen(PORT, '0.0.0.0')` |
| `node_modules` no zip (não deve ser commitado) | `.gitignore` adicionado |

---

## 🔧 Deploy do Backend no Render

### Passo 1 — Criar repositório

```bash
cd backend/
git init
git add .
git commit -m "chore: initial commit aura-finance backend"
```

Crie um repositório no GitHub e faça push:
```bash
git remote add origin https://github.com/SEU_USUARIO/aura-finance-backend.git
git push -u origin main
```

### Passo 2 — Criar Web Service no Render

1. Acesse [render.com](https://render.com) → **New → Web Service**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name:** `aura-finance-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Passo 3 — Variáveis de ambiente no Render

Em **Environment → Environment Variables**, adicione:

| Chave | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://aura-finance.vercel.app` (preencher depois) |

### Passo 4 — Anotar a URL

Após o deploy, o Render fornecerá uma URL como:
```
https://aura-finance-backend.onrender.com
```
Guarde essa URL para configurar o frontend.

---

## 🌐 Deploy do Frontend no Vercel

### Passo 1 — Criar repositório

```bash
cd frontend/
git init
git add .
git commit -m "chore: initial commit aura-finance frontend"
```

Crie um repositório no GitHub e faça push:
```bash
git remote add origin https://github.com/SEU_USUARIO/aura-finance-frontend.git
git push -u origin main
```

### Passo 2 — Importar projeto no Vercel

1. Acesse [vercel.com](https://vercel.com) → **New Project**
2. Importe o repositório do frontend
3. O Vercel detecta React automaticamente. Confirme:
   - **Framework Preset:** `Create React App`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### Passo 3 — Variável de ambiente no Vercel

Em **Environment Variables**, adicione:

| Chave | Valor |
|---|---|
| `REACT_APP_API_URL` | `https://aura-finance-backend.onrender.com` |

> ⚠️ **Importante:** A variável deve começar com `REACT_APP_` para o Create React App expô-la no build.

### Passo 4 — Deploy

Clique em **Deploy**. Após o build, o Vercel fornecerá a URL do frontend.

---

## 🔁 Atualizar FRONTEND_URL no Render

Após obter a URL do Vercel (ex: `https://aura-finance.vercel.app`):

1. Volte ao Render → seu serviço → **Environment**
2. Atualize `FRONTEND_URL` com a URL do Vercel
3. Clique em **Save Changes** → o serviço vai reiniciar automaticamente

---

## 🧪 Testando o Deploy

### Verificar backend:
```
GET https://aura-finance-backend.onrender.com/api/health
```
Resposta esperada:
```json
{ "status": "ok", "service": "Aura Finance API v1.0" }
```

### Verificar frontend:
Acesse a URL do Vercel — o dashboard deve carregar com dados de exemplo.

---

## ⚠️ Limitações do Plano Gratuito

- **Render Free:** O servidor "dorme" após 15 min de inatividade. A primeira requisição pode demorar ~30s para acordar.
- **Render Free:** Dados em memória são **resetados** a cada novo deploy ou reinício (sem banco de dados persistente).

Para produção real, adicione um banco de dados (ex: PostgreSQL no Render, ou MongoDB Atlas).

---

## 🛠️ Rodando Localmente

```bash
# Backend
cd backend
npm install
node src/server.js
# Rodando em http://localhost:3001

# Frontend (em outro terminal)
cd frontend
npm install
# Crie um arquivo .env com:
# REACT_APP_API_URL=http://localhost:3001
npm start
# Rodando em http://localhost:3000
```
