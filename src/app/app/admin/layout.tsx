import { requireNetworkAdmin } from "@/lib/staff-data";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireNetworkAdmin();
  return children;
}
