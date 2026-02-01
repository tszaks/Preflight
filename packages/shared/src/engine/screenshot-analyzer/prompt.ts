/**
 * Claude Vision prompt builder for App Store screenshot analysis.
 *
 * Structured to produce JSON-only responses with confidence scores.
 * The prompt instructs the model to check for:
 * 1. Placeholder content (lorem ipsum, TODO, test data)
 * 2. Status bar issues (debug indicators, "Carrier" text)
 * 3. UI quality (broken layouts, overlapping elements, empty screens)
 * 4. Content appropriateness (age rating mismatches)
 * 5. Required UI elements (account deletion, Restore Purchases, SIWA, sub terms)
 * 6. Text readability (truncated text, wrong language)
 */

export interface ScreenshotAnalysisContext {
    app_name: string;
    category?: string | null;
    age_rating?: string | null;
    sign_in_required?: boolean;
    has_iap?: boolean;
    has_subscriptions?: boolean;
    has_third_party_login?: boolean;
}

export interface AIFinding {
    screenshot_index: number;
    issue_type:
        | 'placeholder_content'
        | 'status_bar'
        | 'ui_quality'
        | 'content_rating'
        | 'missing_required_element'
        | 'text_readability';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    confidence: number;
    guideline_ref?: string;
}

export interface AIEvidence {
    account_deletion_seen: boolean;
    restore_purchases_seen: boolean;
    subscription_terms_seen: boolean;
    sign_in_with_apple_seen: boolean;
    evidence_locations: Record<string, number[]>;
}

export interface AIResponse {
    findings: AIFinding[];
    evidence: AIEvidence;
}

export function buildSystemPrompt(context: ScreenshotAnalysisContext): string {
    const conditionals: string[] = [];

    if (context.age_rating) {
        conditionals.push(`Age Rating: ${context.age_rating}`);
    }
    if (context.has_iap) {
        conditionals.push('App has in-app purchases');
    }
    if (context.sign_in_required) {
        conditionals.push('App requires sign-in');
    }
    if (context.has_subscriptions) {
        conditionals.push('App has subscriptions');
    }
    if (context.has_third_party_login) {
        conditionals.push('App has third-party login (Google, Facebook, etc.)');
    }

    const contextBlock = conditionals.length > 0
        ? `\nApp context:\n${conditionals.map((c) => `- ${c}`).join('\n')}\n`
        : '';

    return `You are an Apple App Store screenshot reviewer. You analyze iOS app screenshots for compliance issues that would cause App Store rejection.

You are reviewing screenshots for the app "${context.app_name}".${contextBlock}
For each screenshot, analyze:

1. PLACEHOLDER CONTENT: Look for "Lorem ipsum", "John Doe", "test@test.com", "$0.00" placeholders, "TODO", debug text, or obviously fake data.

2. STATUS BAR ISSUES: Visible debug indicators, "Carrier" text instead of carrier name, unusual time displays.

3. UI QUALITY: Broken layouts, overlapping elements, clipped text, empty screens with no content, loading spinners captured as screenshots.

4. CONTENT APPROPRIATENESS: Content that doesn't match the declared age rating. Violence, sexual content, gambling, alcohol, or drugs in a 4+ rated app.

5. REQUIRED UI ELEMENTS (report if NOT visible across ALL screenshots):
   - Account deletion option (if app has sign-in)
   - "Restore Purchases" button (if app has IAP)
   - Sign in with Apple button (if app has third-party login)
   - Subscription terms with price/duration (if app has subscriptions)

6. TEXT READABILITY: Text too small to read, truncated strings showing "...", text in wrong language vs app's primary market.

Return ONLY valid JSON matching this schema:
{
  "findings": [
    {
      "screenshot_index": 0,
      "issue_type": "placeholder_content | status_bar | ui_quality | content_rating | missing_required_element | text_readability",
      "severity": "critical | warning | info",
      "title": "Short title of the issue",
      "description": "Detailed description of what was found and why it matters",
      "confidence": 50-85,
      "guideline_ref": "Optional Apple guideline reference (e.g., '2.3.7')"
    }
  ],
  "evidence": {
    "account_deletion_seen": false,
    "restore_purchases_seen": false,
    "subscription_terms_seen": false,
    "sign_in_with_apple_seen": false,
    "evidence_locations": {
      "account_deletion": [],
      "restore_purchases": [],
      "subscription_terms": [],
      "sign_in_with_apple": []
    }
  }
}

IMPORTANT RULES:
- Be conservative. Only flag clear, visible issues.
- Confidence should be 50-75 for most findings. Only go to 80-85 for glaringly obvious issues (e.g., "Lorem ipsum" text clearly visible).
- Do NOT flag stylistic preferences (dark mode, color choices, font sizes within normal range).
- Do NOT flag marketing overlay text on screenshots (Apple allows promotional text around the device frame).
- If a screenshot appears to be a marketing composite (device mockup with text), analyze the screen content inside the device frame only.
- For required elements, only flag as "missing" if you are CONFIDENT the app context requires them AND you have reviewed enough screenshots. If unsure, use severity "info" not "critical".
- Return ONLY the JSON object. No markdown fences, no explanation text.`;
}

export function buildUserMessage(
    batchSize: number,
    startIndex: number,
    endIndex: number,
    totalScreenshots: number,
): string {
    return `Analyze these ${batchSize} App Store screenshots (indices ${startIndex}-${endIndex} of ${totalScreenshots} total). Return JSON only.`;
}
