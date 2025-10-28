// Type Definitions for Sales and Rental System
import { Decimal } from "@prisma/client/runtime/library";

// Enum types matching Prisma schema
export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type SaleStatus = "ATIVO" | "ATRASADO" | "CONCLUIDO" | "CANCELADO";

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  precoUnitario: Decimal | number;
  currentStock: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sale/Rental types
export interface Sale {
  id: string;
  dataRetirada: Date;
  dataDevolucaoPrevista: Date;
  customerId: string;
  customer?: Customer;
  userId: string;
  user?: User;
  status: SaleStatus;
  totalAmount?: Decimal | number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  itens: ItensVenda[];
}

export interface ItensVenda {
  id: string;
  saleId: string;
  sale?: Sale;
  produtoId: string;
  produto?: Product;
  quantidadeRetirada: number;
  quantidadeDevolvida?: number | null;
  precoUnitarioNoMomento: Decimal | number;
}

// Input types for creating sales
export interface CreateSaleInput {
  customerId: string;
  userId: string;
  dataDevolucaoPrevista: Date;
  notes?: string;
  items: CreateSaleItemInput[];
}

export interface CreateSaleItemInput {
  produtoId: string;
  quantidadeRetirada: number;
  precoUnitarioNoMomento?: number;
}

// Input types for processing returns
export interface ProcessReturnInput {
  saleId: string;
  userId: string;
  items: ReturnItemInput[];
  notes?: string;
}

export interface ReturnItemInput {
  itemId: string;
  quantidadeDevolvida: number;
}

// Extended types with relations
export interface SaleWithDetails extends Sale {
  customer: Customer;
  user: User;
  itens: ItensVendaWithProduct[];
}

export interface ItensVendaWithProduct extends ItensVenda {
  produto: Product;
}

// Summary types for reporting
export interface SaleSummary {
  totalSales: number;
  activeSales: number;
  overdueSales: number;
  completedSales: number;
  totalRevenue: number;
  pendingReturns: number;
}

// Filter options
export interface SaleFilterOptions {
  status?: SaleStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  isOverdue?: boolean;
}
