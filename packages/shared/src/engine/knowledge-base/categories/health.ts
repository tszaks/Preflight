import type { CategoryContext } from './index';

export const HEALTH_CONTEXT: CategoryContext = {
    category: 'Health & Fitness',
    common_patterns: [
        'Health metrics (heart rate, steps, calories) are standard tracking displays',
        'Before/after imagery is common but must not make medical claims',
        'Integration with Apple HealthKit is expected and requires proper usage descriptions',
        'Workout tracking, meal logging, and body metrics are standard features',
        'Sleep tracking and mindfulness content are normal health app features',
        'Apps distributed in the EEA, UK, or U.S. may need an App Store Connect regulated medical device status when they qualify as medical devices',
    ],
    specific_guidelines: [
        'Section 1.4.1 - Medical apps must clearly disclaim they are not a substitute for professional medical advice',
        'Section 5.1.3 - Health data is sensitive and requires explicit consent for collection',
        'Section 2.5.1 - HealthKit usage must be clearly tied to health/fitness functionality',
        'App Store Connect - Health & Fitness or Medical apps, or apps with frequent Medical or Treatment Information, may need regulated medical device status for EEA, UK, or U.S. distribution',
    ],
    false_positive_overrides: [
        'Calorie counts, step counts, and heart rate displays are NOT unverifiable health claims',
        'Workout completion metrics are NOT misleading performance guarantees',
        'General wellness advice ("drink more water", "sleep 8 hours") is NOT medical advice',
        'BMI or body composition displays are standard health metrics, NOT diagnostic claims',
        'Meditation or breathing exercise features are NOT making therapeutic claims',
    ],
};
