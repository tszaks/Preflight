/**
 * Static category-based rejection heuristic data.
 *
 * Curated knowledge base mapping App Store categories to their most
 * common rejection patterns, required features, and advisory notes.
 *
 * This is intentionally a static TypeScript file (not a DB table)
 * because category rejection patterns change infrequently and
 * keeping it in code makes it easy to version, review, and test.
 */

export interface CategoryRejectionReason {
    guideline: string;
    description: string;
    frequency: 'very_common' | 'common' | 'occasional';
    trigger_keywords?: string[];
}

export interface CategoryHeuristic {
    category_keywords: string[];
    rejection_risk_level: 'high' | 'medium' | 'low';
    common_rejection_reasons: CategoryRejectionReason[];
    required_features: string[];
    advisory_notes: string[];
}

export const CATEGORY_HEURISTICS: Record<string, CategoryHeuristic> = {
    finance: {
        category_keywords: ['finance', 'banking', 'fintech', 'payment', 'invest', 'stock', 'crypto', 'wallet', 'budget', 'money'],
        rejection_risk_level: 'high',
        common_rejection_reasons: [
            {
                guideline: '3.1.1',
                description: 'In-App Purchase required for digital content or subscriptions. Finance apps often try to handle payments outside IAP.',
                frequency: 'very_common',
                trigger_keywords: ['subscription', 'premium', 'pro', 'upgrade'],
            },
            {
                guideline: '3.1.2',
                description: 'Subscription apps must clearly display pricing, duration, and auto-renewal terms on the paywall.',
                frequency: 'very_common',
                trigger_keywords: ['subscription', 'monthly', 'annual', 'yearly', 'plan'],
            },
            {
                guideline: '2.1(b)',
                description: 'Apps with first-time in-app purchases or subscriptions must submit complete, reviewable products with the app version so reviewers can fetch and test the paywall.',
                frequency: 'common',
                trigger_keywords: ['subscription', 'premium', 'paywall', 'in-app purchase', 'iap'],
            },
            {
                guideline: '5.2.5',
                description: 'Financial apps must not provide personal financial advice without proper disclaimers and licensing disclosures.',
                frequency: 'common',
                trigger_keywords: ['advice', 'advisor', 'recommend', 'portfolio', 'invest'],
            },
            {
                guideline: '5.1.1',
                description: 'Finance apps collecting sensitive financial data must clearly explain data usage and have robust privacy protections.',
                frequency: 'common',
                trigger_keywords: ['bank', 'account', 'balance', 'transaction', 'plaid'],
            },
            {
                guideline: '2.3.1',
                description: 'Financial apps must not use misleading screenshots showing fabricated account balances or returns.',
                frequency: 'occasional',
                trigger_keywords: ['return', 'profit', 'gain', 'earnings'],
            },
        ],
        required_features: [
            'Privacy policy covering financial data handling',
            'Subscription terms displayed on paywall (if applicable)',
            'Reviewable in-app purchase products submitted with the app version when applicable',
            'Account deletion capability (5.1.1)',
        ],
        advisory_notes: [
            'Finance apps face above-average scrutiny during review. Expect 2-5 day review times.',
            'If connecting to bank accounts, ensure PCI DSS compliance documentation is available.',
            'Cryptocurrency apps may require additional regulatory disclosures depending on jurisdiction.',
        ],
    },

    health_fitness: {
        category_keywords: ['health', 'fitness', 'workout', 'exercise', 'diet', 'nutrition', 'wellness', 'meditation', 'yoga', 'sleep'],
        rejection_risk_level: 'medium',
        common_rejection_reasons: [
            {
                guideline: '5.1.3',
                description: 'Health & Fitness apps using HealthKit must include a privacy policy and only use health data for health-related purposes.',
                frequency: 'very_common',
                trigger_keywords: ['healthkit', 'health data', 'heart rate', 'steps', 'calories'],
            },
            {
                guideline: '1.4.1',
                description: 'Apps making health claims must include disclaimers that the app is not a substitute for professional medical advice.',
                frequency: 'common',
                trigger_keywords: ['cure', 'treat', 'diagnose', 'heal', 'remedy', 'medical'],
            },
            {
                guideline: 'ASC-Regulated-Medical-Device',
                description: 'Health & Fitness apps that qualify as regulated medical devices, or report frequent medical/treatment information, may need regulated medical device status in App Store Connect for EEA, UK, or U.S. distribution.',
                frequency: 'occasional',
                trigger_keywords: ['diagnose', 'treatment', 'monitor', 'medical device', 'clinical'],
            },
            {
                guideline: '5.1.1',
                description: 'Health data is considered sensitive. Apps must clearly disclose what data is collected and how it is used.',
                frequency: 'common',
                trigger_keywords: ['weight', 'body', 'blood', 'glucose', 'pressure'],
            },
            {
                guideline: '2.3.1',
                description: 'Health apps must not show misleading before/after results or unrealistic transformation claims.',
                frequency: 'occasional',
                trigger_keywords: ['transform', 'results', 'before', 'after', 'lose weight'],
            },
        ],
        required_features: [
            'Health data disclaimer (if making health claims)',
            'HealthKit privacy policy description (if using HealthKit)',
            'Purpose string for health data access',
            'Regulated medical device status in App Store Connect when applicable for EEA, UK, or U.S. distribution',
        ],
        advisory_notes: [
            'If using HealthKit, ensure NSHealthShareUsageDescription and NSHealthUpdateUsageDescription are set.',
            'Avoid absolute health claims. Use language like "may help" instead of "will cure".',
        ],
    },

    medical: {
        category_keywords: ['medical', 'clinical', 'patient', 'doctor', 'telemedicine', 'telehealth', 'pharmacy', 'prescription', 'diagnosis'],
        rejection_risk_level: 'high',
        common_rejection_reasons: [
            {
                guideline: '1.4.1',
                description: 'Medical apps providing diagnostic or treatment functionality may be classified as medical devices requiring FDA clearance.',
                frequency: 'very_common',
                trigger_keywords: ['diagnose', 'diagnosis', 'treatment', 'prescribe', 'clinical'],
            },
            {
                guideline: 'ASC-Regulated-Medical-Device',
                description: 'Medical apps distributed in the EEA, UK, or U.S. may need regulated medical device status in App Store Connect, including relevant regulatory information, contact details, and safety information.',
                frequency: 'common',
                trigger_keywords: ['diagnose', 'diagnosis', 'treatment', 'monitor', 'medical device', 'clinical'],
            },
            {
                guideline: '5.1.3',
                description: 'Medical apps must comply with HIPAA or equivalent regulations when handling patient health information.',
                frequency: 'very_common',
                trigger_keywords: ['patient', 'medical record', 'health record', 'EMR', 'EHR'],
            },
            {
                guideline: '1.4.1',
                description: 'Apps must clearly state whether they are intended for professional healthcare providers or consumer use.',
                frequency: 'common',
                trigger_keywords: ['professional', 'clinical', 'provider'],
            },
            {
                guideline: '2.5.1',
                description: 'Medical apps must use public APIs and documented frameworks only. No private API usage for medical data.',
                frequency: 'occasional',
            },
        ],
        required_features: [
            'Medical disclaimer prominently displayed',
            'HIPAA compliance documentation (if handling PHI)',
            'Professional vs. consumer use designation',
            'Regulated medical device status in App Store Connect for EEA, UK, or U.S. distribution when applicable',
        ],
        advisory_notes: [
            'Medical apps have the highest rejection rate of any category. Plan for extended review times (5-10 days).',
            'FDA regulated apps must include regulatory status in the description.',
            'Consider providing a demo account for Apple reviewers to test clinical features.',
        ],
    },

    social_networking: {
        category_keywords: ['social', 'networking', 'community', 'chat', 'messaging', 'forum', 'dating', 'connect'],
        rejection_risk_level: 'high',
        common_rejection_reasons: [
            {
                guideline: '1.2',
                description: 'Apps with user-generated content must have robust content moderation, reporting, and blocking mechanisms.',
                frequency: 'very_common',
                trigger_keywords: ['post', 'share', 'upload', 'comment', 'message', 'chat'],
            },
            {
                guideline: '1.3',
                description: 'Apps targeting children or with any underage users must comply with COPPA and include parental controls.',
                frequency: 'common',
                trigger_keywords: ['kids', 'children', 'teen', 'family', 'school'],
            },
            {
                guideline: '5.1.1',
                description: 'Social apps must clearly explain data collection practices, especially for location and contacts access.',
                frequency: 'common',
                trigger_keywords: ['location', 'contacts', 'friends', 'nearby', 'discover'],
            },
            {
                guideline: '4.0',
                description: 'Dating apps must implement age verification and safety features including blocking and reporting.',
                frequency: 'common',
                trigger_keywords: ['dating', 'match', 'swipe', 'meet'],
            },
            {
                guideline: '1.1',
                description: 'Social apps must have mechanisms to prevent objectionable content: filters, reporting, moderation team.',
                frequency: 'very_common',
                trigger_keywords: ['photo', 'video', 'live', 'stream'],
            },
            {
                guideline: 'ASC-Australia-Social-Media',
                description: 'Certain social media platforms operating in Australia must prevent people under 16 from having accounts and should surface age assurance and age suitability details in App Store metadata.',
                frequency: 'occasional',
                trigger_keywords: ['australia', 'under 16', 'teen', 'social media', 'age assurance'],
            },
        ],
        required_features: [
            'Content reporting mechanism',
            'User blocking functionality',
            'Content moderation system (human or AI)',
            'Terms of service and community guidelines',
            'Age assurance and Australia under-16 account handling when applicable',
        ],
        advisory_notes: [
            'Apple reviewers will test reporting and blocking flows. Ensure they work in the review build.',
            'If the app includes live streaming, additional content moderation requirements apply.',
            'For impacted social media platforms in Australia, document under-16 account restrictions through the app description, age rating questionnaire, and Age Suitability URL where appropriate.',
        ],
    },

    games: {
        category_keywords: ['game', 'gaming', 'arcade', 'puzzle', 'adventure', 'strategy', 'rpg', 'casual'],
        rejection_risk_level: 'medium',
        common_rejection_reasons: [
            {
                guideline: '3.1.1',
                description: 'Loot boxes, gacha mechanics, and randomized purchases must clearly disclose odds/probabilities to users.',
                frequency: 'very_common',
                trigger_keywords: ['loot', 'gacha', 'chest', 'pack', 'random', 'chance', 'odds'],
            },
            {
                guideline: '5.6.1',
                description: 'Real-money gambling apps must be geo-restricted and require appropriate licenses.',
                frequency: 'common',
                trigger_keywords: ['gamble', 'bet', 'casino', 'poker', 'slot', 'wager'],
            },
            {
                guideline: '2.3.7',
                description: 'Age rating must accurately reflect game content: violence, language, sexual themes.',
                frequency: 'common',
                trigger_keywords: ['violence', 'blood', 'mature', 'adult', 'gore'],
            },
            {
                guideline: '3.1.1',
                description: 'All virtual currency and in-game item purchases must go through IAP.',
                frequency: 'common',
                trigger_keywords: ['coins', 'gems', 'currency', 'credits', 'tokens'],
            },
            {
                guideline: '2.1(b)',
                description: 'Games with first-time IAP products must make those products complete, submitted for review, and fetchable by the reviewer build.',
                frequency: 'common',
                trigger_keywords: ['battle pass', 'premium', 'coins', 'gems', 'iap', 'subscription'],
            },
        ],
        required_features: [
            'Odds disclosure for randomized purchases (if applicable)',
            'Accurate age rating reflecting content',
            'IAP for all digital goods',
            'Reviewable IAP products submitted with the app version when applicable',
        ],
        advisory_notes: [
            'Simulated gambling (no real money) is allowed but must not target children.',
            'If the game features ads, ensure they are clearly distinguished from gameplay.',
        ],
    },

    education: {
        category_keywords: ['education', 'learning', 'school', 'study', 'course', 'teach', 'tutor', 'academic', 'student'],
        rejection_risk_level: 'medium',
        common_rejection_reasons: [
            {
                guideline: '1.3',
                description: 'Education apps likely to be used by children must comply with COPPA: no behavioral advertising, limited data collection.',
                frequency: 'very_common',
                trigger_keywords: ['kids', 'children', 'school', 'student', 'age', 'young'],
            },
            {
                guideline: '5.1.1',
                description: 'Apps collecting student data must have transparent privacy practices and parental consent mechanisms.',
                frequency: 'common',
                trigger_keywords: ['student', 'classroom', 'school', 'minor'],
            },
            {
                guideline: '3.1.1',
                description: 'Subscription-based education apps must clearly show what is free vs. premium content.',
                frequency: 'common',
                trigger_keywords: ['premium', 'subscription', 'unlock', 'pro'],
            },
        ],
        required_features: [
            'COPPA compliance if targeting under-13 users',
            'Parental consent mechanism for child users',
            'Clear free vs. paid content distinction',
        ],
        advisory_notes: [
            'If the app is for the Kids category, stricter rules apply: no third-party analytics, no ads, no external links.',
            'Education apps with classroom features should support Apple School Manager.',
        ],
    },

    shopping: {
        category_keywords: ['shopping', 'ecommerce', 'store', 'shop', 'retail', 'marketplace', 'buy', 'sell', 'commerce'],
        rejection_risk_level: 'medium',
        common_rejection_reasons: [
            {
                guideline: '3.1.3',
                description: 'Physical goods and services purchased outside the app do NOT require IAP. But digital content within the app DOES.',
                frequency: 'very_common',
                trigger_keywords: ['digital', 'download', 'ebook', 'content', 'virtual'],
            },
            {
                guideline: '3.1.4',
                description: 'Apps selling physical goods must not use IAP. Hardware and physical products use standard payment processors.',
                frequency: 'common',
                trigger_keywords: ['shipping', 'delivery', 'physical', 'product'],
            },
            {
                guideline: '2.3.1',
                description: 'Shopping app screenshots must accurately represent the app experience, not just product catalogs.',
                frequency: 'occasional',
            },
            {
                guideline: '5.1.1',
                description: 'Shopping apps collecting payment info must clearly disclose data handling and use secure connections.',
                frequency: 'common',
                trigger_keywords: ['payment', 'credit card', 'checkout'],
            },
        ],
        required_features: [
            'Clear distinction between physical goods (no IAP) and digital goods (IAP required)',
            'Secure payment handling',
            'Return/refund policy disclosure',
        ],
        advisory_notes: [
            'Marketplace apps that connect buyers and sellers must moderate listings for prohibited items.',
            'Subscription auto-renewal terms must be clearly displayed before purchase.',
        ],
    },

    photo_video: {
        category_keywords: ['photo', 'video', 'camera', 'filter', 'editor', 'editing', 'photography', 'film', 'record'],
        rejection_risk_level: 'low',
        common_rejection_reasons: [
            {
                guideline: '5.1.1',
                description: 'Apps accessing the camera or photo library must provide clear, specific purpose strings explaining why.',
                frequency: 'very_common',
                trigger_keywords: ['camera', 'photo library', 'gallery', 'capture'],
            },
            {
                guideline: '5.1.2',
                description: 'Apps using face detection, recognition, or analysis must disclose this and handle face data per privacy guidelines.',
                frequency: 'common',
                trigger_keywords: ['face', 'facial', 'recognition', 'beauty', 'filter', 'ar', 'augmented'],
            },
            {
                guideline: '2.3.1',
                description: 'Photo/video app screenshots must show real app functionality, not sample images that misrepresent capabilities.',
                frequency: 'occasional',
            },
            {
                guideline: '1.1.6',
                description: 'Apps that generate or manipulate images using AI must include content filtering to prevent objectionable output.',
                frequency: 'common',
                trigger_keywords: ['ai', 'generate', 'deepfake', 'swap', 'artificial'],
            },
        ],
        required_features: [
            'Camera usage description (NSCameraUsageDescription)',
            'Photo library usage description (NSPhotoLibraryUsageDescription)',
            'Face data disclosure (if applicable)',
        ],
        advisory_notes: [
            'If the app uses ARKit for face tracking, ensure NSFaceIDUsageDescription is set.',
            'AI-generated content must be clearly labeled as AI-generated in the app.',
        ],
    },
};
