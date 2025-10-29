// src/types/index.ts (ou o nome do seu arquivo de tipos)

// 1. IMPORTAMOS TUDO O QUE PRECISAMOS DIRETAMENTE DO PRISMA.
//    Estes são os tipos "oficiais" e a nossa única fonte da verdade.
import { 
  Product, 
  Sale, 
  ItensVenda, 
  Customer, 
  User,
} from "@prisma/client";

// ==========================================================
// SEÇÃO DE TIPOS CUSTOMIZADOS (Onde realmente agregamos valor)
// ==========================================================

// Este tipo representa um Produto com as datas já convertidas para string (para o frontend)
export type SerializedProduct = Omit<Product, 'createdAt' | 'updatedAt' | 'precoUnitario'> & {
  createdAt: string;
  updatedAt: string;
  precoUnitario: number; // Decimal é convertido para number no frontend
};

// Este é o tipo que sua variável 'items' na página de devolução deve usar.
// Ele estende o 'ItensVenda' do Prisma, mas garante que o 'produto' dentro dele
// seja do nosso novo tipo 'SerializedProduct'.
export type ClientReturnItem = Omit<ItensVenda, 'produto'> & {
  produto: SerializedProduct;
  // Adicionamos as propriedades que você calcula no frontend
  quantidadePendente: number;
  quantidadeADevolver: number;
};

// Este tipo representa uma Sale completa com os detalhes para exibição
export interface SaleWithDetails extends Sale {
  customer: Customer;
  user: User;
  itens: (ItensVenda & { produto: Product })[]; // Um item de venda com seu produto
}