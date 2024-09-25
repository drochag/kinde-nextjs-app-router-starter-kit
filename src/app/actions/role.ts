"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  Configuration,
  createKindeServerClient,
  GrantType,
  PermissionsApi,
  SessionManager,
  OrganizationsApi,
  UsersApi,
  RolesApi,
} from "@kinde-oss/kinde-typescript-sdk";

let store: Record<string, unknown> = {};

const sessionManager: SessionManager = {
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

const generateServerClient = () =>
  createKindeServerClient(GrantType.CLIENT_CREDENTIALS, {
    authDomain: process.env.KINDE_ISSUER_URL,
    clientId: process.env.KINDE_MANAGEMENT_CLIENT_ID,
    clientSecret: process.env.KINDE_MANAGEMENT_CLIENT_SECRET,
    logoutRedirectURL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL,
    audience: `${process.env.KINDE_ISSUER_URL}/api`,
  });

export async function refreshTokens() {
  try {
    const currentSession = await getKindeServerSession();
    currentSession.refreshTokens(); // BUG: this does nothing
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function query() {
  const kindeApiClient = generateServerClient();
  const token = await kindeApiClient.getToken(sessionManager);

  const config = new Configuration({
    basePath: process.env.KINDE_ISSUER_URL,
    accessToken: token,
    headers: { Accept: "application/json" },
  });

  const rolesApi = new RolesApi(config);
  return rolesApi.getRoles();
}

export async function update(formData: FormData) {
  try {
    const kindeApiClient = generateServerClient();
    const token = await kindeApiClient.getToken(sessionManager);
    const currentSession = getKindeServerSession();
    const user = await currentSession.getUser();
    const organization = await currentSession.getOrganization();
    const userRoles = await currentSession.getRoles();

    const config = new Configuration({
      basePath: process.env.KINDE_ISSUER_URL,
      accessToken: token,
      headers: { Accept: "application/json" },
    });

    const organizationsApi = new OrganizationsApi(config);

    const selectedRole = formData.get("role") as string;
    const removedRoles =
      userRoles?.filter((role) => role.id !== selectedRole) || [];
    const isAddedRole = !userRoles?.some((role) => role.id === selectedRole);

    const removeRoles = removedRoles.map((role) => {
      return organizationsApi.deleteOrganizationUserRole({
        orgCode: organization?.orgCode!,
        userId: user.id,
        roleId: role.id!,
      });
    });

    const addPermission = isAddedRole
      ? organizationsApi.createOrganizationUserRole({
          orgCode: organization?.orgCode!,
          userId: user.id,
          createOrganizationUserRoleRequest: {
            roleId: selectedRole,
          },
        })
      : Promise.resolve();

    await Promise.all([...removeRoles, addPermission]).catch((error) => {
      console.error(error);
      throw error;
    });

    await currentSession.refreshTokens();

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
