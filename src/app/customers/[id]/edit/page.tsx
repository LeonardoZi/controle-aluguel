"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CustomerForm,
  type CustomerFormValues,
} from "@/components/forms/customer-form";
import { getCustomerById, updateCustomer } from "@/actions/customers";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [initialData, setInitialData] = useState<Partial<CustomerFormValues>>();

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      const { customer, error } = await getCustomerById(customerId);

      if (error) {
        setError(error);
      } else if (customer) {
        setInitialData({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          taxId: customer.taxId,
          address: customer.address,
          number: customer.number,
          complement: customer.complement,
          neighborhood: customer.neighborhood,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          isActive: customer.isActive,
        });
      }
      setLoading(false);
    };

    fetchCustomer();
  }, [customerId]);

  const handleSubmit = async (data: CustomerFormValues) => {
    try {
      const result = await updateCustomer(customerId, data);

      if (result.error) {
        alert(result.error);
      } else {
        router.push("/customers");
      }
    } catch (err) {
      console.error("Erro na atualização:", err);
      alert("Ocorreu um erro ao atualizar o cliente. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <p className="text-gray-500">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => router.push("/customers")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Voltar para lista de clientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
        Editar Cliente
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <CustomerForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/customers")}
        />
      </div>
    </div>
  );
}
