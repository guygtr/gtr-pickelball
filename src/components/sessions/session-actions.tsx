"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteSession } from "@/actions/sessions";
import toast from "react-hot-toast";

interface SessionActionsProps {
  sessionId: string;
  date: Date;
}

export function SessionActions({ sessionId, date }: SessionActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    // Prevent navigating to session details when clicking the delete button
    e.preventDefault();
    e.stopPropagation();

    const dateStr = new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    if (!confirm(`Voulez-vous vraiment supprimer la session du ${dateStr} ?\nCela supprimera également tous les matchs et présences associés.`)) {
      return;
    }

    setIsDeleting(true);
    const loadingToast = toast.loading("Suppression de la session...");

    try {
      const result = await deleteSession(sessionId);
      if (result.success) {
        toast.success("Session supprimée avec succès.", { id: loadingToast });
      } else {
        toast.error(result.error || "Erreur lors de la suppression.", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique lors de la suppression.", { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
      title="Supprimer la session"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
