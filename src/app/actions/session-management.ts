import {
  GrantType,
  SessionManager,
  createKindeServerClient,
} from "@kinde-oss/kinde-typescript-sdk";

export const generateServerClient = () =>
  createKindeServerClient(GrantType.CLIENT_CREDENTIALS, {
    authDomain: process.env.KINDE_ISSUER_URL,
    clientId: process.env.KINDE_MANAGEMENT_CLIENT_ID,
    clientSecret: process.env.KINDE_MANAGEMENT_CLIENT_SECRET,
    logoutRedirectURL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL,
    audience: `${process.env.KINDE_ISSUER_URL}/api`,
  });

export let store: Record<string, unknown> = {};

export const sessionManager: SessionManager = {
  async getSessionItem(key: string) {
    return store[key];
  },
  async setSessionItem(key: string, value: unknown) {
    store[key] = value;
  },
  async removeSessionItem(key: string) {
    delete store[key];
  },
  async destroySession() {
    store = {};
  },
};
