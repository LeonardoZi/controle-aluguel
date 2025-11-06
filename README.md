# Sistema de estoque

Sistema para gerenciamento de estoque e vendas desenvolvido para comércio.

## Funcionalidades

- Controle de estoque e produtos
- Gerenciamento de vendas e clientes
- Compras e relacionamento com fornecedores
- Relatórios detalhados
- Dashboard com métricas

## Tecnologias

- Next.js 15
- React
- TypeScript
- Prisma (PostgreSQL)
- Tailwind CSS

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar ambiente de desenvolvimento
npm run dev

# Criar build de produção
npm run build

# Iniciar em modo produção
npm start
```

Acesse [http://localhost:3000](http://localhost:3000) para ver o sistema em funcionamento.

## Banco de Dados

O projeto utiliza PostgreSQL via Neon Database. Para configurar:

1. Crie um arquivo `.env` na raiz do projeto
2. Adicione sua string de conexão: `DATABASE_URL="sua_conexao_postgres"`
3. Execute `npx prisma db push` para sincronizar o schema

## Deploy no Vercel

Para ver o deploy da aplicação criada pelos desenvolvedores acesse [plataforma pela Vercel](https://materiais-eletricos-estoque.vercel.app/).
