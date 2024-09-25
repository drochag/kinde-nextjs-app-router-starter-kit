import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { query, update } from "../app/actions/role";

export default async function PermissionsForm() {
  const { roles } = await query();
  const session = getKindeServerSession();
  const userRoles = (await session.getRoles()) || [];

  return (
    <form action={update}>
      <h2>My Roles</h2>
      {roles?.map((role) => (
        <div key={role.id} className="form-group">
          <label htmlFor={role.id}>
            {role.key} - {role.name}
          </label>
          <input
            type="radio"
            id={role.id}
            name="role"
            value={role.id}
            defaultChecked={userRoles.some(
              (userRole) => userRole.id === role.id
            )}
          />
        </div>
      ))}
      <button type="submit" className="btn btn-primary">
        Update Role
      </button>
    </form>
  );
}
