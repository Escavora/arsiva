"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { envUrl } from "@/lib/env";

export const authClient = createAuthClient({
  baseURL: envUrl(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signOut, signUp, useSession, changePassword } = authClient;
