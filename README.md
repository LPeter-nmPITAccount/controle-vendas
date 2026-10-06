# Controle de Vendas

Sistema pessoal para controlar o **fiado informal**: clientes que pedem para "anotar"
e pagar depois. A pessoa anota aqui o que cada cliente levou, repassa essa anotação
para quem realmente cobra os clientes (que registra no caderno dela) e marca no sistema
que já repassou. O sistema serve só para esse controle — **ele não cobra, não recebe
pagamento e não emite nada**.

## Como funciona o fluxo

1. O cliente leva produtos e pede para anotar → cria-se uma **movimentação** com status **Para Anotar**
2. A anotação é repassada para quem cobra → o status vira **Anotado**
3. Se o cliente pagar direto, sem precisar repassar → o status vira **Já Pago**

| Status | Significado |
|---|---|
| Para Anotar | Ainda não foi repassado — é o que está pendente |
| Anotado | Já foi repassado para quem cobra |
| Já Pago | O cliente pagou direto, não precisa repassar |

Cada movimentação tem um **tipo**: `Normal` (compra avulsa) ou `Conta` (fiado/abertura de conta).

## Funcionalidades

- **Login** com bloqueio automático após tentativas erradas seguidas
- **Tema escuro por padrão**, com botão para alternar para o claro
- **Movimentações**
  - Lista das últimas movimentações, com **visualização rápida** (⚡, modal só de leitura), **detalhes** (👁) e **exclusão** (🗑)
  - Formulário de nova movimentação (cliente já cadastrado ou novo, tipo, itens com busca e total calculado)
  - Página de detalhe: alterar status, **editar itens** (bloqueado depois de `Anotado`) e excluir
- **Clientes**: cadastro, edição, busca por nome/matrícula, desativação (bloqueada se o cliente ainda tem movimentação `Para Anotar`) e página própria com as movimentações dele e o total ainda para anotar. A linha inteira é clicável
- **Produtos**: cadastro, edição, busca e exclusão (bloqueada se o produto já foi usado em alguma movimentação)
- **Usuários** (somente admin): ativar/desativar acesso e trocar o tipo (admin/usuário — somente o superadmin)
- **Calculadora flutuante** disponível em todas as telas, para falar o total ao cliente
- **Tooltips** em todos os botões de ícone

## Stack

- **Front-end:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Back-end:** Supabase (Postgres + Auth + Row Level Security + Postgres Functions via RPC) —
  não existe backend próprio, o front-end conversa direto com o Supabase
- **Bibliotecas:** `@supabase/supabase-js` e `@supabase/ssr`, `next-themes`, `lucide-react`,
  `class-variance-authority` + `clsx` + `tailwind-merge` (componentes de UI próprios)
- **Hospedagem:** Vercel, com deploy automático a cada push na branch principal do GitHub

## Banco de dados (Supabase)

| Tabela | Para que serve |
|---|---|
| `profiles` | Dados de cada usuário (nome, tipo `admin`/`user`, ativo, `is_superadmin`), ligada ao `auth.users` |
| `clients` | Clientes (nome, matrícula, ativo) |
| `products` | Produtos (nome, sabor, preço) |
| `movements` | Cada anotação: cliente, quem registrou, `type`, `status`, `price_total`, `date_anotado` |
| `movement_products` | Itens de cada movimentação (produto, `amount`, preço unitário praticado) |
| `login_attempts` | Controle do bloqueio de login (sem acesso direto — só via funções) |

**Enums:** `movement_type` (`Normal`, `Conta`) e `movement_status` (`Para Anotar`, `Anotado`, `Já Pago`).

**O banco faz sozinho** (via triggers):
- cria o `profile` quando um login novo nasce no Supabase Auth
- recalcula `price_total` sempre que os itens mudam
- preenche `date_anotado` quando o status vira `Anotado`
- atualiza `updated_at` em edições
- impede desativar cliente com movimentação `Para Anotar`
- impede escalada de privilégio nos perfis

