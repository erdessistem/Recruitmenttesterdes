import "server-only";
import { google } from "googleapis";
import { getGoogleCredentials } from "@/lib/env";

/** Lazily creates the client; local development never requires credentials. */
export function createSheetsClient() {
  const { clientEmail, privateKey } = getGoogleCredentials();
  const auth = new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return google.sheets({ version: "v4", auth });
}
