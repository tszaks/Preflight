/**
 * System and task prompts for Claude API soft-rule checks.
 * Each check gets a focused prompt that returns structured JSON.
 */

export const SYSTEM_PROMPT = `You are an expert App Store reviewer with deep knowledge of Apple's App Store Review Guidelines. You analyze app submissions and identify potential rejection risks.

Your analysis must be:
- Specific: Reference exact guideline sections
- Actionable: Provide clear fix suggestions
- Calibrated: Only flag issues that genuinely risk rejection
- Structured: Return valid JSON matching the required schema

Severity levels:
- "critical": Will definitely cause rejection
- "warning": Likely to cause rejection or significant delay
- "info": Suggestion for improvement (won't cause rejection)
- "pass": This aspect is fine

IMPORTANT: Do not hallucinate guidelines. Only reference real Apple guidelines. If unsure, use "info" severity.`;

export const DESCRIPTION_ANALYSIS_PROMPT = `Analyze this App Store description for potential rejection risks.

App Name: {{app_name}}
Category: {{category}}
Description:
"""
{{description}}
"""

Check for:
1. Misleading claims about functionality not in the app
2. Competitor app name mentions (trademark issues)
3. Keyword spam / unnatural keyword repetition
4. Claims that violate Apple guidelines (e.g., "the best", "#1" without evidence)
5. References to other platforms (Android, Google Play)
6. Inappropriate content for the stated age rating
7. Medical/health claims without disclaimers
8. Mentions of pricing in description body

Return JSON array of issues found:
[
  {
    "severity": "critical" | "warning" | "info",
    "title": "short title",
    "description": "detailed explanation",
    "guideline_ref": "Section X.X - Title",
    "fix_suggestion": "what to do"
  }
]

If no issues found, return: [{"severity": "pass", "title": "Description analysis passed", "description": "No policy violations or rejection risks detected."}]`;

export const SCREENSHOT_ANALYSIS_PROMPT = `Analyze this App Store screenshot for potential rejection risks.

App Name: {{app_name}}
Category: {{category}}
Screenshot {{index}} of {{total}}:

Check for:
1. Fake UI elements that don't exist in a real iOS app
2. System UI mockups (fake notifications, fake status bars with misleading info)
3. Offensive or inappropriate content
4. Text that makes misleading claims
5. Content that doesn't match the app's stated category
6. Wrong device frame (e.g., Android phone frame)
7. Watermarks, stock photo marks, or copyright violations
8. Extremely low quality or unreadable content

Return JSON array of issues found:
[
  {
    "severity": "critical" | "warning" | "info",
    "title": "short title",
    "description": "detailed explanation",
    "guideline_ref": "Section X.X - Title",
    "fix_suggestion": "what to do"
  }
]

If no issues found, return: [{"severity": "pass", "title": "Screenshot {{index}} analysis passed", "description": "No visual policy violations detected."}]`;

export const PRIVACY_POLICY_REVIEW_PROMPT = `Cross-check this privacy policy against the app's privacy manifest declarations.

App Name: {{app_name}}

Privacy Policy Text:
"""
{{privacy_policy_text}}
"""

Privacy Manifest Declarations:
{{manifest_summary}}

Check for:
1. Data types collected in the manifest but not mentioned in the policy
2. Third-party sharing declared in manifest but not disclosed in policy
3. Tracking declared but not explained in policy
4. Missing required sections (data collection, data sharing, data retention, user rights)
5. Policy that seems auto-generated or too generic for the app
6. Missing contact information for privacy inquiries

Return JSON array of issues found:
[
  {
    "severity": "critical" | "warning" | "info",
    "title": "short title",
    "description": "detailed explanation",
    "guideline_ref": "Section X.X - Title",
    "fix_suggestion": "what to do"
  }
]

If no issues found, return: [{"severity": "pass", "title": "Privacy policy review passed", "description": "Policy adequately covers manifest declarations."}]`;

export const CONTENT_POLICY_PROMPT = `Analyze this app's metadata for content policy compliance.

App Name: {{app_name}}
Category: {{category}}
Age Rating: {{age_rating}}
Description:
"""
{{description}}
"""

Check for:
1. Age rating appropriateness - does the description suggest content beyond the stated rating?
2. User-generated content implications - does the app need moderation features?
3. Gambling or contest elements that need disclosure
4. Health/medical claims that need disclaimers
5. Financial advice that needs regulatory compliance
6. Content that could be considered objectionable under Section 1.1

Return JSON array of issues found:
[
  {
    "severity": "critical" | "warning" | "info",
    "title": "short title",
    "description": "detailed explanation",
    "guideline_ref": "Section X.X - Title",
    "fix_suggestion": "what to do"
  }
]

If no issues found, return: [{"severity": "pass", "title": "Content policy check passed", "description": "No content policy violations detected for the stated age rating."}]`;

export const METADATA_QUALITY_PROMPT = `Provide ASO (App Store Optimization) suggestions for this app's metadata. These are improvement suggestions, not rejection risks.

App Name: {{app_name}}
Subtitle: {{subtitle}}
Category: {{category}}
Keywords: {{keywords}}
Description (first 500 chars):
"""
{{description_preview}}
"""

Suggest improvements for:
1. Keyword optimization - are there obvious keywords missing?
2. Description structure - is it scannable with clear value propositions?
3. Name/subtitle impact - could they be more compelling?
4. Keyword field efficiency - any wasted characters?

Return JSON array of suggestions (all should be "info" severity):
[
  {
    "severity": "info",
    "title": "short title",
    "description": "detailed suggestion",
    "fix_suggestion": "specific recommendation"
  }
]

Limit to 3-5 most impactful suggestions.`;

/**
 * Replace template variables in a prompt string
 */
export function fillPrompt(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(`{{${key}}}`, value || 'Not provided');
    }
    return result;
}
