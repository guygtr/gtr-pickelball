"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

export async function signIn(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;

  // Rate limiting : 5 tentatives par email par fenêtre de 15 minutes
  const rateLimitKey = `signin:${email}`;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

  if (!rateLimit.success) {
    const minutes = Math.ceil((rateLimit.retryAfterSeconds ?? 900) / 60);
    return { error: `Trop de tentatives. Réessayez dans ${minutes} minute(s).` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logError("signIn", error.message);
    return { error: "Identifiants incorrects. Vérifiez votre email et mot de passe." };
  }

  // Connexion réussie : réinitialiser le compteur
  resetRateLimit(rateLimitKey);
  revalidatePath("/", "layout");
  redirect("/leagues");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function changePassword(prevState: unknown, formData: FormData) {
  const oldPassword = formData.get("oldPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return { error: "Les nouveaux mots de passe ne correspondent pas." };
  }

  if (newPassword.length < 8) {
    return { error: "Le nouveau mot de passe doit faire au moins 8 caractères." };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Vous devez être connecté pour changer votre mot de passe." };
    }

    // Rate limiting : 3 tentatives par utilisateur par fenêtre de 30 minutes
    const rateLimitKey = `changepwd:${user.id}`;
    const rateLimit = checkRateLimit(rateLimitKey, 3, 30 * 60 * 1000);

    if (!rateLimit.success) {
      const minutes = Math.ceil((rateLimit.retryAfterSeconds ?? 1800) / 60);
      return { error: `Trop de tentatives. Réessayez dans ${minutes} minute(s).` };
    }

    // 1. Vérification de l'ancien mot de passe en tentant une connexion
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: oldPassword,
    });

    if (verifyError) {
      return { error: "L'ancien mot de passe est incorrect." };
    }

    // 2. Mise à jour vers le nouveau mot de passe
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      return { error: "Erreur lors de la mise à jour du mot de passe." };
    }

    resetRateLimit(rateLimitKey);
    return { success: true };
  } catch (err: unknown) {
    logError("changePassword", err);
    return { error: "Une erreur technique est survenue." };
  }
}
