"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  Configuration,
  OrganizationsApi,
  PermissionsApi,
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

  const permissionsApi = new PermissionsApi(config);
  return permissionsApi.getPermissions();
}

export async function update(formData: FormData) {
  try {
    const kindeApiClient = generateServerClient();
    const token = await kindeApiClient.getToken(sessionManager);
    const currentSession = getKindeServerSession();
    const user = await currentSession.getUser();
    const currentPermissions = await currentSession.getPermissions();

    const config = new Configuration({
      basePath: process.env.KINDE_ISSUER_URL,
      accessToken: token,
      headers: { Accept: "application/json" },
    });

    const organizationsApi = new OrganizationsApi(config);
    const permissionsApi = new PermissionsApi(config);

    const allPermissions = await permissionsApi.getPermissions();

    const currentPermissionsIds =
      allPermissions.permissions
        ?.filter((permission) =>
          currentPermissions?.permissions.includes(permission.key!)
        )
        .map((permission) => permission.id!) || [];

    const selectedPermissions = formData.getAll("permissions") as string[];
    console.log("selectedPermissions", selectedPermissions);
    const removedPermissions =
      currentPermissionsIds?.filter(
        (permission) => !selectedPermissions.includes(permission)
      ) || [];
    console.log("removedPermissions", removedPermissions);
    const addedPermissions = selectedPermissions.filter(
      (permission) => !currentPermissionsIds.includes(permission)
    );
    console.log("addedPermissions", addedPermissions);

    const removePermissions = removedPermissions.map((permission) =>
      organizationsApi.deleteOrganizationUserPermission({
        orgCode: currentPermissions?.orgCode!,
        userId: user.id,
        permissionId: permission,
      })
    );

    const addPermissions = addedPermissions.map((permission) =>
      organizationsApi.createOrganizationUserPermission({
        orgCode: currentPermissions?.orgCode!,
        userId: user.id,
        createOrganizationUserPermissionRequest: {
          permissionId: permission,
        },
      })
    );

    await Promise.all([...removePermissions, ...addPermissions]);

    await currentSession.refreshTokens();
    revalidatePath("/dashboard", "layout");

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
