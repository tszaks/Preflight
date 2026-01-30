/**
 * ASC Review History Analyzer
 *
 * For users with an App Store Connect connection, this module pulls
 * their actual review submission and version history, then analyzes
 * patterns that predict future review outcomes.
 *
 * Graceful degradation: returns empty if no ASC connection exists
 * or if any API call fails. Never blocks the analysis pipeline.
 *
 * Confidence range: 45-65
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import type { CheckResult } from '../types';
import { decryptPrivateKey } from '$lib/utils/asc-credential-store';
import {
    getReviewSubmissions,
    getAppStoreVersions,
    type ASCCredentials,
    type ASCReviewSubmission,
    type ASCAppStoreVersion,
} from '$lib/utils/app-store-connect';

// ASC version states that indicate rejection
const REJECTED_STATES = ['REJECTED', 'DEVELOPER_REJECTED'];
const APPROVED_STATES = ['READY_FOR_SALE', 'PENDING_DEVELOPER_RELEASE', 'READY_FOR_DISTRIBUTION'];

// Review submission states that indicate a completed rejection
const SUBMISSION_REJECTED_STATES = ['REJECTED', 'COMPLETE'];

/**
 * Analyze the user's ASC review history for submission risk patterns.
 * Returns empty array if no ASC connection or on any failure.
 */
export async function analyzeASCHistory(
    supabase: SupabaseClient<Database>,
    userId: string,
    ascEncryptionKey: string,
): Promise<CheckResult[]> {
    try {
        // 1. Look up ASC connection
        const { data: conn } = await supabase
            .from('asc_connections')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!conn) return []; // No ASC connection — graceful no-op

        // 2. Decrypt credentials
        const privateKey = decryptPrivateKey(
            conn.encrypted_private_key,
            conn.encryption_iv,
            ascEncryptionKey,
        );

        const credentials: ASCCredentials = {
            keyId: conn.key_id,
            issuerId: conn.issuer_id,
            privateKey,
        };

        const appId = conn.selected_app_id;
        if (!appId) return []; // No app selected — nothing to analyze

        // 3. Fetch review data in parallel
        const [submissions, versions] = await Promise.all([
            getReviewSubmissions(credentials, appId),
            getAppStoreVersions(credentials, appId),
        ]);

        // 4. Analyze patterns
        return analyzePatterns(submissions, versions);
    } catch (err) {
        // Graceful degradation — log but don't block the pipeline
        console.warn('[BehavioralHeuristics] ASC history analysis failed (continuing):', err instanceof Error ? err.message : err);
        return [];
    }
}

/**
 * Analyze submission + version data for review risk patterns.
 */
function analyzePatterns(
    submissions: ASCReviewSubmission[],
    versions: ASCAppStoreVersion[],
): CheckResult[] {
    const results: CheckResult[] = [];

    if (submissions.length === 0 && versions.length === 0) {
        // First submission ever — give helpful context
        results.push({
            category: 'content_policy',
            severity: 'info',
            title: 'First-time submission detected',
            description: 'This appears to be a first submission for this app. First submissions typically undergo more thorough review. Expect 24-48 hour review time and ensure all required metadata, screenshots, and privacy documentation are complete.',
            confidence: 50,
        });
        return results;
    }

    // Analyze version state history
    const rejectedVersions = versions.filter((v) => REJECTED_STATES.includes(v.appStoreState));
    const approvedVersions = versions.filter((v) => APPROVED_STATES.includes(v.appStoreState));
    const totalVersions = versions.length;

    // Rejection rate analysis
    if (totalVersions > 0 && rejectedVersions.length > 0) {
        const rejectionRate = rejectedVersions.length / totalVersions;

        if (rejectionRate > 0.5) {
            results.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'High historical rejection rate detected',
                description: `${rejectedVersions.length} of ${totalVersions} version submissions were rejected (${Math.round(rejectionRate * 100)}%). This suggests recurring compliance issues. Review previous rejection reasons carefully before submitting.`,
                fix_suggestion: 'Check your App Store Connect resolution center for specific rejection reasons. Address each one before resubmitting.',
                confidence: 60,
            });
        } else if (rejectionRate > 0.25) {
            results.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Moderate historical rejection rate',
                description: `${rejectedVersions.length} of ${totalVersions} version submissions were rejected (${Math.round(rejectionRate * 100)}%). Review previous rejection reasons to avoid repeating issues.`,
                confidence: 50,
            });
        }
    }

    // Consecutive rejection detection
    const consecutiveRejections = countConsecutiveRejections(versions);
    if (consecutiveRejections >= 3) {
        results.push({
            category: 'content_policy',
            severity: 'warning',
            title: `${consecutiveRejections} consecutive rejections detected`,
            description: `The last ${consecutiveRejections} version submissions were rejected. This pattern may trigger extended review times or additional scrutiny. Consider reaching out to Apple Developer Support before resubmitting.`,
            fix_suggestion: 'Use the App Store Connect Resolution Center to communicate with Apple reviewers. Consider requesting an expedited review if the rejections are due to misunderstandings.',
            confidence: 65,
        });
    } else if (consecutiveRejections === 2) {
        results.push({
            category: 'content_policy',
            severity: 'info',
            title: '2 consecutive rejections detected',
            description: 'The last 2 version submissions were rejected. Carefully address all previous feedback before resubmitting to avoid a pattern of repeated rejections.',
            confidence: 55,
        });
    }

    // Most recent version state
    if (versions.length > 0) {
        const latest = versions[0]; // sorted newest first
        if (REJECTED_STATES.includes(latest.appStoreState)) {
            results.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'Most recent submission was rejected',
                description: `Version ${latest.versionString} (${latest.appStoreState.replace(/_/g, ' ').toLowerCase()}) is the most recent submission. Ensure all rejection feedback has been addressed in this new submission.`,
                fix_suggestion: 'Review the rejection details in App Store Connect Resolution Center and verify each issue is resolved before resubmitting.',
                confidence: 60,
            });
        }
    }

    // Clean history — positive signal
    if (rejectedVersions.length === 0 && approvedVersions.length >= 2) {
        results.push({
            category: 'content_policy',
            severity: 'pass',
            title: 'Clean review history',
            description: `This app has ${approvedVersions.length} approved versions with no rejections. This is a positive signal for faster review processing.`,
            confidence: 55,
        });
    }

    return results;
}

/**
 * Count how many of the most recent versions were consecutively rejected.
 * Versions are expected to be sorted newest-first.
 */
function countConsecutiveRejections(versions: ASCAppStoreVersion[]): number {
    let count = 0;
    for (const v of versions) {
        if (REJECTED_STATES.includes(v.appStoreState)) {
            count++;
        } else {
            break; // First non-rejected version breaks the streak
        }
    }
    return count;
}
