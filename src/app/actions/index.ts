"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { revalidatePath } from "next/cache";

export async function refreshTokens(route: string) {
  try {
    const currentSession = getKindeServerSession();
    await currentSession.refreshTokens();
    revalidatePath(route);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
