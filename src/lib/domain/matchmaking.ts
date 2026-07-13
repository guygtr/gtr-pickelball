/**
 * GTR-Pickleball — Domaine de Matchmaking
 * Standard Architectural GTR-Team 2026
 */

import { Player, Court } from "@prisma/client";

export interface MatchDesign {
  team1: string[];
  team2: string[];
  courtId: string;
  type: "SINGLES" | "DOUBLES";
}

/**
 * - RANDOM : social max (variété), peu de skill
 * - COMPETITIVE : jouer avec le plus de monde différent + parties équilibrées (niveaux)
 * - TOURNAMENT : parties les plus serrées possible (skill), social secondaire
 */
export type MatchmakingMode = "RANDOM" | "COMPETITIVE" | "TOURNAMENT";

export interface MatchmakingStats {
  playCount: Map<string, number>;
  partnershipCount: Map<string, number>;
  oppositionCount: Map<string, number>;
  matchupCount: Map<string, number>;
  quartetCount: Map<string, number>; // Groups of 4 playing together
  lastMatchups: Set<string>; 
  lastOppositions: Set<string>;
  playerSkills: Map<string, number>;
  mode: MatchmakingMode;
}

type ModeWeights = {
  PARTNER_WEIGHT: number;
  OPPOSITION_WEIGHT: number;
  MATCHUP_WEIGHT: number;
  QUARTET_WEIGHT: number;
  CONSECUTIVE_OPP_WEIGHT: number;
  SKILL_BALANCE_WEIGHT: number;
  SKILL_SPREAD_WEIGHT: number;
  useSkill: boolean;
};

/**
 * Profils de poids par mode (défaut UI produit : COMPETITIVE).
 */
export function getModeWeights(mode: MatchmakingMode): ModeWeights {
  if (mode === "TOURNAMENT") {
    // Priorité : parties serrées (écarts de niveau minimaux).
    // Social léger : on tolère rejouer ensemble si ça resserre le match.
    return {
      PARTNER_WEIGHT: 800, // faible — rejouer ensemble OK
      OPPOSITION_WEIGHT: 600,
      MATCHUP_WEIGHT: 1200,
      QUARTET_WEIGHT: 1500,
      CONSECUTIVE_OPP_WEIGHT: 8000, // un peu éviter face-à-face immédiat
      SKILL_BALANCE_WEIGHT: 45000, // fort — écart inter-équipes
      SKILL_SPREAD_WEIGHT: 12000, // paires internes cohérentes
      useSkill: true,
    };
  }
  if (mode === "COMPETITIVE") {
    // Ligue amateur : chacun joue avec/contre le plus de monde + matchs équilibrés
    return {
      PARTNER_WEIGHT: 90000, // fort — éviter le même partenaire
      OPPOSITION_WEIGHT: 5000, // variété d'adversaires
      MATCHUP_WEIGHT: 35000, // éviter le même 2v2
      QUARTET_WEIGHT: 8000, // même 4 OK si les paires changent
      CONSECUTIVE_OPP_WEIGHT: 18000,
      SKILL_BALANCE_WEIGHT: 40000, // parties serrées entre équipes
      SKILL_SPREAD_WEIGHT: 3500, // laisse fort+faible pour équilibrer le terrain
      useSkill: true,
    };
  }
  // RANDOM — purement social
  return {
    PARTNER_WEIGHT: 50000,
    OPPOSITION_WEIGHT: 500,
    MATCHUP_WEIGHT: 20000,
    QUARTET_WEIGHT: 100000,
    CONSECUTIVE_OPP_WEIGHT: 10000,
    SKILL_BALANCE_WEIGHT: 0,
    SKILL_SPREAD_WEIGHT: 0,
    useSkill: false,
  };
}

/**
 * Génère une clé unique pour un match complet (équipe vs équipe).
 */
export function getMatchupKey(team1: string[], team2: string[]) {
  const k1 = getPartnershipKey(team1[0], team1[1] || team1[0]);
  const k2 = getPartnershipKey(team2[0], team2[1] || team2[0]);
  return [k1, k2].sort().join('::');
}

/**
 * Génère une clé unique pour un groupe de 4 joueurs (quartet).
 */