**Funções (RPC):** `create_movement` e `update_movement_products` (operações em várias tabelas, atômicas),
mais as de bloqueio de login (`check_login_lockout`, `register_failed_login`, `register_successful_login`).

## Segurança

- **RLS em todas as tabelas** — o front-end nunca acessa dado sem passar pelas políticas do Postgres
- **Superadmin**: só ele troca o tipo de qualquer usuário, e ninguém (nem outro admin) consegue alterar o tipo ou o status dele pela aplicação. O campo `is_superadmin` só é definido direto no banco
- **Bloqueio de login**: 5 senhas erradas seguidas bloqueiam aquele e-mail por 15 minutos
- **Content-Security-Policy com nonce** por requisição — só roda script que o próprio Next.js gerou
- **Proteção contra iframe / clickjacking**: `X-Frame-Options: DENY` + `frame-ancestors 'none'`
- Demais cabeçalhos: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`
- Novos logins são criados **só pelo painel do Supabase** (Authentication → Users) — senhas nunca passam por este sistema

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente e preencha com os dados do seu projeto Supabase
   (*Project Settings → API*):

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000) — sem sessão ativa, você é
   redirecionado para `/login`.

> ⚠️ O endereço do Supabase também aparece em `src/proxy.ts` (constante `SUPABASE_URL`),
> porque o Content-Security-Policy precisa liberar esse domínio. Se trocar de projeto
> Supabase, atualize lá também.

## Deploy

O projeto está conectado ao GitHub e à Vercel: todo push na branch principal gera um
deploy de produção automático. As variáveis `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ficam salvas nas configurações do projeto na Vercel.
Como o build roda `tsc` de verdade, um erro de tipagem impede o deploy.

## Estrutura do projeto

```
src/
├── app/
│   ├── (app)/                 # rotas autenticadas (menu superior + verificação de sessão)
│   │   ├── page.tsx           # lista de movimentações
│   │   ├── nova/              # formulário de nova movimentação
│   │   ├── movimentacoes/[id] # detalhe: status, editar itens, excluir
│   │   ├── clientes/          # lista de clientes + clientes/[id] (movimentações do cliente)
│   │   ├── produtos/          # produtos
│   │   └── usuarios/          # usuários (somente admin)
│   ├── login/                 # tela de login
│   ├── layout.tsx             # layout raiz (tema, nonce do CSP)
│   └── globals.css            # tokens de design (cores dos temas)
├── components/
│   ├── ui/                    # base: Button, Input, Modal, Tooltip, SearchableSelect, FeedbackBanner
│   ├── top-nav.tsx            # menu superior
│   ├── calculator-widget.tsx  # calculadora flutuante
│   ├── movement-quick-view.tsx    # modal de visualização rápida
│   ├── delete-movement-button.tsx # exclusão de movimentação
│   └── status-badge.tsx       # selo colorido de status
├── lib/
│   ├── supabase/              # clientes Supabase (navegador e servidor)
│   └── utils.ts
└── proxy.ts                   # renova a sessão e define o CSP com nonce a cada requisição
```

## Decisões técnicas que vale lembrar

- **Datas**: o banco guarda tudo em UTC (correto). Na hora de exibir, o fuso
  `America/Sao_Paulo` é informado explicitamente, porque as páginas rodam no servidor da
  Vercel (UTC) — sem isso, os horários apareceriam 3 horas adiantados
- **Relações do supabase-js**: sem os tipos gerados do banco, o TypeScript acha que um
  join (ex.: `clients(name)`) vem como lista, mas vem como objeto único. Por isso há
  casts explícitos (`as unknown as {...}`) nesses pontos
- **`unsafe-eval` no CSP** só existe em desenvolvimento (o React usa `eval()` para debug);
  em produção nunca é liberado
- **Exclusão de movimentação é definitiva** (sem soft delete): o sistema é um lembrete
  temporário, não um histórico permanente. Já clientes e usuários são só desativados

## Ideias para o futuro

- Gerar os tipos do banco com `supabase gen types typescript` e remover os casts
- Campo próprio com a data em que a movimentação virou `Já Pago`
