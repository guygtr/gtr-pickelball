import { ShieldCheck } from "lucide-react";
import { UserManagementClient } from "@/components/admin/user-management-client";
import { getManagers } from "@/actions/admin";
import { getEnsuredUser } from "@/lib/auth-utils";
import { isUserAdmin } from "@/lib/user-utils";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await getEnsuredUser();
  
  if (!isUserAdmin(user.email)) {
    redirect("/");
  }

  const initialManagers = await getManagers();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-pickle-muted font-bold mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="tracking-[0.2em] uppercase text-xs">Console Administration</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Gestion des Utilisateurs
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mt-2">
            Standard GTR-Team 2026 • Contrôle d&apos;accès sécurisé
          </p>
        </div>
      </div>

      <UserManagementClient initialManagers={initialManagers} />
    </div>
  );
}
