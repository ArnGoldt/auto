import { StaffForm } from "@/app/app/admin/staff/staff-form";
import { PageTitle } from "@/components/ui-shell";
import { listOrgWorkshops } from "@/lib/admin-queries";
import { requireNetworkAdmin } from "@/lib/staff-data";

export default async function NewStaffPage() {
  const { session } = await requireNetworkAdmin();
  const workshops = await listOrgWorkshops(session.organizationId);

  return (
    <div>
      <PageTitle title="Новый сотрудник" />
      <StaffForm workshops={workshops.map((w) => ({ id: w.id, name: w.name }))} />
    </div>
  );
}
