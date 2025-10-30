"use server";

import { prisma } from "@/lib/prisma";

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' }
    });

    return { users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Falha ao buscar usuários" };
  }
}