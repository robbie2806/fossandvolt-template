import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { storage } from "./secure-storage";

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || "https://placeholder.vibecode.app";

export const authClient = createAuthClient({
  baseURL: BACKEND_URL,
  plugins: [
    emailOTPClient(),
    expoClient({
      scheme: "pixievolt-ai",
      storagePrefix: process.env.EXPO_PUBLIC_VIBECODE_PROJECT_ID as string,
      storage,
    }),
  ],
});