export function getQuartetKey(playerIds: string[]) {
  return [...playerIds].sort().join(',');
}

/**
 * Génère une clé unique triée pour deux joueurs (utilisé pour partenariats et oppositions).
 */
export function getPartnershipKey(id1: string, id2: string) {
  return [id1, id2].sort().join(',');
}

/**
 * Calcul du coût d'une configuration de match basée sur l'équité historique et le niveau.
 */
function calculateMatchCost(
  team1: string[],
  team2: string[],
  stats: MatchmakingStats
): number {
  const isDoubles = team1.length === 2 && team2.length === 2;
  const w = getModeWeights(stats.mode);

  let currentCost = 0;

  if (isDoubles) {
    // 1. ROTATION / diversité sociale
    const p1 =
      stats.partnershipCount.get(getPartnershipKey(team1[0], team1[1])) || 0;
    const p2 =
      stats.partnershipCount.get(getPartnershipKey(team2[0], team2[1])) || 0;

    const kO1 = getPartnershipKey(team1[0], team2[0]);
    const kO2 = getPartnershipKey(team1[0], team2[1]);
    const kO3 = getPartnershipKey(team1[1], team2[0]);
    const kO4 = getPartnershipKey(team1[1], team2[1]);

    const o1 = stats.oppositionCount.get(kO1) || 0;
    const o2 = stats.oppositionCount.get(kO2) || 0;
    const o3 = stats.oppositionCount.get(kO3) || 0;
    const o4 = stats.oppositionCount.get(kO4) || 0;

    const consecutiveOppCost =
      ((stats.lastOppositions.has(kO1) ? 1 : 0) +
        (stats.lastOppositions.has(kO2) ? 1 : 0) +
        (stats.lastOppositions.has(kO3) ? 1 : 0) +
        (stats.lastOppositions.has(kO4) ? 1 : 0)) *
      w.CONSECUTIVE_OPP_WEIGHT;

    const matchupKey = getMatchupKey(team1, team2);
    const mCount = stats.matchupCount.get(matchupKey) || 0;

    const quartetKey = getQuartetKey([...team1, ...team2]);
    const qCount = stats.quartetCount.get(quartetKey) || 0;

    const immediatePenalty = stats.lastMatchups.has(matchupKey) ? 2000000 : 0;

    currentCost +=
      (p1 + p2) * w.PARTNER_WEIGHT +
      (Math.pow(o1, 2) +
        Math.pow(o2, 2) +
        Math.pow(o3, 2) +
        Math.pow(o4, 2)) *
        w.OPPOSITION_WEIGHT +
      consecutiveOppCost +
      mCount * w.MATCHUP_WEIGHT +
      qCount * w.QUARTET_WEIGHT +
      immediatePenalty;

    // 2. SKILL (COMPETITIVE + TOURNAMENT)
    if (w.useSkill) {
      const s1 = stats.playerSkills.get(team1[0]) || 3.0;
      const s2 = stats.playerSkills.get(team1[1]) || 3.0;
      const s3 = stats.playerSkills.get(team2[0]) || 3.0;
      const s4 = stats.playerSkills.get(team2[1]) || 3.0;

      const team1Avg = (s1 + s2) / 2;
      const team2Avg = (s3 + s4) / 2;

      const balanceGap = Math.abs(team1Avg - team2Avg);
      const spreadGap1 = Math.abs(s1 - s2);
      const spreadGap2 = Math.abs(s3 - s4);

      currentCost +=
        balanceGap * w.SKILL_BALANCE_WEIGHT +
        (spreadGap1 + spreadGap2) * w.SKILL_SPREAD_WEIGHT;
    }
  } else {
    // Simple (1v1)
    const kO = getPartnershipKey(team1[0], team2[0]);
    const o = stats.oppositionCount.get(kO) || 0;
    const consecutiveOppCost = stats.lastOppositions.has(kO)
      ? w.CONSECUTIVE_OPP_WEIGHT
      : 0;

    const matchupKey = getMatchupKey(team1, team2);
    const immediatePenalty = stats.lastMatchups.has(matchupKey) ? 2000000 : 0;

    currentCost +=
      Math.pow(o, 2) * w.OPPOSITION_WEIGHT +
      consecutiveOppCost +
      immediatePenalty;

    if (w.useSkill) {
      const s1 = stats.playerSkills.get(team1[0]) || 3.0;
      const s2 = stats.playerSkills.get(team2[0]) || 3.0;
      currentCost += Math.abs(s1 - s2) * w.SKILL_BALANCE_WEIGHT;
    }
  }

  return currentCost;
}

