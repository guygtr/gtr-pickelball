"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportUserData } from "@/actions/export";

/**
 * Bouton d'exportation des données utilisateur avec effet de chargement.
 */
export const ExportDataButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await exportUserData();
      
      // Création du fichier JSON pour le téléchargement
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gtr-pickleball-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      alert("Une erreur est survenue lors de l'exportation des données.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="glass glass-hover w-full flex items-center justify-between p-4 rounded-2xl transition-all group active:scale-[0.98] disabled:opacity-50"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-pickle-primary/10 text-pickle-primary group-hover:bg-pickle-primary group-hover:text-white transition-colors shadow-lg shadow-pickle-primary/20">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        </div>
        <div className="text-left">
          <p className="font-bold text-white group-hover:text-pickle-primary transition-colors">Exporter l&apos;intégralité de mes ligues</p>
          <p className="text-xs text-slate-400">Téléchargez toutes vos informations au format JSON</p>
        </div>
      </div>
      <div className="text-xs font-bold text-pickle-primary opacity-0 group-hover:opacity-100 transition-opacity">
        PRÊT
      </div>
    </button>
  );
};
