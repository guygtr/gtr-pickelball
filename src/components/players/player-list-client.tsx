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
      <NeonButton 
        onClick={() => setIsImportModalOpen(true)}
        variant="blue"
      >
        <Upload className="w-4 h-4" />
        Importer CSV
      </NeonButton>
      
      <NeonButton onClick={() => setIsAddModalOpen(true)} variant="green">
        <Plus className="w-4 h-4" />
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