/**
 * Les 3 façons de couper 4 joueurs en 2 paires (doubles).
 */
function doublesTeamSplits(
  a: string,
  b: string,
  c: string,
  d: string
): Array<[string[], string[]]> {
  return [
    [
      [a, b],
      [c, d],
    ],
    [
      [a, c],
      [b, d],
    ],
    [
      [a, d],
      [b, c],
    ],
  ];
}

/**
 * Meilleure répartition doubles pour 4 joueurs selon le coût.
 */
function bestDoublesForQuartet(
  ids: [string, string, string, string],
  stats: MatchmakingStats
): { team1: string[]; team2: string[]; cost: number } {
  let best = {
    team1: [ids[0], ids[1]] as string[],
    team2: [ids[2], ids[3]] as string[],
    cost: Infinity,
  };
  for (const [t1, t2] of doublesTeamSplits(ids[0], ids[1], ids[2], ids[3])) {
    const cost = calculateMatchCost(t1, t2, stats);
    if (cost < best.cost) {
      best = { team1: t1, team2: t2, cost };
    }
  }
  return best;
}

/**
 * Algorithme Monte-Carlo pour optimiser un round de jeu unique.
 * Pour chaque groupe de 4, évalue les 3 pairings doubles (pas seulement ordre du shuffle).
 */
export function generateOptimalRound(
  playersInRound: Player[],
  courts: Court[],
  stats: MatchmakingStats,
  iterations: number
): { matches: MatchDesign[]; cost: number } {
  let bestMatches: MatchDesign[] = [];
  let minRoundCost = Infinity;

  // Ne pas forcer des milliers d'itérations si l'appelant en a déjà fixé un budget
  const actualIterations =
    playersInRound.length <= 12
      ? Math.max(iterations, Math.min(2000, Math.max(iterations, 400)))
      : iterations;

  for (let i = 0; i < actualIterations; i++) {
    const shuffled = [...playersInRound].sort(() => Math.random() - 0.5);
    let currentRoundCost = 0;
    const roundMatches: MatchDesign[] = [];
    const tempPlayers = [...shuffled];

    for (let c = 0; c < courts.length && tempPlayers.length >= 2; c++) {
      const isDoubles = tempPlayers.length >= 4;
      if (isDoubles) {
        const courtPlayers = tempPlayers.splice(0, 4);
        const ids = courtPlayers.map((p) => p.id) as [
          string,
          string,
          string,
          string,
        ];
        const best = bestDoublesForQuartet(ids, stats);
        currentRoundCost += best.cost;
        roundMatches.push({
          team1: best.team1,
          team2: best.team2,
          courtId: courts[c].id,
          type: "DOUBLES",
        });
      } else {
        const courtPlayers = tempPlayers.splice(0, 2);
        const t1 = [courtPlayers[0].id];
        const t2 = [courtPlayers[1].id];
        currentRoundCost += calculateMatchCost(t1, t2, stats);
        roundMatches.push({
          team1: t1,
          team2: t2,
          courtId: courts[c].id,
          type: "SINGLES",
        });
      }
    }

    if (currentRoundCost < minRoundCost) {
      minRoundCost = currentRoundCost;
      bestMatches = roundMatches;
      if (minRoundCost === 0) break;
    }
  }

  return { matches: bestMatches, cost: minRoundCost };
}

/**
 * Helper pour cloner les stats de matchmaking afin de simuler des sessions.
 */
function cloneMatchmakingStats(stats: MatchmakingStats): MatchmakingStats {
  return {
    playCount: new Map(stats.playCount),
    partnershipCount: new Map(stats.partnershipCount),
    oppositionCount: new Map(stats.oppositionCount),
    matchupCount: new Map(stats.matchupCount),
    quartetCount: new Map(stats.quartetCount),
    lastMatchups: new Set(stats.lastMatchups),
    lastOppositions: new Set(stats.lastOppositions),
    playerSkills: new Map(stats.playerSkills),
    mode: stats.mode
  };
}

