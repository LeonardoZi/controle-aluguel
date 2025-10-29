"use client";

import { useRouter } from "next/navigation";
import { CustomerForm, CustomerFormValues } from "@/components/forms/customer-form";
import { createCustomer } from "@/actions/customers";

export default function NewCustomerPage() {
  const router = useRouter();

<<<<<<< HEAD
  const handleSubmit = async (data: any) => {
    console.log("📝 handleSubmit chamado com:", data);
=======
  const handleSubmit = async (data: CustomerFormValues) => {
>>>>>>> 17e4b066997bd550614b5c8f5d06111260d9397b
    try {
      const customerData = {
        name: data.name,
        taxId: data.document,
        email: data.email,
        phone: data.phone,
        address: data.address.street,
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