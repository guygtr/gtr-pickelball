"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { deletePlayer } from "@/actions/players";
import { EditPlayerModal } from "./edit-player-modal";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  skillLevel: number;
}

interface PlayerActionsProps {
  leagueId: string;
  player: Player;
}

export function PlayerActions({ leagueId, player }: PlayerActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  async function handleDelete() {
    if (!confirm(`Voulez-vous vraiment supprimer ${player.firstName} ${player.lastName} de cette ligue ?`)) return;
    
    setIsDeleting(true);
    try {
      await deletePlayer(leagueId, player.id);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression du joueur.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 text-pickle-blue">
        <button 
          onClick={() => setShowEditModal(true)}
          className="p-2 text-slate-500 hover:text-pickle-blue hover:bg-pickle-blue/10 rounded-lg transition-all"
          title="Modifier le joueur"
        >
          <Pencil className="w-4 h-4" />
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

      <EditPlayerModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        leagueId={leagueId}
        player={player}
      />
    </>
  );
}
