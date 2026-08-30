import { auth } from "./auth";
import { headers } from "next/headers";

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session && session.user) {
      return session.user;
    }
  } catch (err) {
    console.error("Error retrieving session:", err);
  }

  // Fallback demo user for sandbox/development if not authenticated
  return {
    id: "demo-user-id",
    name: "Untangle Explorer",
    email: "explorer@untangle.app",
    image: null,
  };
}
