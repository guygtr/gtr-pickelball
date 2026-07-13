"use server";

import { prisma } from "@/lib/prisma";
import { getEnsuredUser } from "@/lib/auth-utils";
import { isUserAdmin } from "@/lib/user-utils";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logError, logWarn } from "@/lib/logger";

const ManagerAccountSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z
    .string()
    .min(12, "Le mot de passe doit faire au moins 12 caractères"),
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
 * Charge les users Auth par pages (évite listUsers monolithe).
 */
async function listAuthUsersPaged(maxPages = 10, perPage = 200) {
  const adminClient = createAdminClient();
  const all: { id: string; email?: string; last_sign_in_at?: string }[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const batch = data.users ?? [];
    all.push(
      ...batch.map((u) => ({
        id: u.id,
        email: u.email,
        last_sign_in_at: u.last_sign_in_at,
      }))
    );
    if (batch.length < perPage) break;
  }

  return all;
}

/**
 * Récupère tous les gestionnaires (Prisma + last_sign_in Auth paginé).
 */
export async function getManagers() {
  await ensureAdmin();

  const managers = await prisma.manager.findMany({
    orderBy: { createdAt: "desc" },
  });

  try {
    const users = await listAuthUsersPaged();
    const byEmail = new Map(
      users
        .filter((u) => u.email)
        .map((u) => [u.email!.toLowerCase(), u] as const)
    );

    return managers.map((m) => {
      const authUser = byEmail.get(m.email.toLowerCase());
      return {
        ...m,
        lastSignIn: authUser?.last_sign_in_at || null,
        authId: authUser?.id || null,
      };
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Erreur inconnue lors de la récupération des infos Auth";
    logError("getManagers", errorMessage);
    return managers;
  }
}

/**
 * Crée un nouveau compte gestionnaire (Supabase Auth + Prisma).
 */
export async function createManagerAccount(
  email: string,
  password: string,
  name: string
) {
  await ensureAdmin();

  const validated = ManagerAccountSchema.parse({ email, password, name });

  try {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: { name: validated.name, role: "manager" },
    });

    if (error) throw error;

    await prisma.manager.upsert({
      where: { email: validated.email },
      update: { name: validated.name, role: "manager" },
      create: {
        id: data.user.id,
        email: validated.email,
        name: validated.name,
        role: "manager",
      },
    });

    revalidatePath("/admin");
    return { success: true, user: data.user };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Erreur lors de la création du compte gestionnaire";
    logError("createManagerAccount", err);
    return { success: false, error: errorMessage };
  }
}

/**
 * Supprime un gestionnaire (Prisma + Supabase Auth).
 * Préfère l'id Auth (aligné Prisma id à la création).
 */
export async function deleteManager(id: string, email: string) {
  await ensureAdmin();

  try {
    const adminClient = createAdminClient();

    // 1. Essai direct par id (cas normal : id Prisma = id Auth)
    let deletedAuth = false;
    if (id) {
      const { error } = await adminClient.auth.admin.deleteUser(id);
      if (!error) {
        deletedAuth = true;
      } else {
        logWarn(
          "deleteManager",
          `deleteUser(${id}): ${error.message} — fallback email`
        );
      }
    }

    // 2. Fallback recherche paginée par email
    if (!deletedAuth && email) {
      const users = await listAuthUsersPaged();
      const authUser = users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (authUser) {
        const { error } = await adminClient.auth.admin.deleteUser(authUser.id);
        if (error) {
          logWarn(
            "deleteManager",
            `Erreur suppression Auth: ${error.message}`
          );
        }
      }
    }

    await prisma.manager.delete({ where: { email } }).catch(async () => {
      // fallback id
      await prisma.manager.delete({ where: { id } });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Erreur lors de la suppression du gestionnaire";
    logError("deleteManager", err);
    return { success: false, error: errorMessage };
  }
}
