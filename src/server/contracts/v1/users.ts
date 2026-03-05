import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export const userListSchema = z.array(userSchema);

export type UserDto = z.infer<typeof userSchema>;
