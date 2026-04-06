"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { AddSessionModal } from "./add-session-modal";

export function SessionListClient({ leagueId }: { leagueId: string }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <div className="flex gap-3">
        <NeonButton 
          onClick={() => setShowAddModal(true)}
          className="h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Planifier
        </NeonButton>
      </div>

      <AddSessionModal 
        isOpen={showAddModal}
        leagueId={leagueId} 
        onClose={() => setShowAddModal(false)} 
      />
    </>
  );
}
