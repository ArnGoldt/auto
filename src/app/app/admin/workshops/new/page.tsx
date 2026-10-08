import { WorkshopForm } from "@/app/app/admin/workshops/workshop-form";
import { PageTitle } from "@/components/ui-shell";
import { requireNetworkAdmin } from "@/lib/staff-data";

export default async function NewWorkshopPage() {
  await requireNetworkAdmin();
  return (
    <div>
      <PageTitle title="Новый филиал" />
      <WorkshopForm />
    </div>
  );
}
