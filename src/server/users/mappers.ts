import {
  userListSchema,
  userSchema,
  type UserDto,
} from "@/server/contracts/v1/users";

export function toUserDto(user: {
  id: string;
  name: string;
  email: string;
}): UserDto {
  return userSchema.parse(user);
}

export function toUserListDto(
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>,
): UserDto[] {
  return userListSchema.parse(users.map((user) => toUserDto(user)));
}
