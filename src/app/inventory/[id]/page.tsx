"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProductById, updateProduct } from "@/actions/products";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  precoUnitario: number;
  currentStock: number;
  unit: string;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState<string>("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
  const [unit, setUnit] = useState("un");

  useEffect(() => {
    const initializeProduct = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
    };
    
    initializeProduct();
  }, [params]);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const result = await getProductById(productId);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.product) {
          const product = result.product as Product;
          setName(product.name);
          setDescription(product.description || "");
          setPrecoUnitario(product.precoUnitario.toString());
          setCurrentStock(product.currentStock.toString());
          setUnit(product.unit);
        }
      } catch (err) {
        console.error("Erro ao buscar produto:", err);
        setError("Ocorreu um erro ao carregar o produto.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      setError("Nome é obrigatório.");
      return;
    }

    if (!precoUnitario || parseFloat(precoUnitario) <= 0) {
      setError("Preço unitário deve ser maior que zero.");
      return;
    }

    setSubmitting(true);
    try {
      const productData = {
        name,
        description: description || undefined,
        precoUnitario: parseFloat(precoUnitario),
        currentStock: parseInt(currentStock) || 0,
        unit,
      };

      const result = await updateProduct(productId, productData);

      if (result.error) {
        throw new Error(result.error);
      }

      router.push("/inventory");
    } catch (err: unknown) {
      console.error("Erro ao atualizar produto:", err);
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro ao atualizar o produto."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando produto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mt-2 text-center mb-6">
        Editar Produto
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Informações do Produto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
                placeholder="Ex: Fio de Cobre 2.5mm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Descrição detalhada do produto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Unitário (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidade de Medida
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="un">Unidade (un)</option>
                <option value="m">Metro (m)</option>
                <option value="cm">Centímetro (cm)</option>
                <option value="kg">Quilograma (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="l">Litro (l)</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="cx">Caixa (cx)</option>
                <option value="pc">Peça (pc)</option>
                <option value="rolo">Rolo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque Atual
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/inventory">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
          >
            {submitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}