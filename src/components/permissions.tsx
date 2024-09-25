import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const ServerOrganization = async () => {
  const session = await getKindeServerSession();
  const userSessionPermissions = await session.getPermissions();
  const userPermissions = userSessionPermissions?.permissions || [];

  return (
    <div>
      <h2>Your Permissions</h2>
      <ul>
        {userPermissions?.map(permission => (
          <li key={permission}>{permission}</li>
        ))}
      </ul>
    </div>
  );
}

export default ServerOrganization;