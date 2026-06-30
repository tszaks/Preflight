import type { CheckResult, HardRulesInput, ScreenshotData } from '../types';
import { SCREENSHOT_LIMITS } from '../knowledge-base/requirements';
import { VALID_SCREENSHOT_DIMENSIONS as DIMENSIONS } from '../types';
import { getGuidelineRef } from '../knowledge-base/guidelines';

export function checkScreenshots(input: HardRulesInput, screenshotData?: ScreenshotData[]): CheckResult[] {
    const results: CheckResult[] = [];
    const paths = input.screenshot_paths;

    // Count check
    if (paths.length === 0) {
        results.push({
            category: 'screenshots',
            // Missing screenshots blocks *submission*, but in Preflight this often means
            // "not provided for analysis" (e.g. CLI --skip-screenshots). Keep it visible
            // without counting it as a rejection-risk critical.
            severity: 'info',
            title: 'No screenshots provided',
            description: 'At least 1 screenshot is required for App Store submission.',
            confidence: 100,
            guideline_ref: getGuidelineRef('2.3.7'),
            fix_suggestion: 'Upload between 1 and 10 screenshots showing your app\'s key features.',
        });
        return results;
    }

    if (paths.length > SCREENSHOT_LIMITS.max_count) {
        results.push({
            category: 'screenshots',
            severity: 'critical',
            title: 'Too many screenshots',
            description: `${paths.length} screenshots uploaded. Maximum is ${SCREENSHOT_LIMITS.max_count}.`,
            confidence: 100,
            guideline_ref: getGuidelineRef('2.3.7'),
            fix_suggestion: `Remove ${paths.length - SCREENSHOT_LIMITS.max_count} screenshots. Keep the most impactful ones.`,
        });
    }

    // If we have actual screenshot data, validate dimensions and size
    if (screenshotData && screenshotData.length > 0) {
        for (let i = 0; i < screenshotData.length; i++) {
            const screenshot = screenshotData[i];

            // Size check
            if (screenshot.size_bytes > SCREENSHOT_LIMITS.max_size_bytes) {
                const sizeMB = (screenshot.size_bytes / 1024 / 1024).toFixed(1);
                results.push({
                    category: 'screenshots',
                    severity: 'critical',
                    title: `Screenshot ${i + 1} exceeds size limit`,
                    description: `Screenshot is ${sizeMB}MB. Maximum is 5MB.`,
                    confidence: 100,
                    guideline_ref: getGuidelineRef('2.3.7'),
                    fix_suggestion: 'Compress the image or reduce its resolution to stay under 5MB.',
                });
            }

            // Format check
            if (!SCREENSHOT_LIMITS.allowed_formats.includes(screenshot.mime_type as any)) {
                results.push({
                    category: 'screenshots',
                    severity: 'critical',
                    title: `Screenshot ${i + 1} invalid format`,
                    description: `Format "${screenshot.mime_type}" is not accepted. Use JPEG or PNG.`,
                    confidence: 100,
                    guideline_ref: getGuidelineRef('2.3.7'),
                    fix_suggestion: 'Convert the image to JPEG or PNG format.',
                });
            }

            // Dimensions check (if available)
            if (screenshot.width && screenshot.height) {
                const validDim = DIMENSIONS.find(
                    d => d.width === screenshot.width && d.height === screenshot.height
                );

                if (!validDim) {
                    results.push({
                        category: 'screenshots',
                        severity: 'critical',
                        title: `Screenshot ${i + 1} invalid dimensions`,
                        description: `Dimensions ${screenshot.width}x${screenshot.height} don't match any required App Store size.`,
                        confidence: 100,
                        guideline_ref: getGuidelineRef('2.3.7'),
                        fix_suggestion: `Use an App Store Connect accepted size such as 1320x2868, 1290x2796, or 1260x2736 (6.9"), 1284x2778 or 1242x2688 (6.5"), 1206x2622, 1179x2556, 1170x2532, 1125x2436, or 1080x2340 (6.3"/6.1"), 2064x2752 or 2048x2732 (13" iPad), or 1488x2266 / 1668x2420 / 1668x2388 / 1640x2360 (11" iPad).`,
                    });
                }
            }
        }
    }

    // If screenshots were provided and no issues found
    if (results.length === 0) {
        results.push({
            category: 'screenshots',
            severity: 'pass',
            title: 'Screenshot checks passed',
            description: `${paths.length} screenshot(s) provided with valid formats and dimensions.`,
            confidence: 100,
        });
    }

    return results;
}
