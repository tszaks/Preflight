import type { CategoryContext } from './index';

export const FINANCE_CONTEXT: CategoryContext = {
    category: 'Finance',
    common_patterns: [
        'Dollar amounts, balances, and transaction histories are expected demo/sample data in screenshots',
        '4+ age rating is standard for finance apps (Mint, YNAB, Copilot, Robinhood all use 4+)',
        'Budget, spending, and savings language is normal financial terminology, not gambling',
        'Showing bank logos or card brand logos for connected account display is standard practice',
        'Charts showing spending trends, net worth, or portfolio performance are expected visualizations',
    ],
    specific_guidelines: [
        'Section 3.1.1 - In-App Purchase (subscription compliance for premium tiers)',
        'Section 5.1.1(v) - Financial data requires heightened privacy protections',
        'Section 3.2.1 - Apps must clearly describe subscription terms and pricing',
    ],
    false_positive_overrides: [
        'Dollar amounts in screenshots are NOT fake data - they are expected demo content for finance apps',
        'Budget/spending/savings language is NOT gambling terminology',
        'Phrases like "Built Different" or "Money Made Magic" are colloquial marketing, NOT unsubstantiated claims',
        'Showing account balances or transaction amounts is NOT misleading content',
        'Interest rate or APY displays are standard financial information, NOT unverifiable claims',
    ],
};
