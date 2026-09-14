import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/admin-auth";
import { ContentProvider } from "@/lib/content-store";
import Sidebar from "@/components/admin/Sidebar";
import styles from "@/components/admin/AdminShell.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  if (!verifySessionToken(store.get("admin_session")?.value)) {
    redirect("/admin/login");
  }

  return (
    <ContentProvider>
      <div className={styles.shell}>
        <Sidebar />
        <main className={styles.content}>{children}</main>
      </div>
    </ContentProvider>
  );
}
