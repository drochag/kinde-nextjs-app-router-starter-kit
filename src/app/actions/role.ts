"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  Configuration,
  OrganizationsApi,
  RolesApi,
} from "@kinde-oss/kinde-typescript-sdk";
import { generateServerClient, sessionManager } from "./session-management";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/dashboard", "layout");

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
