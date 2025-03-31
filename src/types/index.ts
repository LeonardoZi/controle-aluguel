// Definições de Tipos
import { Decimal } from "@prisma/client/runtime/library";
import { PurchaseStatus } from "@prisma/client";

// Tipos relacionados a produtos
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  currentStock: number;
  minStock?: number | null;
  maxStock?: number | null;
  costPrice?: Decimal | number | null;
  sellingPrice?: Decimal | number | null;
  categoryId?: string | null;
  supplierId?: string | null;
  supplier?: Supplier | null;
  category?: Category | null;
  unit?: string | null;
  barcode?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithRelations extends Product {
  supplier?: Supplier;
  category?: Category;
  stockMovements?: StockMovement[];
  priceHistory?: PriceHistory[];
}

// Tipos relacionados a categorias
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos relacionados a fornecedores
export interface Supplier {
  id: string;
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  taxId?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos relacionados a clientes
export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos relacionados a vendas
export interface Sale {
  id: string;
  customerId: string;
  customer?: Customer;
  userId: string;
  user?: User;
  orderDate: Date;
  status: string;
  totalAmount: Decimal | number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string | null;
  items: SaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: Decimal | number;
  subtotal: Decimal | number;
}

// Tipos relacionados a compras
export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  userId: string;
  user?: User;
  orderDate: Date;
  expectedDelivery?: Date | null;
  actualDelivery?: Date | null;
  status: PurchaseStatus;
  totalAmount: Decimal | number;
  notes?: string | null;
  items: PurchaseItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  receivedQuantity: number;
  unitPrice: Decimal | number;
  total: Decimal | number;
}

// Tipo para movimentação de estoque
export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN";
  referenceId?: string | null;
  notes?: string | null;
  createdAt: Date;
  userId: string;
  user?: User;
}

// Tipo para histórico de preços
export interface PriceHistory {
  id: string;
  productId: string;
  product?: Product;
  previousPrice: Decimal | number;
  newPrice: Decimal | number;
  type: "COST" | "SELLING";
  effectiveDate: Date;
  notes?: string | null;
  userId: string;
  user?: User;
}

// Tipo para usuários
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
