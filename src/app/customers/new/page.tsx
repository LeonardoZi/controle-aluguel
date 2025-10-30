"use client";

import { useRouter } from "next/navigation";
import { CustomerForm, type CustomerFormValues } from "@/components/forms/customer-form";
import { createCustomer } from "@/actions/customers";

export default function NewCustomerPage() {
  const router = useRouter();

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
      };

      const result = await createCustomer(customerData);

      if (result.error) {
        alert(result.error);
      } else {
        router.push("/customers");
      }
    } catch (err) {
      alert("Ocorreu um erro ao criar o cliente. Tente novamente.");
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
        Novo Cliente
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <CustomerForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/customers")}
        />
      </div>
    </div>
  );
}