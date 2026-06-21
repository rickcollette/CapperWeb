import { PageHeader } from "@/components/common/ui";

export function IamPageHeader() {
  return (
    <PageHeader
      title="Users & Access"
      description="Provision who can sign in (Google SSO or local username/password) and manage their roles. There is no self-registration."
    />
  );
}
