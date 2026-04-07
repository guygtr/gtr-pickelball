"use server";

import { prisma } from "@/lib/prisma";
import { getEnsuredUser } from "@/lib/auth-utils";
import { isUserAdmin } from "@/lib/user-utils";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ManagerAccountSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
});

/**
 * Vérifie si l'utilisateur actuel est admin.
 */
async function ensureAdmin() {
  const user = await getEnsuredUser();
  if (!isUserAdmin(user.email)) {
    throw new Error("Action réservée aux administrateurs principal.");
  }
  return user;
}

export interface ManagerAuthData {
  lastSignIn: string | null;
  authId: string | null;
}

/**
 * Récupère tous les gestionnaires.
 * Combine les données de Prisma avec les données de Supabase Auth si possible.
 * @returns {Promise<Array<Object>>} Liste des gestionnaires enrichie.
 */
export async function getManagers() {
  await ensureAdmin();
  
  const managers = await prisma.manager.findMany({
    orderBy: { createdAt: "desc" },
  });

  try {
    const adminClient = createAdminClient();
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();
    
    if (error) throw error;

    // Fusionner les données pour afficher par exemple last_sign_in_at
    return managers.map((m) => {
      const authUser = users.find(u => u.email === m.email);
      return {
        ...m,
        lastSignIn: authUser?.last_sign_in_at || null,
        authId: authUser?.id || null,
      };
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue lors de la récupération des infos Auth";
    console.error("Erreur lors de la récupération des infos Auth:", errorMessage);
    return managers;
  }
}

/**
 * Crée un nouveau compte gestionnaire (Supabase Auth + Prisma).
 */
export async function createManagerAccount(email: string, password: string, name: string) {
  await ensureAdmin();

  const validated = ManagerAccountSchema.parse({ email, password, name });

  try {
    const adminClient = createAdminClient();
    
    // 1. Création du compte dans Supabase Auth
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'manager' }
    });

    if (error) throw error;

    // 2. Création de l'entrée dans Prisma
    await prisma.manager.upsert({
      where: { email: validated.email },
      update: { name: validated.name, role: 'manager' },
      create: {
        id: data.user.id,
        email: validated.email,
        name: validated.name,
        role: 'manager'
      }
    });

    revalidatePath("/admin");
    return { success: true, user: data.user };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création du compte gestionnaire";
    console.error("Erreur de création de compte:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Supprime un gestionnaire (Prisma + Supabase Auth).
 */
export async function deleteManager(id: string, email: string) {
  await ensureAdmin();
  
  try {
    const adminClient = createAdminClient();
    
    // On essaie de supprimer dans Auth d'abord (plus critique)
    // On cherche l'utilisateur par email si l'id Prisma ne correspond pas à l'id Auth
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);
    
    if (authUser) {
      const { error } = await adminClient.auth.admin.deleteUser(authUser.id);
      if (error) console.warn("Erreur suppression Auth (peut-être déjà supprimé):", error.message);
    }

    // Suppression Prisma
    await prisma.manager.delete({ where: { email } });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur lors de la suppression du gestionnaire";
    console.error("Erreur suppression gestionnaire:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
