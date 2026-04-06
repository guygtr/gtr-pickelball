"use client";

import { useState } from "react";
import { renameCourt, deleteCourt } from "@/actions/courts";
import { Trash2, Edit2, Check, X } from "lucide-react";

interface Court {
  id: string;
  name: string;
}

export function CourtList({ courts, leagueId }: { courts: Court[], leagueId: string }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (court: Court) => {
    setEditingId(court.id);
    setEditName(court.name);
  };

  const handleSave = async (courtId: string) => {
    try {
      await renameCourt(courtId, editName, leagueId);
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Erreur lors du renommage");
    }
  };

  const handleDelete = async (courtId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce terrain ?")) return;
    try {
      await deleteCourt(courtId, leagueId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de la suppression";
      alert(message);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {courts.map((court) => (
        <div 
          key={court.id}
          className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-xl group hover:border-emerald-500/30 transition-all"
        >
          {editingId === court.id ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-slate-800 border border-emerald-500/50 rounded-lg px-3 py-1 text-white focus:outline-none"
                autoFocus
              />
              <button 
                onClick={() => handleSave(court.id)}
                className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setEditingId(null)}
                className="p-2 text-slate-400 hover:bg-slate-400/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-white font-medium">{court.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => handleStartEdit(court)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(court.id)}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
