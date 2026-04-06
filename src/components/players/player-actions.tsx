"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePlayer } from "@/actions/players";

interface PlayerActionsProps {
  leagueId: string;
  playerId: string;
  playerName: string;
}

export function PlayerActions({ leagueId, playerId, playerName }: PlayerActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Voulez-vous vraiment supprimer ${playerName} de cette ligue ?`)) return;
    
    setIsDeleting(true);
    try {
      await deletePlayer(leagueId, playerId);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression du joueur.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button className="text-slate-500 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider">
        Modifier
      </button>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
        title="Supprimer le joueur"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
