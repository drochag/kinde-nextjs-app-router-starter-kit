import OrganizationInfo from "@/components/organization-info";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { refreshTokens } from "../actions/role";
import Permissions from "@/components/permissions";
import PermissionsForm from "@/components/permissions-form";

export default async function Dashboard() {
  const session = getKindeServerSession();
  const organization = await session.getOrganization();

  return (
    <div className="container">
      <div className="card start-hero">
        <p className="text-body-2 start-hero-intro">Woohoo!</p>
        <p className="text-display-2">
          Your authentication is all sorted.
          <br />
          Build the important stuff.
        </p>
      </div>
      <br />
      <form className="form" action={refreshTokens}>
        <button className="btn btn-primary" type="submit">
          Refresh Tokens
        </button>
      </form>
      <div className="card start-hero">
        <OrganizationInfo organization={organization} />
        <Permissions />
        <br />
        <PermissionsForm />
      </div>
    </div>
  );
}
