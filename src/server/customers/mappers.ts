import type { Customer } from "@prisma/client";
import {
  customerListSchema,
  customerSchema,
  type CustomerDto,
} from "@/server/contracts/v1/customers";

export function toCustomerDto(
  customer: Customer,
): CustomerDto {
  return customerSchema.parse({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    number: customer.number,
    complement: customer.complement,
    neighborhood: customer.neighborhood,
    city: customer.city,
    state: customer.state,
    postalCode: customer.postalCode,
    taxId: customer.taxId,
    isActive: customer.isActive,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  });
}

export function toCustomerListDto(
  customers: Customer[],
): CustomerDto[] {
  return customerListSchema.parse(
    customers.map((customer) => toCustomerDto(customer)),
  );
}
