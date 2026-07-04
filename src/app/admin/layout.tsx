import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AdminShell user={user}>
      {children}
    </AdminShell>
  );
}
