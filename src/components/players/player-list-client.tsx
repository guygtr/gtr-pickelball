"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { AddPlayerModal } from "./add-player-modal";
import { ImportCSVModal } from "./import-csv-modal";

export function PlayerListClient({ leagueId }: { leagueId: string }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setIsImportModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-sm font-medium transition-all"
      >
        <Upload className="w-4 h-4" />
        Importer CSV
      </button>
      
      <NeonButton onClick={() => setIsAddModalOpen(true)} variant="green">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter un Joueur
      </NeonButton>

      <AddPlayerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        leagueId={leagueId} 
      />
      
      <ImportCSVModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        leagueId={leagueId} 
      />
    </div>
  );
}
