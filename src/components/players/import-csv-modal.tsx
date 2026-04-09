"use client";

import { useState } from "react";
import { X, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { importPlayers } from "@/actions/player";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

export function ImportCSVModal({ 
  isOpen, 
  onClose, 
  leagueId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  leagueId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 5) as Record<string, string>[]);
          setError(null);
        },
        error: () => {
          setError("Erreur lors de la lecture du fichier CSV");
        }
      });
    }
  };

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Mapping intelligent des colonnes
          const mappedPlayers = (results.data as Record<string, string>[]).map((row) => ({
            firstName: row.firstName || row.prenom || row.Prenom || row.Firstname || "",
            lastName: row.lastName || row.nom || row.Nom || row.Lastname || "",
            email: row.email || row.Email || row.Courriel || "",
            phone: row.phone || row.telephone || row.Telephone || row.Phone || "",
            skillLevel: row.skillLevel || row.niveau || row.Niveau || row.Level || "3.0",
          })).filter((p) => p.firstName || p.lastName);

          await importPlayers(leagueId, mappedPlayers);
          router.refresh();
          onClose();
          setFile(null);
          setPreview([]);
        } catch (err) {
          console.error(err);
          setError("Erreur lors de l'importation en base de données");
        } finally {
          setLoading(false);
        }
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-pickle-muted" />
            Importer des Joueurs (CSV)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!file ? (
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-pickle-muted/30 transition-colors cursor-pointer group relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-pickle-muted/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-pickle-muted" />
                </div>
                <p className="text-white font-medium">Cliquez ou glissez un fichier CSV</p>
                <p className="text-slate-500 text-sm mt-1">Colonnes suggérées: Nom, Prénom, Email, Niveau</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-pickle-primary" />
                  <span className="text-white text-sm font-medium">{file.name}</span>
                </div>
                <button onClick={() => setFile(null)} className="text-rose-500 text-xs font-bold uppercase hover:underline">
                  Changer
                </button>
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aperçu des données</p>
                  <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400">
                        <tr>
                          {Object.keys(preview[0]).map(key => (
                            <th key={key} className="px-3 py-2 font-medium">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {preview.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 font-medium transition-all"
            >
              Annuler
            </button>
            <NeonButton 
              className="flex-1" 
              variant="orange"
              onClick={handleImport}
              disabled={!file || loading}
            >
              {loading ? "Importation..." : "Confirmer l'import"}
            </NeonButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
