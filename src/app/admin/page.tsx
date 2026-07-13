import { ShieldCheck } from "lucide-react";
import { UserManagementClient } from "@/components/admin/user-management-client";
import { getManagers } from "@/actions/admin";
import { getEnsuredUser } from "@/lib/auth-utils";
import { isUserAdmin } from "@/lib/user-utils";
import { redirect } from "next/navigation";

/**
 * Console admin — P1 UI : titres sobres.
 */
export default async function AdminPage() {
  const user = await getEnsuredUser();

  if (!isUserAdmin(user.email)) {
    redirect("/");
  }

  const initialManagers = await getManagers();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-pickle-primary" />
            <span>Administration</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-slate-500 max-w-md">
            Création et suivi des comptes gestionnaires — accès restreint.
          </p>
        </div>
      </div>

      <UserManagementClient initialManagers={initialManagers} />
    </div>
  );
}