/**
 * Orchestrateur de matchmaking pour toute une session.
 */
export function generateFullSessionMatches(
  presentPlayers: Player[],
  courts: Court[],
  initialStats: MatchmakingStats,
  sessionDuration: number,
  matchDuration: number = 15,
  iterations?: number
): MatchDesign[] {
  const roundsCount = Math.max(1, Math.floor(sessionDuration / matchDuration));
  const isPerfectGroup = [4, 8, 12].includes(presentPlayers.length) && (presentPlayers.length / 4 === courts.length);
  
  // COMPETITIVE / RANDOM (8, 12…) : plus d'essais session pour variété + équilibre
  // Budgets bornés pour rester < ~2s sur un generate en prod
  const sessionTrials =
    isPerfectGroup && initialStats.mode === "COMPETITIVE"
      ? 50
      : isPerfectGroup && initialStats.mode === "RANDOM"
        ? 80
        : initialStats.mode === "TOURNAMENT"
          ? 20
          : 12;
  let bestSessionMatches: MatchDesign[] = [];
  let minSessionCost = Infinity;

  const roundIterations =
    iterations ??
    (isPerfectGroup
      ? initialStats.mode === "COMPETITIVE"
        ? 900
        : 700
      : presentPlayers.length > 4
        ? 8000
        : 4000);

  for (let trial = 0; trial < sessionTrials; trial++) {
    const currentSessionMatches: MatchDesign[] = [];
    const stats = cloneMatchmakingStats(initialStats);
    let currentSessionCost = 0;

    for (let round = 0; round < roundsCount; round++) {
      // 1. Sélectionner les joueurs (équité de temps de jeu)
      const sortedCandidates = [...presentPlayers].sort((a, b) => 
        (stats.playCount.get(a.id) || 0) - (stats.playCount.get(b.id) || 0) || Math.random() - 0.5
      );

      const totalPlaces = courts.length * 4;
      const playersInRound = sortedCandidates.slice(0, Math.min(sortedCandidates.length, totalPlaces));
      
      if (playersInRound.length < 2) break;

      // 2. Générer le round optimal
      const { matches: roundMatches, cost: roundCost } = generateOptimalRound(playersInRound, courts, stats, roundIterations);
      currentSessionCost += roundCost;
      
      // 3. Préparer les Matchups de la ronde précédente
      stats.lastMatchups.clear();
      stats.lastOppositions.clear();

      // 4. Appliquer les matchs et mettre à jour les stats temporaires de la simulation
      roundMatches.forEach(m => {
        currentSessionMatches.push(m);
        const mKey = getMatchupKey(m.team1, m.team2);
        stats.matchupCount.set(mKey, (stats.matchupCount.get(mKey) || 0) + 1);
        stats.lastMatchups.add(mKey);

        const qKey = getQuartetKey([...m.team1, ...m.team2]);
        stats.quartetCount.set(qKey, (stats.quartetCount.get(qKey) || 0) + 1);

        [...m.team1, ...m.team2].forEach(id => {
          stats.playCount.set(id, (stats.playCount.get(id) || 0) + 1);
        });

        if (m.team1.length === 2) {
          stats.partnershipCount.set(getPartnershipKey(m.team1[0], m.team1[1]), (stats.partnershipCount.get(getPartnershipKey(m.team1[0], m.team1[1])) || 0) + 1);
          stats.partnershipCount.set(getPartnershipKey(m.team2[0], m.team2[1]), (stats.partnershipCount.get(getPartnershipKey(m.team2[0], m.team2[1])) || 0) + 1);
        }

        m.team1.forEach(p1Id => {
          m.team2.forEach(p2Id => {
            const key = getPartnershipKey(p1Id, p2Id);
            stats.oppositionCount.set(key, (stats.oppositionCount.get(key) || 0) + 1);
            stats.lastOppositions.add(key);
          });
        });
      });
    }

    if (currentSessionCost < minSessionCost) {
      minSessionCost = currentSessionCost;
      bestSessionMatches = currentSessionMatches;
      if (minSessionCost === 0) break; // Session parfaite trouvée !
    }
  }

  return bestSessionMatches;
}
