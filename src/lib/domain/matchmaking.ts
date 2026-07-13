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
 * - RANDOM : social max (variété partenaires / quartets), peu de skill
 * - COMPETITIVE : équilibre de niveaux prioritaire
 * - TOURNAMENT : amateur — équilibre niveaux + variété sociale (beaucoup de monde différent)
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
 * Profils de poids par mode (ligue amateur : TOURNAMENT = défaut produit).
 */
export function getModeWeights(mode: MatchmakingMode): ModeWeights {
  if (mode === "TOURNAMENT") {
    // Social fort + compétitif sur les niveaux
    return {
      PARTNER_WEIGHT: 45000,
      OPPOSITION_WEIGHT: 3500,
      MATCHUP_WEIGHT: 18000,
      QUARTET_WEIGHT: 90000,
      CONSECUTIVE_OPP_WEIGHT: 22000,
      SKILL_BALANCE_WEIGHT: 16000,
      SKILL_SPREAD_WEIGHT: 5500,
      useSkill: true,
    };
  }
  if (mode === "COMPETITIVE") {
    return {
      PARTNER_WEIGHT: 2000,
      OPPOSITION_WEIGHT: 2500,
      MATCHUP_WEIGHT: 5000,
      QUARTET_WEIGHT: 3000,
      CONSECUTIVE_OPP_WEIGHT: 25000,
      SKILL_BALANCE_WEIGHT: 15000,
      SKILL_SPREAD_WEIGHT: 5000,
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
 * Algorithme Monte-Carlo pour optimiser un round de jeu unique.
 */
export function generateOptimalRound(
  playersInRound: Player[],
  courts: Court[],
  stats: MatchmakingStats,
  iterations: number
): { matches: MatchDesign[], cost: number } {
  let bestMatches: MatchDesign[] = [];
  let minRoundCost = Infinity;

  // Pour les petits rounds (ex: 8 joueurs), on peut faire plus d'itérations
  const actualIterations = playersInRound.length <= 12 ? Math.max(iterations, 5000) : iterations;

  for (let i = 0; i < actualIterations; i++) {
    const shuffled = [...playersInRound].sort(() => Math.random() - 0.5);
    let currentRoundCost = 0;
    const roundMatches: MatchDesign[] = [];
    const tempPlayers = [...shuffled];

    for (let c = 0; c < courts.length && tempPlayers.length >= 2; c++) {
      const isDoubles = tempPlayers.length >= 4;
      const courtPlayers = isDoubles ? tempPlayers.splice(0, 4) : tempPlayers.splice(0, 2);
      
      const t1 = isDoubles ? [courtPlayers[0].id, courtPlayers[1].id] : [courtPlayers[0].id];
      const t2 = isDoubles ? [courtPlayers[2].id, courtPlayers[3].id] : [courtPlayers[1].id];

      currentRoundCost += calculateMatchCost(t1, t2, stats);
      
      roundMatches.push({
        team1: t1,
        team2: t2,
        courtId: courts[c].id,
        type: isDoubles ? "DOUBLES" : "SINGLES"
      });
    }

    if (currentRoundCost < minRoundCost) {
      minRoundCost = currentRoundCost;
      bestMatches = roundMatches;
      if (minRoundCost === 0) break; // Optimisation parfaite trouvée
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
  
  // En mode Social (4, 8, 12), on simule plusieurs SESSIONS ENTIÈRES pour éviter de se coincer
  // On réduit sessionTrials si on est en mode COMPÉTITION car le skill limite les options parfaites
  // RANDOM / TOURNAMENT : plus d'essais session pour la variété sociale
  const sessionTrials =
    isPerfectGroup &&
    (initialStats.mode === "RANDOM" || initialStats.mode === "TOURNAMENT")
      ? 100
      : initialStats.mode === "TOURNAMENT"
        ? 20
        : 10;
  let bestSessionMatches: MatchDesign[] = [];
  let minSessionCost = Infinity;

  // Réduire les itérations par round lors d'une simulation globale pour rester rapide
  const roundIterations = isPerfectGroup ? 1000 : (iterations || (presentPlayers.length > 4 ? 20000 : 10000));

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
