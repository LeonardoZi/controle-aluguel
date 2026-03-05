"use server";

import { listUsers } from "@/server/users/queries";

export async function getUsers() {
  try {
    const users = await listUsers();
    return { users };
  } catch {
    return { error: "Falha ao buscar usuários" };
  }
}
