// Hook de Carrinho
import { useState, useEffect } from "react";
import { formatCurrency, calculateTotal } from "@/lib/utils";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  maxAvailable?: number;
}

interface UseCartReturn {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  formattedTotal: string;
  hasItems: boolean;
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);

  // Restaurar carrinho do localStorage (se existir)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Erro ao restaurar carrinho:", error);
    }
  }, []);

  // Salvar carrinho no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch (error) {
      console.error("Erro ao salvar carrinho:", error);
    }
  }, [items]);

  // Adicionar item ao carrinho
  const addItem = (newItem: Omit<CartItem, "id">) => {
    setItems((currentItems) => {
      // Verificar se o produto já existe no carrinho
      const existingItemIndex = currentItems.findIndex(
        (item) => item.productId === newItem.productId
      );

      if (existingItemIndex >= 0) {
        // Se já existe, atualiza a quantidade
        const updatedItems = [...currentItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + newItem.quantity;

        // Verificar limite de estoque disponível
        if (
          newItem.maxAvailable !== undefined &&
          newQuantity > newItem.maxAvailable
        ) {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newItem.maxAvailable,
          };
        } else {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
          };
        }

        return updatedItems;
      }

      // Se não existe, adiciona como novo item
      return [...currentItems, { ...newItem, id: crypto.randomUUID() }];
    });
  };

  // Atualizar quantidade de um item
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === id) {
          // Verificar limite de estoque disponível
          if (item.maxAvailable !== undefined && quantity > item.maxAvailable) {
            return { ...item, quantity: item.maxAvailable };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  // Remover item do carrinho
  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  // Limpar carrinho
  const clearCart = () => {
    setItems([]);
  };

  // Valores calculados
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = calculateTotal(items);
  const formattedTotal = formatCurrency(totalAmount);
  const hasItems = items.length > 0;

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalAmount,
    formattedTotal,
    hasItems,
  };
}
