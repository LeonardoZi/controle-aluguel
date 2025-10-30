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
        const customerData = customer as typeof customer & {
          number?: string | null;
          complement?: string | null;
          neighborhood?: string | null;
        };

        setInitialData({
          name: customerData.name,
          email: customerData.email || "",
          phone: customerData.phone || "",
          document: customerData.taxId || "",
          address: {
            street: customerData.address || "",
            number: customerData.number || "",
            complement: customerData.complement || "",
            neighborhood: customerData.neighborhood || "",
            city: customerData.city || "",
            state: customerData.state || "",
            zipCode: customerData.postalCode || "",
          },
          notes: "",
          isActive: customerData.isActive,
        });
      }
      setLoading(false);
    };

    fetchCustomer();
  }, [customerId]);

  const handleSubmit = async (data: CustomerFormValues) => {
    console.log("📝 handleSubmit chamado com:", data);
    try {
      const customerData = {
        name: data.name,
        taxId: data.document,
        email: data.email,
        phone: data.phone,
        address: data.address.street,
        number: data.address.number,
        complement: data.address.complement,
        neighborhood: data.address.neighborhood,
        city: data.address.city,
        state: data.address.state,
        postalCode: data.address.zipCode,
        isActive: data.isActive,
      };

      console.log("🔄 Atualizando cliente:", customerData);
      const result = await updateCustomer(customerId, customerData);

      if (result.error) {
        console.error("❌ Erro ao atualizar:", result.error);
        alert(result.error);
      } else {
        console.log("✅ Cliente atualizado com sucesso");
        router.push("/customers");
      }
    } catch (err) {
      console.error("❌ Erro na atualização:", err);
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
