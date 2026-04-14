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

export type MatchmakingMode = "RANDOM" | "COMPETITIVE";

export interface MatchmakingStats {
  playCount: Map<string, number>;
  partnershipCount: Map<string, number>;
  oppositionCount: Map<string, number>;
  matchupCount: Map<string, number>;
  quartetCount: Map<string, number>; // Groups of 4 playing together
  lastMatchups: Set<string>; 
  playerSkills: Map<string, number>;
  mode: MatchmakingMode;
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
  const totalPlayers = stats.playCount.size;
  const isRandomMode = stats.mode === "RANDOM" || totalPlayers <= 12; 
  
  let currentCost = 0;

  // Configuration des poids de rotation
  const PARTNER_WEIGHT = isRandomMode ? 50000 : 1000; 
  const OPPOSITION_WEIGHT = isRandomMode ? 500 : 1;
  const MATCHUP_WEIGHT = isRandomMode ? 20000 : 5000;
  const QUARTET_WEIGHT = isRandomMode ? 100000 : 2000; // Forte pénalité pour éviter que les 4 mêmes restent ensemble

  // Configuration des poids de niveau (Skill)
  // En mode COMPÉTITION, l'équilibre des niveaux devient crucial
  const SKILL_BALANCE_WEIGHT = stats.mode === "COMPETITIVE" ? 15000 : 0;
  const SKILL_SPREAD_WEIGHT = stats.mode === "COMPETITIVE" ? 5000 : 0;

  if (isDoubles) {
    // 1. ROTATION
    const p1 = stats.partnershipCount.get(getPartnershipKey(team1[0], team1[1])) || 0;
    const p2 = stats.partnershipCount.get(getPartnershipKey(team2[0], team2[1])) || 0;
    
    const o1 = stats.oppositionCount.get(getPartnershipKey(team1[0], team2[0])) || 0;
    const o2 = stats.oppositionCount.get(getPartnershipKey(team1[0], team2[1])) || 0;
    const o3 = stats.oppositionCount.get(getPartnershipKey(team1[1], team2[0])) || 0;
    const o4 = stats.oppositionCount.get(getPartnershipKey(team1[1], team2[1])) || 0;
    
    const matchupKey = getMatchupKey(team1, team2);
    const mCount = stats.matchupCount.get(matchupKey) || 0;
    
    const quartetKey = getQuartetKey([...team1, ...team2]);
    const qCount = stats.quartetCount.get(quartetKey) || 0;

    const immediatePenalty = stats.lastMatchups.has(matchupKey) ? 2000000 : 0;
    
    currentCost += (p1 + p2) * PARTNER_WEIGHT + 
                   (o1 + o2 + o3 + o4) * OPPOSITION_WEIGHT + 
                   (mCount * MATCHUP_WEIGHT) + 
                   (qCount * QUARTET_WEIGHT) +
                   immediatePenalty;

    // 2. SKILL (Équité de niveau)
    if (stats.mode === "COMPETITIVE") {
      const s1 = stats.playerSkills.get(team1[0]) || 3.0;
      const s2 = stats.playerSkills.get(team1[1]) || 3.0;
      const s3 = stats.playerSkills.get(team2[0]) || 3.0;
      const s4 = stats.playerSkills.get(team2[1]) || 3.0;

      const team1Avg = (s1 + s2) / 2;
      const team2Avg = (s3 + s4) / 2;
      
      // Écart entre les deux équipes (Fair Play)
      const balanceGap = Math.abs(team1Avg - team2Avg);
      
      // Écart au sein de la même équipe (Vouloir jouer avec des gens de son niveau)
      const spreadGap1 = Math.abs(s1 - s2);
      const spreadGap2 = Math.abs(s3 - s4);

      currentCost += (balanceGap * SKILL_BALANCE_WEIGHT) + (spreadGap1 + spreadGap2) * SKILL_SPREAD_WEIGHT;
    }

  } else {
    // Mode Simple
    const o = stats.oppositionCount.get(getPartnershipKey(team1[0], team2[0])) || 0;
    const matchupKey = getMatchupKey(team1, team2);
    const immediatePenalty = stats.lastMatchups.has(matchupKey) ? 2000000 : 0;
    
    currentCost += o * OPPOSITION_WEIGHT + immediatePenalty;

    if (stats.mode === "COMPETITIVE") {
      const s1 = stats.playerSkills.get(team1[0]) || 3.0;
      const s2 = stats.playerSkills.get(team2[0]) || 3.0;
      currentCost += Math.abs(s1 - s2) * SKILL_BALANCE_WEIGHT;
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
  const sessionTrials = (isPerfectGroup && initialStats.mode === "RANDOM") ? 100 : 10;
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
          
          m.team1.forEach(p1Id => {
            m.team2.forEach(p2Id => {
              const key = getPartnershipKey(p1Id, p2Id);
              stats.oppositionCount.set(key, (stats.oppositionCount.get(key) || 0) + 1);
            });
          });
        }
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
