import { StaffForm } from "@/app/app/admin/staff/staff-form";
import { PageTitle } from "@/components/ui-shell";
import { getStaffForEdit, listOrgWorkshops } from "@/lib/admin-queries";
import { requireNetworkAdmin } from "@/lib/staff-data";
import { notFound } from "next/navigation";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session } = await requireNetworkAdmin();
  const { id } = await params;
  const staff = await getStaffForEdit(session.organizationId, id);
  if (!staff) notFound();

  const workshops = await listOrgWorkshops(session.organizationId);

  return (
    <div>
      <PageTitle title={`Редактирование: ${staff.fullName}`} />
      <StaffForm
        workshops={workshops.map((w) => ({ id: w.id, name: w.name }))}
        initial={{
          id: staff.id,
          fullName: staff.fullName,
          email: staff.email,
          active: staff.active,
          role: staff.role,
          allBranches: staff.allBranches,
          workshopId: staff.workshopId,
        }}
      />
    </div>
  );
}
