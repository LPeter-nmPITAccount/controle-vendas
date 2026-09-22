# Controle de Vendas

Sistema simples de controle de vendas e fiado para vendedores ambulantes e pequenos
comerciantes — substitui o caderno de anotações manuais por um controle digital rápido
de clientes, produtos e movimentações (vendas à vista ou fiado).

## Stack

- **Front-end:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Back-end:** Supabase (Postgres + Auth + RLS + Postgres Functions via RPC) — sem
  backend próprio, o front-end fala direto com o Supabase
- **Tema:** escuro por padrão, com alternância para claro (`next-themes`)

## Rodando localmente

1. Clone o repositório e instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente de exemplo e preencha com as
   credenciais do seu projeto Supabase (URL e chave publishable, disponíveis em
   *Project Settings → API* no painel do Supabase):

   ```bash
   cp .env.example .env.local
   ```

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000) — sem sessão ativa, você
   é redirecionado automaticamente para `/login`.

## Estrutura do projeto

```
src/
├── app/
│   ├── (app)/          # rotas autenticadas (menu superior + verificação de sessão)
│   ├── login/          # tela de login
│   ├── layout.tsx       # layout raiz (fontes, tema)
│   └── globals.css      # tokens de design (cores do tema escuro/claro)
├── components/
│   ├── ui/              # componentes base (Button, Input)
│   └── ...               # top-nav, theme-toggle, status-badge, etc.
├── lib/
│   └── supabase/         # clientes Supabase (browser e servidor)
└── proxy.ts              # renovação de sessão em toda requisição
```

## Segurança

- **RLS em todas as tabelas**: front-end nunca acessa dado sem passar pelas políticas do Postgres
- **Superadmin**: só `programacaopit@gmail.com` pode promover/rebaixar usuários entre Admin e Usuário; nem outro admin consegue alterar o próprio superadmin
- **Bloqueio de login**: 5 tentativas erradas seguidas bloqueiam o e-mail por 15 minutos
- **Content-Security-Policy com nonce**: bloqueia scripts injetados por terceiros, permitindo só os que o próprio Next.js gerou
- **Proteção contra iframe** (clickjacking): `X-Frame-Options: DENY` + `frame-ancestors 'none'`
- Demais cabeçalhos recomendados: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`

## Status atual

- [x] Autenticação (login/logout) via Supabase Auth
- [x] Layout com menu superior, tema escuro/claro
- [x] Tela de Movimentações (leitura)
- [x] Cadastro/edição de Clientes
- [x] Cadastro/edição de Produtos
- [x] Gerenciamento de Usuários (admin)
- [x] Registro de nova Movimentação (formulário)
- [x] Detalhe do cliente (suas movimentações) e da movimentação (itens + status)
- [x] Calculadora flutuante
- [x] Tooltips nos botões de ícone
- [x] Superadmin, bloqueio de login e cabeçalhos de segurança
