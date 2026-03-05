import { prisma } from "@/lib/prisma";
import {
  customerListSchema,
  customerSchema,
  type CustomerDto,
} from "@/server/contracts/v1/customers";
import { toCustomerDto, toCustomerListDto } from "@/server/customers/mappers";

export async function listCustomers(query?: string): Promise<CustomerDto[]> {
  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return customerListSchema.parse(toCustomerListDto(customers));
}

export async function findCustomerById(id: string): Promise<CustomerDto | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    return null;
  }

  return customerSchema.parse(toCustomerDto(customer));
}

export async function listCustomerSales(customerId: string) {
  return prisma.sale.findMany({
    where: { customerId },
    include: {
      itens: {
        include: {
          produto: true,
        },
      },
    },
    orderBy: { dataRetirada: "desc" },
  });
}
