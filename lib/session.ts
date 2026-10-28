import { cache } from "react";
import { auth } from "@/auth";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  return user.id;
}
