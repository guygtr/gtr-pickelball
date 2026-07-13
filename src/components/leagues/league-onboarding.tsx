import Link from "next/link";
import { CheckCircle2, Circle, Users, MapPin, Calendar } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";

type Props = {
  leagueId: string;
  playerCount: number;
  courtCount: number;
  sessionCount: number;
};

/**
 * Checklist 3 étapes après création de ligue (onboarding).
 * Masquée quand les 3 sont complètes.
 */
export function LeagueOnboarding({
  leagueId,
  playerCount,
  courtCount,
  sessionCount,
}: Props) {
  const steps = [
    {
      id: "players",
      label: "Ajouter des joueurs",
      hint: "Au moins 2 pour jouer une session",
      done: playerCount >= 2,
      href: `/leagues/${leagueId}/players`,
      icon: Users,
    },
    {
      id: "courts",
      label: "Configurer les terrains",
      hint: "Requis pour générer les matchs",
      done: courtCount >= 1,
      href: `/leagues/${leagueId}/settings`,
      icon: MapPin,
    },
    {
      id: "session",
      label: "Créer une session",
      hint: "Puis ouvrir le jour de match",
      done: sessionCount >= 1,
      href: `/leagues/${leagueId}/sessions`,
      icon: Calendar,
    },
  ];

  const allDone = steps.every((s) => s.done);
  if (allDone) return null;

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <GlassCard className="p-5 md:p-6 border-pickle-primary/20" hoverEffect={false}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-medium text-pickle-primary uppercase tracking-wide">
            Démarrage rapide
          </p>
          <h2 className="text-lg font-semibold text-white mt-1">
            3 étapes pour votre première soirée
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            {doneCount}/3 complétées — le reste de l’app reste accessible.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pickle-primary focus-visible:ring-offset-2 focus-visible:ring-offset-pickle-dark ${
                  step.done
                    ? "border-pickle-primary/25 bg-pickle-primary/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {step.done ? (
                    <CheckCircle2 className="w-6 h-6 text-pickle-primary" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Icon className="w-4 h-4 text-slate-300 shrink-0" aria-hidden />
                    {i + 1}. {step.label}
                  </span>
                  <span className="block text-sm text-slate-300 mt-0.5">
                    {step.hint}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </GlassCard>
  );
}
