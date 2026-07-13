"use client";

import { useState } from "react";
import {
  Users,
  Play,
  CheckCircle2,
  Circle,
  Trophy,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import {
  toggleAttendance,
  generateMatches,
  deleteMatch,
  deleteAllMatches,
  toggleRoundStatus,
} from "@/actions/matches";
import { terminateSession } from "@/actions/sessions";
import { useRouter } from "next/navigation";
import { ResultModal } from "@/components/matches/result-modal";
import { AiRecapCard } from "./AiRecapCard";
import toast from "react-hot-toast";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  skillLevel: number;
  type: "permanent" | "remplacant";
}

interface Attendance {
  playerId: string;
  isPresent: boolean;
}

interface Match {
  id: string;
  courtId: string | null;
  court: { name: string } | null;
  data: {
    team1: string[];
    team2: string[];
    winner?: number;
    status?: string;
  };
}

interface Session {
  id: string;
  settings?: Record<string, unknown>;
}

/**
 * Jour de match — Option B : présences → générer → scores, mobile-first.
 */
export function SessionDetailsClient({
  session,
  leaguePlayers,
  initialAttendances,
  initialMatches,
  courtCount,
  statusLabel,
}: {
  session: Session;
  leaguePlayers: Player[];
  initialAttendances: Attendance[];
  initialMatches: Match[];
  courtCount: number;
  statusLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState<
    "RANDOM" | "COMPETITIVE" | "TOURNAMENT"
  >("TOURNAMENT");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const router = useRouter();

  const attendancesMap = new Map(
    initialAttendances.map((a) => [a.playerId, a.isPresent])
  );
  const closedRounds =
    (session.settings as { closedRounds?: number[] })?.closedRounds || [];
  const aiRecap = (session.settings as { aiRecap?: string })?.aiRecap;
  const isFinished = statusLabel === "Terminé";
  const presentCount = initialAttendances.filter((a) => a.isPresent).length;
  const scoredCount = initialMatches.filter(
    (m) => m.data.winner !== undefined && m.data.winner !== null
  ).length;

  async function handleToggleAttendance(
    playerId: string,
    currentStatus: boolean
  ) {
    const loadingToast = toast.loading(
      currentStatus ? "Marquer absent…" : "Marquer présent…"
    );
    try {
      const result = await toggleAttendance({
        sessionId: session.id,
        playerId,
        isPresent: !currentStatus,
      });
      if (result.success) {
        toast.success(currentStatus ? "Absent" : "Présent", {
          id: loadingToast,
        });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur", { id: loadingToast });
      }
    } catch {
      toast.error("Erreur technique", { id: loadingToast });
    }
  }

  async function handleGenerateMatches() {
    setLoading(true);
    const modeLabel =
      generationMode === "RANDOM"
        ? "Aléatoire"
        : generationMode === "COMPETITIVE"
          ? "Compétition"
          : "Tournoi";
    const loadingToast = toast.loading(`Génération (${modeLabel})…`);
    try {
      const result = await generateMatches(session.id, generationMode);
      if (result.success) {
        toast.success("Matchs générés", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Échec", { id: loadingToast });
      }
    } catch {
      toast.error("Erreur technique", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRoundStatus(roundIdx: number, isClosed: boolean) {
    const loadingToast = toast.loading(
      isClosed ? "Verrouillage…" : "Déverrouillage…"
    );
    try {
      const result = await toggleRoundStatus({
        sessionId: session.id,
        roundIdx,
        isClosed,
      });
      if (result.success) {
        toast.success(isClosed ? "Ronde verrouillée" : "Ronde ouverte", {
          id: loadingToast,
        });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur", { id: loadingToast });
      }
    } catch {
      toast.error("Erreur technique", { id: loadingToast });
    }
  }

  async function handleDeleteMatch(matchId: string) {
    if (!confirm("Supprimer ce match ?")) return;
    const loadingToast = toast.loading("Suppression…");
    try {
      const result = await deleteMatch(matchId);
      if (result.success) {
        toast.success("Match supprimé", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur", { id: loadingToast });
      }
    } catch {
      toast.error("Erreur technique", { id: loadingToast });
    }
  }

  async function handleDeleteAllMatches() {
    if (
      !confirm(
        "Supprimer TOUS les matchs de cette session ? Action irréversible."
      )
    )
      return;
    setLoading(true);
    const loadingToast = toast.loading("Nettoyage…");
    try {
      const result = await deleteAllMatches(session.id);
      if (result.success) {
        toast.success("Matchs supprimés", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur", { id: loadingToast });
      }
    } catch {
      toast.error("Erreur technique", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  async function handleTerminateSession() {
    if (
      !confirm(
        "Terminer cette session ?\nPlus de nouvelles parties ne pourront être générées."
      )
    )
      return;
    setLoading(true);
    const loadingToast = toast.loading("Fermeture…");
    try {
      const result = await terminateSession(session.id);
      if (result.success) {
        toast.success("Session terminée", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur", { id: loadingToast });
      }
    } catch {
      toast.error("Erreur technique", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = presentCount >= 2 && !loading && !isFinished;
  const emptyCourts = courtCount < 1;
  const allScored =
    initialMatches.length > 0 && scoredCount === initialMatches.length;

  /** Soirée type — 4 étapes max (le reste est secondaire) */
  const flowStep: 1 | 2 | 3 | 4 = isFinished
    ? 4
    : presentCount < 2
      ? 1
      : initialMatches.length === 0
        ? 2
        : !allScored
          ? 3
          : 4;

  const flowSteps = [
    {
      n: 1 as const,
      label: "Présences",
      done: presentCount >= 2,
      meta: presentCount > 0 ? `${presentCount}` : "",
    },
    {
      n: 2 as const,
      label: "Générer",
      done: initialMatches.length > 0,
      meta: "",
    },
    {
      n: 3 as const,
      label: "Scores",
      done: allScored,
      meta:
        initialMatches.length > 0
          ? `${scoredCount}/${initialMatches.length}`
          : "",
    },
    {
      n: 4 as const,
      label: "Clôturer",
      done: isFinished,
      meta: "",
    },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Parcours soirée — 4 écrans logiques */}
      <nav aria-label="Parcours soirée type" className="space-y-2">
        <p className="text-xs font-medium text-slate-300 px-0.5">
          Soirée type · étape {flowStep}/4
        </p>
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {flowSteps.map((step) => {
            const active = flowStep === step.n;
            return (
              <li
                key={step.n}
                aria-current={active ? "step" : undefined}
                className={`rounded-xl border px-3 py-2.5 text-center ${
                  step.done
                    ? "border-pickle-primary/35 bg-pickle-primary/10"
                    : active
                      ? "border-white/20 bg-white/[0.07] ring-1 ring-pickle-primary/40"
                      : "border-white/10 bg-transparent opacity-70"
                }`}
              >
                <p className="text-[10px] text-slate-300 mb-0.5">
                  {step.n}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    step.done || active
                      ? "text-white"
                      : "text-slate-300"
                  }`}
                >
                  {step.label}
                  {step.meta ? (
                    <span className="text-pickle-primary font-medium">
                      {" "}
                      {step.meta}
                    </span>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-slate-300 leading-relaxed">
          {flowStep === 1 &&
            "Cochez qui est là ce soir (minimum 2)."}
          {flowStep === 2 &&
            "Choisissez le mode puis générez les parties sur les terrains."}
          {flowStep === 3 &&
            "Saisissez les scores match par match (gros bouton sur chaque carte)."}
          {flowStep === 4 &&
            (isFinished
              ? "Session terminée. Recap IA et stats disponibles."
              : "Tous les scores sont saisis — vous pouvez clôturer la session.")}
        </p>
      </nav>

      {emptyCourts && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/25 bg-amber-500/10 text-sm text-amber-100">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium">Aucun terrain configuré</p>
            <p className="text-amber-100/70 text-xs mt-0.5">
              Ajoutez des terrains dans Paramètres avant de générer des matchs.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Étape 1 — Présences (+ mode pour étape 2) */}
        <div
          className={`lg:col-span-1 space-y-4 ${
            flowStep === 1 || flowStep === 2 ? "order-1" : "order-1 lg:opacity-95"
          }`}
        >
          <GlassCard
            className={`p-4 md:p-5 ${
              flowStep === 1 ? "ring-1 ring-pickle-primary/30" : ""
            }`}
            hoverEffect={false}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-pickle-primary" aria-hidden />
                1. Présences
              </h3>
              <span className="text-sm font-medium tabular-nums text-slate-300">
                {presentCount}/{leaguePlayers.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[min(55vh,520px)] overflow-y-auto pr-1 custom-scrollbar">
              {(() => {
                const permanents = leaguePlayers
                  .filter((p) => p.type === "permanent")
                  .sort((a, b) =>
                    `${a.firstName} ${a.lastName}`.localeCompare(
                      `${b.firstName} ${b.lastName}`
                    )
                  );
                const replacements = leaguePlayers
                  .filter((p) => p.type === "remplacant")
                  .sort((a, b) =>
                    `${a.firstName} ${a.lastName}`.localeCompare(
                      `${b.firstName} ${b.lastName}`
                    )
                  );

                const renderPlayer = (player: Player) => {
                  const isPresent = attendancesMap.get(player.id) ?? false;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() =>
                        handleToggleAttendance(player.id, isPresent)
                      }
                      className={`w-full flex items-center justify-between min-h-[52px] px-3 py-2.5 rounded-xl border transition-colors active:scale-[0.99] ${
                        isPresent
                          ? "bg-pickle-primary/10 border-pickle-primary/35 text-white"
                          : "bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-col items-start text-left min-w-0">
                        <span className="font-medium text-sm truncate max-w-full">
                          {player.firstName} {player.lastName}
                        </span>
                        <span className="text-xs opacity-60">
                          Niv. {player.skillLevel.toFixed(1)}
                          {player.type === "remplacant" ? " · remp." : ""}
                        </span>
                      </div>
                      {isPresent ? (
                        <CheckCircle2 className="w-6 h-6 text-pickle-primary shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 opacity-20 shrink-0" />
                      )}
                    </button>
                  );
                };

                return (
                  <div className="space-y-4">
                    {permanents.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-500 px-1">
                          Permanents
                        </p>
                        {permanents.map(renderPlayer)}
                      </div>
                    )}
                    {replacements.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-500 px-1">
                          Remplaçants
                        </p>
                        {replacements.map(renderPlayer)}
                      </div>
                    )}
                    {leaguePlayers.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-8">
                        Aucun joueur dans la ligue.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
              <p className="text-xs font-semibold text-slate-300">
                2. Mode puis générer
              </p>
              <div
                className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/30 border border-white/10"
                role="group"
                aria-label="Mode de matchmaking"
              >
                {(
                  [
                    {
                      id: "RANDOM" as const,
                      label: "Social",
                      title: "Variété max, peu de skill",
                    },
                    {
                      id: "TOURNAMENT" as const,
                      label: "Tournoi",
                      title: "Niveaux + jouer avec le plus de monde",
                    },
                    {
                      id: "COMPETITIVE" as const,
                      label: "Compét.",
                      title: "Équilibre de niveaux prioritaire",
                    },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    title={m.title}
                    onClick={() => setGenerationMode(m.id)}
                    className={`py-2.5 px-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pickle-primary ${
                      generationMode === m.id
                        ? "bg-pickle-primary/25 text-pickle-primary"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {generationMode === "TOURNAMENT" &&
                  "Tournoi amateur : matchs équilibrés + partenaires/adversaires variés."}
                {generationMode === "RANDOM" &&
                  "Social : priorité à la variété, sans forcer les niveaux."}
                {generationMode === "COMPETITIVE" &&
                  "Compétition : priorité à l’équilibre des niveaux."}
              </p>

              <div className="hidden lg:block">
                <NeonButton
                  className="w-full py-4"
                  variant="primary"
                  disabled={!canGenerate || emptyCourts}
                  onClick={handleGenerateMatches}
                >
                  <Play className="w-4 h-4" aria-hidden />
                  {isFinished
                    ? "Session terminée"
                    : loading
                      ? "Génération…"
                      : "Générer les parties"}
                </NeonButton>
                {presentCount < 2 && !isFinished && (
                  <p className="text-xs text-center text-slate-300 mt-2">
                    Marquez au moins 2 présents.
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Étapes 3–4 — Scores + clôture */}
        <div
          className={`lg:col-span-2 space-y-4 ${
            flowStep >= 3 ? "ring-0" : ""
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-pickle-muted" aria-hidden />
              3. Scores
              {initialMatches.length > 0 && (
                <span className="text-sm font-normal text-slate-300">
                  · {scoredCount}/{initialMatches.length} scorés
                </span>
              )}
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Secondaire : actions avancées */}
              {initialMatches.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer list-none px-3 py-2 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                    Options avancées
                  </summary>
                  <div className="mt-2 flex flex-col gap-1.5 min-w-[10rem]">
                    <button
                      type="button"
                      onClick={handleDeleteAllMatches}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden />
                      Tout effacer
                    </button>
                  </div>
                </details>
              )}
            </div>
          </div>

          {/* Étape 4 — Clôturer (mise en avant quand scores OK) */}
          {flowStep === 4 && !isFinished && (
            <GlassCard
              className="p-4 md:p-5 border-pickle-primary/30 bg-pickle-primary/5"
              hoverEffect={false}
            >
              <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-pickle-primary" aria-hidden />
                4. Clôturer la soirée
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Tous les scores sont saisis. Terminez la session pour figer les
                résultats et débloquer le recap.
              </p>
              <NeonButton
                variant="primary"
                className="w-full sm:w-auto py-3.5 px-6"
                disabled={loading}
                onClick={handleTerminateSession}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden />
                Terminer la session
              </NeonButton>
            </GlassCard>
          )}

          {flowStep === 4 && isFinished && (
            <GlassCard className="p-4 border-white/10" hoverEffect={false}>
              <p className="text-sm font-semibold text-pickle-primary">
                Session clôturée
              </p>
              <p className="text-sm text-slate-300 mt-1">
                Plus de nouvelles parties. Recap et stats ci-dessous.
              </p>
            </GlassCard>
          )}

          {(isFinished || aiRecap) && (
            <AiRecapCard
              sessionId={session.id}
              initialRecap={aiRecap}
              isCompleted={isFinished}
            />
          )}

          {initialMatches.length === 0 ? (
            <GlassCard
              className="p-10 md:p-14 text-center border-dashed border-white/10"
              hoverEffect={false}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Play className="w-7 h-7 text-slate-600" />
              </div>
              <h4 className="text-base font-semibold text-white">
                Aucune partie encore
              </h4>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
                Cochez les présents, choisissez le mode, puis générez les
                rencontres sur les terrains.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-8">
              {Array.from({
                length: Math.ceil(
                  initialMatches.length / Math.max(1, courtCount)
                ),
              }).map((_, roundIdx) => {
                const safeCourts = Math.max(1, courtCount);
                const roundMatches = initialMatches.slice(
                  roundIdx * safeCourts,
                  (roundIdx + 1) * safeCourts
                );
                const isRoundClosed = closedRounds.includes(roundIdx);
                const gridCols =
                  courtCount === 2
                    ? "md:grid-cols-2"
                    : courtCount >= 3
                      ? "lg:grid-cols-3"
                      : "md:grid-cols-2";

                return (
                  <div key={roundIdx} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/10" />
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                            isRoundClosed
                              ? "bg-white/5 border-white/5 text-slate-500"
                              : "bg-pickle-primary/10 border-pickle-primary/25 text-pickle-primary"
                          }`}
                        >
                          Ronde {roundIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleRoundStatus(roundIdx, !isRoundClosed)
                          }
                          className={`p-2 rounded-lg border transition-colors ${
                            isRoundClosed
                              ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                              : "border-white/10 text-slate-500 hover:text-white"
                          }`}
                          title={
                            isRoundClosed
                              ? "Rouvrir la ronde"
                              : "Verrouiller la ronde"
                          }
                        >
                          {isRoundClosed ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className={`grid grid-cols-1 gap-3 ${gridCols}`}>
                      {roundMatches.map((match, idx) => {
                        const hasWinner =
                          match.data.winner !== undefined &&
                          match.data.winner !== null;

                        return (
                          <GlassCard
                            key={match.id}
                            className={`p-0 overflow-hidden transition-colors ${
                              hasWinner
                                ? "border-pickle-primary/25"
                                : "border-white/10"
                            } ${isRoundClosed ? "opacity-70" : ""}`}
                            hoverEffect={false}
                          >
                            <div className="px-4 py-2.5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                              <span className="text-xs font-medium text-slate-400">
                                {match.court?.name || `Terrain ${idx + 1}`}
                              </span>
                              {!isRoundClosed && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMatch(match.id);
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                                  aria-label="Supprimer le match"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div
                                  className={`flex-1 space-y-2 min-w-0 ${
                                    match.data.winner === 2 ? "opacity-40" : ""
                                  }`}
                                >
                                  {match.data.team1.map((pId: string) => {
                                    const p = leaguePlayers.find(
                                      (lp) => lp.id === pId
                                    );
                                    return (
                                      <p
                                        key={pId}
                                        className="text-sm font-medium text-white leading-snug truncate"
                                      >
                                        {p?.firstName} {p?.lastName}
                                      </p>
                                    );
                                  })}
                                  {match.data.winner === 1 && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-pickle-primary">
                                      <Trophy className="w-3 h-3" />
                                      Gagnants
                                    </span>
                                  )}
                                </div>

                                <span className="text-xs font-semibold text-slate-500 shrink-0">
                                  VS
                                </span>

                                <div
                                  className={`flex-1 space-y-2 text-right min-w-0 ${
                                    match.data.winner === 1 ? "opacity-40" : ""
                                  }`}
                                >
                                  {match.data.team2.map((pId: string) => {
                                    const p = leaguePlayers.find(
                                      (lp) => lp.id === pId
                                    );
                                    return (
                                      <p
                                        key={pId}
                                        className="text-sm font-medium text-white leading-snug truncate"
                                      >
                                        {p?.firstName} {p?.lastName}
                                      </p>
                                    );
                                  })}
                                  {match.data.winner === 2 && (
                                    <span className="inline-flex items-center justify-end gap-1 text-[11px] font-medium text-pickle-primary">
                                      Gagnants
                                      <Trophy className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                !isRoundClosed && setSelectedMatch(match)
                              }
                              disabled={isRoundClosed}
                              className={`w-full min-h-[48px] text-sm font-semibold border-t border-white/5 transition-colors flex items-center justify-center gap-2 ${
                                isRoundClosed
                                  ? "bg-white/[0.02] text-slate-600"
                                  : hasWinner
                                    ? "bg-pickle-primary/10 text-pickle-primary hover:bg-pickle-primary hover:text-black"
                                    : "bg-white/[0.03] text-white hover:bg-white/10"
                              }`}
                            >
                              {hasWinner ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  Modifier le score
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" />
                                  Saisir le score
                                </>
                              )}
                            </button>
                          </GlassCard>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Barre sticky mobile — action de l'étape courante */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-slate-950/95 border-t border-white/10 backdrop-blur-md safe-area-pb">
        {flowStep <= 2 && !isFinished && (
          <NeonButton
            className="w-full py-4 text-sm"
            variant="primary"
            disabled={!canGenerate || emptyCourts}
            onClick={handleGenerateMatches}
          >
            <Play className="w-4 h-4" aria-hidden />
            {loading
              ? "Génération…"
              : presentCount < 2
                ? "1. Cochez 2 présents min."
                : "2. Générer les parties"}
          </NeonButton>
        )}
        {flowStep === 3 && (
          <p className="text-center text-sm text-slate-200 py-2">
            3. Saisissez un score sur chaque match
          </p>
        )}
        {flowStep === 4 && !isFinished && (
          <NeonButton
            className="w-full py-4 text-sm"
            variant="primary"
            disabled={loading}
            onClick={handleTerminateSession}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            4. Terminer la session
          </NeonButton>
        )}
      </div>

      <ResultModal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
        leaguePlayers={leaguePlayers}
      />
    </div>
  );
}
