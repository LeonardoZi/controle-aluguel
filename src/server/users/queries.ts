import { prisma } from "@/lib/prisma";
import { userListSchema, type UserDto } from "@/server/contracts/v1/users";
import { toUserListDto } from "@/server/users/mappers";

export async function listUsers(): Promise<UserDto[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return userListSchema.parse(toUserListDto(users));
}
