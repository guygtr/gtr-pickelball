"use client";

import React, { useState, useRef } from "react";
import { Upload, Loader2, FileJson } from "lucide-react";
import { importUserData } from "@/actions/import";

/**
 * Bouton d'importation des données utilisateur avec sélection de fichier.
 */
export const ImportDataButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input for same file re-upload if needed
    event.target.value = "";

    try {
      setIsLoading(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          
          const result = await importUserData(jsonData);
          
          if (result.success) {
            alert(`Importation réussie : ${result.count} ligue(s) importée(s) !`);
          }
        } catch (error: any) {
          console.error("Erreur lors de l'importation:", error);
          alert(`Erreur d'importation : ${error.message || "Format de fichier invalide."}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        alert("Erreur lors de la lecture du fichier.");
        setIsLoading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur inattendue est survenue.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className="glass glass-hover w-full flex items-center justify-between p-4 rounded-2xl transition-all group active:scale-[0.98] disabled:opacity-50"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pickle-orange/10 text-pickle-orange group-hover:bg-pickle-orange group-hover:text-white transition-colors shadow-lg shadow-pickle-orange/20">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </div>
          <div className="text-left">
            <p className="font-bold text-white group-hover:text-pickle-orange transition-colors">Importer l&apos;intégralité de mes ligues</p>
            <p className="text-xs text-slate-400">Restaurer vos ligues depuis un fichier JSON</p>
          </div>
        </div>
        <div className="text-xs font-bold text-pickle-orange opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
          <FileJson className="w-3 h-3" />
          CHOISIR
        </div>
      </button>
    </>
  );
};
