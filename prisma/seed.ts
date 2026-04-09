import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be defined to run the seed.");
  }

  return databaseUrl;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(getDatabaseUrl()),
});

const seedUserEmail = "admin@controle-estoque.local";
const seedCustomerEmail = "cliente@controle-estoque.local";
const seedSaleNote = "Venda seed para testes automatizados";

async function upsertCustomer() {
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      email: seedCustomerEmail,
    },
  });

  if (existingCustomer) {
    return prisma.customer.update({
      where: {
        id: existingCustomer.id,
      },
      data: {
        name: "Cliente Teste",
        email: seedCustomerEmail,
        phone: "(11) 99999-0000",
        city: "Sao Paulo",
        state: "SP",
        isActive: true,
      },
    });
  }

  return prisma.customer.create({
    data: {
      name: "Cliente Teste",
      email: seedCustomerEmail,
      phone: "(11) 99999-0000",
      city: "Sao Paulo",
      state: "SP",
      isActive: true,
    },
  });
}

async function upsertProduct(input: {
  name: string;
  description: string;
  precoUnitario: string;
  currentStock: number;
  unit: string;
}) {
  const existingProduct = await prisma.product.findFirst({
    where: {
      name: input.name,
    },
  });

  if (existingProduct) {
    return prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        description: input.description,
        precoUnitario: new Prisma.Decimal(input.precoUnitario),
        currentStock: input.currentStock,
        unit: input.unit,
      },
    });
  }

  return prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      precoUnitario: new Prisma.Decimal(input.precoUnitario),
      currentStock: input.currentStock,
      unit: input.unit,
    },
  });
}

async function main() {
  const existingSeedSales = await prisma.sale.findMany({
    where: {
      notes: seedSaleNote,
    },
    select: {
      id: true,
    },
  });

  if (existingSeedSales.length > 0) {
    const saleIds = existingSeedSales.map((sale) => sale.id);

    await prisma.itensVenda.deleteMany({
      where: {
        saleId: {
          in: saleIds,
        },
      },
    });

    await prisma.sale.deleteMany({
      where: {
        id: {
          in: saleIds,
        },
      },
    });
  }

  const user = await prisma.user.upsert({
    where: {
      email: seedUserEmail,
    },
    update: {
      name: "Admin Teste",
      password: "seed-only-not-for-login",
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name: "Admin Teste",
      email: seedUserEmail,
      password: "seed-only-not-for-login",
      role: "ADMIN",
      isActive: true,
    },
  });

  const customer = await upsertCustomer();

  const [caboFlexivel, disjuntor] = await Promise.all([
    upsertProduct({
      name: "Cabo Flexivel 2,5mm - Teste",
      description: "Rolo de cabo flexivel para instalacoes residenciais",
      precoUnitario: "12.90",
      currentStock: 18,
      unit: "rolo",
    }),
    upsertProduct({
      name: "Disjuntor Bipolar 32A - Teste",
      description: "Disjuntor termomagnetico bipolar",
      precoUnitario: "49.90",
      currentStock: 5,
      unit: "un",
    }),
  ]);

  await prisma.sale.create({
    data: {
      customerId: customer.id,
      userId: user.id,
      dataRetirada: new Date("2026-04-05T10:00:00.000Z"),
      dataDevolucaoPrevista: new Date("2026-04-20T10:00:00.000Z"),
      status: "ATIVO",
      totalAmount: new Prisma.Decimal("123.80"),
      notes: seedSaleNote,
      itens: {
        create: [
          {
            produtoId: caboFlexivel.id,
            quantidadeRetirada: 2,
            quantidadeDevolvida: 0,
            precoUnitarioNoMomento: new Prisma.Decimal("12.90"),
          },
          {
            produtoId: disjuntor.id,
            quantidadeRetirada: 2,
            quantidadeDevolvida: 0,
            precoUnitarioNoMomento: new Prisma.Decimal("49.90"),
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
