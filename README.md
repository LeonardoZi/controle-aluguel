# Sistema ERP para Materiais Elétricos

Sistema completo para gerenciamento de estoque, vendas, compras e relacionamento com fornecedores, desenvolvido para comércio de materiais elétricos.

## Funcionalidades

- Controle de estoque e produtos
- Gerenciamento de vendas e clientes
- Compras e relacionamento com fornecedores
- Relatórios detalhados
- Dashboard com métricas

## Tecnologias

- Next.js 15 (App Router)
- React 19
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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
