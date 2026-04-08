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

export interface MatchmakingStats {
  playCount: Map<string, number>;
  partnershipCount: Map<string, number>;
  oppositionCount: Map<string, number>;
  matchupCount: Map<string, number>;
  lastMatchups: Set<string>; // Matchups in the immediate previous round
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
 * Génère une clé unique triée pour deux joueurs (utilisé pour partenariats et oppositions).
 */
export function getPartnershipKey(id1: string, id2: string) {
  return [id1, id2].sort().join(',');
}

/**
 * Calcul du coût d'une configuration de match basée sur l'équité historique.
 */
function calculateMatchCost(
  team1: string[],
  team2: string[],
  stats: MatchmakingStats
): number {
  const isDoubles = team1.length === 2 && team2.length === 2;
  const totalPlayers = stats.playCount.size;
  const isSocialMode = totalPlayers <= 12; // Mode optimisé pour petits groupes (ex: 8 joueurs)
  
  let currentCost = 0;

  // Configuration des poids - BEAUCOUP plus sévère en mode Social
  const PARTNER_WEIGHT = isSocialMode ? 50000 : 1000; 
  const OPPOSITION_WEIGHT = isSocialMode ? 500 : 1;
  const MATCHUP_WEIGHT = isSocialMode ? 20000 : 5000;

  if (isDoubles) {
    // Coût Partenariats - On veut éviter de jouer avec le même partenaire
    const p1 = stats.partnershipCount.get(getPartnershipKey(team1[0], team1[1])) || 0;
    const p2 = stats.partnershipCount.get(getPartnershipKey(team2[0], team2[1])) || 0;
    
    // Coût Oppositions - On veut varier les adversaires
    const o1 = stats.oppositionCount.get(getPartnershipKey(team1[0], team2[0])) || 0;
    const o2 = stats.oppositionCount.get(getPartnershipKey(team1[0], team2[1])) || 0;
    const o3 = stats.oppositionCount.get(getPartnershipKey(team1[1], team2[0])) || 0;
    const o4 = stats.oppositionCount.get(getPartnershipKey(team1[1], team2[1])) || 0;
    
    // Coût Matchup Global - On veut éviter les mêmes configurations d'équipes
    const matchupKey = getMatchupKey(team1, team2);
    const mCount = stats.matchupCount.get(matchupKey) || 0;
    
    // PÉNALITÉ STRICTE DE RÉPÉTITION IMMÉDIATE (Poids 2,000,000)
    const immediatePenalty = stats.lastMatchups.has(matchupKey) ? 2000000 : 0;
    
    currentCost += (p1 + p2) * PARTNER_WEIGHT + (o1 + o2 + o3 + o4) * OPPOSITION_WEIGHT + (mCount * MATCHUP_WEIGHT) + immediatePenalty;
  } else {
    // Mode Simple : Opposition uniquement
    const o = stats.oppositionCount.get(getPartnershipKey(team1[0], team2[0])) || 0;
    const matchupKey = getMatchupKey(team1, team2);
    const immediatePenalty = stats.lastMatchups.has(matchupKey) ? 2000000 : 0;
    
    currentCost += o * OPPOSITION_WEIGHT + immediatePenalty;
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
    lastMatchups: new Set(stats.lastMatchups),
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
  const sessionTrials = isPerfectGroup ? 100 : 1;
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
