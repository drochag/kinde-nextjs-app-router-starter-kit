import { query, update } from "@/app/actions/permission";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const Permissions = async ({
  session,
}: {
  session: ReturnType<typeof getKindeServerSession>;
}) => {
  const userSessionPermissions = await session.getPermissions();
  const userPermissions = userSessionPermissions?.permissions || [];
  const { permissions = [] } = await query();
  console.log("userPermissions", userPermissions);
  console.log("permissions", permissions);
  return (
    <div>
      <h2>Your Permissions</h2>
      <form action={update}>
        {permissions?.map((permission) => (
          <label key={permission.id}>
            <input
              type="checkbox"
              name="permissions"
              value={permission.id}
              defaultChecked={userPermissions.includes(permission.key!)}
            />
            {permission.name}
          </label>
        ))}
        <button type="submit">Update Permissions</button>
      </form>
    </div>
  );
};

export default Permissions;
