"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCategories } from "@/actions/products";

// Observe que precisaremos implementar estas ações para categorias
// Normalmente estariam em um arquivo de actions separado
const createCategory = async (data: { name: string; description?: string }) => {
  // Implementação da chamada de API
  return { success: true, category: { id: "new-id", ...data } };
};

const updateCategory = async (
  id: string,
  data: { name: string; description?: string }
) => {
  // Implementação da chamada de API
  return { success: true, category: { id, ...data } };
};

const deleteCategory = async (id: string) => {
  // Implementação da chamada de API que usará o id: DELETE /api/categories/{id}
  console.log(`Seria deletada a categoria com ID: ${id}`);
  return { success: true };
};

interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: string | Date;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editCategory, setEditCategory] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const result = await getCategories();
      if (result.error) {
        setError(result.error);
      } else if (result.categories) {
        setCategories(result.categories as Category[]);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await createCategory(newCategory);
      if (result.success) {
        setCategories([...categories, result.category as Category]);
        setIsCreating(false);
        setNewCategory({ name: "", description: "" });
      } else {
        setError("Falha ao criar categoria");
      }
    } catch (err) {
      setError("Ocorreu um erro ao criar categoria");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;

    setSubmitting(true);

    try {
      const result = await updateCategory(isEditing, editCategory);
      if (result.success) {
        setCategories(
          categories.map((cat) =>
            cat.id === isEditing ? { ...cat, ...editCategory } : cat
          )
        );
        setIsEditing(null);
      } else {
        setError("Falha ao atualizar categoria");
      }
    } catch (err) {
      setError("Ocorreu um erro ao atualizar categoria");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      const result = await deleteCategory(id);
      if (result.success) {
        setCategories(categories.filter((cat) => cat.id !== id));
      } else {
        setError("Falha ao excluir categoria");
      }
    } catch (err) {
      setError("Ocorreu um erro ao excluir categoria");
      console.error(err);
    }
  };

  const startEditing = (category: Category) => {
    setIsEditing(category.id);
    setEditCategory({
      name: category.name,
      description: category.description || "",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header e navegação */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/inventory" className="text-blue-600 hover:underline">
            ← Voltar para inventário
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Gerenciar Categorias
          </h1>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setIsEditing(null);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          disabled={isCreating}
        >
          Nova Categoria
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={() => setError("")}
            className="float-right text-red-700 hover:text-red-900"
          >
            &times;
          </button>
        </div>
      )}

      {/* Formulário de criação */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Nova Categoria
          </h2>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                disabled={submitting}
              >
                {submitting ? "Salvando..." : "Salvar Categoria"}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Lista de categorias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma categoria encontrada.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  {isEditing === category.id ? (
                    <td colSpan={3} className="px-6 py-4">
                      <form
                        onSubmit={handleEditSubmit}
                        className="flex items-end space-x-4"
                      >
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome *
                          </label>
                          <input
                            type="text"
                            value={editCategory.name}
                            onChange={(e) =>
                              setEditCategory({
                                ...editCategory,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                          </label>
                          <input
                            type="text"
                            value={editCategory.description}
                            onChange={(e) =>
                              setEditCategory({
                                ...editCategory,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsEditing(null)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
                            disabled={submitting}
                          >
                            {submitting ? "..." : "Salvar"}
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {category.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => startEditing(category)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
