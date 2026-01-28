import type { CategoryContext } from './index';

export const GAMES_CONTEXT: CategoryContext = {
    category: 'Games',
    common_patterns: [
        'In-game currency displays (coins, gems, tokens) are standard game economy elements',
        'Loot boxes and gacha mechanics require probability disclosure in many jurisdictions',
        'Leaderboards and player rankings are standard competitive features',
        'Season passes and battle passes are common monetization models',
        'Multiplayer matchmaking and chat are standard online gaming features',
    ],
    specific_guidelines: [
        'Section 3.1.1 - All in-game purchases must use IAP (virtual currency, power-ups, cosmetics)',
        'Section 3.1.2 - Auto-renewable subscriptions for game passes must clearly disclose terms',
        'Section 5.3 - Gambling mechanics require proper licensing and geo-restriction',
        'Section 1.1.7 - Realistic violence must be age-rated appropriately (12+ or 17+)',
    ],
    false_positive_overrides: [
        'In-game currency amounts (coins, gems) are NOT real monetary values',
        'Game scores and rankings are NOT misleading performance claims',
        'Fantasy violence in game screenshots is expected for action/adventure genres',
        'Power-up or item descriptions are NOT unsubstantiated product claims',
        'Multiplayer lobby screenshots with player names are standard demo content',
    ],
};
