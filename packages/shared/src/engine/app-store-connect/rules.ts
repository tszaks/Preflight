import type { CheckResult } from '../types';
import { getGuidelineRef } from '../knowledge-base/guidelines';
import type { AscSubmissionMetadata } from './client';

/**
 * Rules that compare App Store Connect metadata against the binary.
 *
 * This is the category of defect a local-only scanner is structurally blind to,
 * and in practice it is where first submissions die. On one real submission,
 * three separate blockers all lived here and none of them existed on disk:
 * review notes that contradicted the app, a privacy label that had gone stale,
 * and an unanswered IDFA question.
 *
 * The cross-checks are the valuable part. Either side alone looks fine; only
 * holding the submission next to the binary shows the contradiction.
 */

export interface BinaryEvidence {
    /** The app links Sign in with Apple / AuthenticationServices. */
    signInWithApple?: boolean;
    /** Any sign-in was detected or declared. */
    signInRequired?: boolean;
    /** Data types declared in the binary's PrivacyInfo.xcprivacy. */
    declaredDataTypes?: string[];
    /** The privacy manifest sets NSPrivacyTracking true. */
    declaresTracking?: boolean;
}

/** Phrases that claim no account is needed. Matched case-insensitively. */
const NO_SIGN_IN_CLAIMS = [
    'no account',
    'no sign-in',
    'no sign in',
    'no signin',
    'no login',
    'no log-in',
    'does not require an account',
    'doesn\'t require an account',
    'no registration',
    'without an account',
    'no credentials are needed',
    'no demo credentials are needed',
];

export function checkAppStoreConnect(
    metadata: AscSubmissionMetadata,
    evidence: BinaryEvidence = {}
): CheckResult[] {
    const results: CheckResult[] = [];

    results.push(...checkReviewNotes(metadata, evidence));
    results.push(...checkIdfa(metadata));
    results.push(...checkPrivacyPolicy(metadata));
    results.push(...checkPrivacyLabelReminder(evidence.declaredDataTypes ?? [], metadata.appId));
    results.push(...checkDemoAccount(metadata, evidence));
    results.push(...checkBuild(metadata));

    return results;
}

/**
 * Review notes that contradict the binary.
 *
 * App Review reads the notes first. Notes saying "no account is required" in
 * front of an app that opens on a mandatory sign-in wall do more damage than
 * empty notes: the reviewer hits the wall immediately, and it reads as an
 * attempt to mislead review rather than an oversight.
 *
 * Real case: notes opened with "Payday requires no account and no sign-in, so
 * no demo credentials are needed" while the app gated everything behind Sign in
 * with Apple. Nothing on disk could have revealed that.
 */
function checkReviewNotes(metadata: AscSubmissionMetadata, evidence: BinaryEvidence): CheckResult[] {
    const notes = metadata.reviewNotes;
    const signInDetected = Boolean(evidence.signInWithApple || evidence.signInRequired);

    if (notes === undefined) {
        return [{
            category: 'metadata',
            severity: 'info',
            title: 'App Review notes not checked',
            description: 'Review notes could not be read from App Store Connect.',
            confidence: 100,
            status: 'not_checked',
        }];
    }

    if (!notes || notes.trim().length === 0) {
        if (signInDetected) {
            return [{
                category: 'metadata',
                severity: 'warning',
                title: 'App requires sign-in but the review notes are empty',
                description: 'This app appears to require signing in, and App Review has no instructions for getting past it. Reviewers reject apps they cannot get into.',
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Explain in the review notes how to sign in. If the app uses Sign in with Apple, say that the reviewer can use their own Apple ID.',
                confidence: 90,
                status: 'checked',
            }];
        }
        return [];
    }

    const lowered = notes.toLowerCase();
    const claim = NO_SIGN_IN_CLAIMS.find((phrase) => lowered.includes(phrase));

    if (claim && signInDetected) {
        return [{
            category: 'metadata',
            severity: 'critical',
            title: 'Review notes claim no sign-in, but the app requires one',
            description: `The App Review notes say "${claim}", yet this build ${evidence.signInWithApple ? 'links Sign in with Apple' : 'appears to require signing in'}. The reviewer will hit a sign-in wall the notes told them did not exist, which reads as misleading review rather than an oversight.`,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Correct the review notes to state that sign-in is required and how to get past it. With Sign in with Apple, tell the reviewer to use their own Apple ID; do not supply a demo Apple ID, because its two-factor code goes to your device and locks the reviewer out.',
            confidence: 95,
            status: 'checked',
        }];
    }

    return [];
}

/**
 * The IDFA question.
 *
 * `null` means Apple is holding the question open, and the submission cannot be
 * sent until it is answered. It is invisible in the UI until you try to submit.
 */
function checkIdfa(metadata: AscSubmissionMetadata): CheckResult[] {
    if (metadata.usesIdfa === undefined) {
        return [{
            category: 'metadata',
            severity: 'info',
            title: 'Advertising Identifier question not checked',
            description: 'Could not read whether the IDFA question has been answered.',
            confidence: 100,
            status: 'not_checked',
        }];
    }

    if (metadata.usesIdfa === null) {
        return [{
            category: 'metadata',
            severity: 'critical',
            title: 'Advertising Identifier question is unanswered',
            description: 'App Store Connect has no answer recorded for whether this app uses the Advertising Identifier (IDFA). Submission is blocked until it is answered, and the field is easy to miss because nothing surfaces it until you try to submit.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion: 'Answer the IDFA question on the version page. If the app links no ad, attribution or analytics SDKs, the answer is no.',
            confidence: 100,
            status: 'checked',
        }];
    }

    return [];
}

function checkPrivacyPolicy(metadata: AscSubmissionMetadata): CheckResult[] {
    if (metadata.privacyPolicyUrl === undefined) {
        return [{
            category: 'urls',
            severity: 'info',
            title: 'Privacy policy URL in App Store Connect not checked',
            description: 'Could not read the privacy policy URL from App Store Connect.',
            confidence: 100,
            status: 'not_checked',
        }];
    }

    if (!metadata.privacyPolicyUrl) {
        return [{
            category: 'urls',
            severity: 'critical',
            title: 'No privacy policy URL set in App Store Connect',
            description: 'Every app must have a privacy policy URL, and this submission has none.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion: 'Add a privacy policy URL under App Information. It must also be reachable from inside the app.',
            confidence: 100,
            status: 'checked',
        }];
    }

    return [];
}

/**
 * The privacy nutrition label, which the API will not show us.
 *
 * Apple exposes no endpoint for App Privacy answers: `/v1/appDataUsages` does
 * not exist and apps carry no `dataUsages` relationship. Verified against the
 * live API. So this cannot be compared automatically, which is unfortunate
 * because a stale label is both common and invisible.
 *
 * The failure mode is specific: the label is answered once, early, when the app
 * genuinely collected nothing, and it is never revisited after the app gains
 * accounts and sync. It then contradicts the binary's own privacy manifest, and
 * nothing in App Store Connect warns you.
 *
 * Since it cannot be checked, Preflight does the next best thing and hands over
 * the comparison already made: here is exactly what your binary declares, here
 * is where to look. That turns an invisible mismatch into a one-minute check.
 */
export function checkPrivacyLabelReminder(declaredDataTypes: string[], appId?: string): CheckResult[] {
    const declared = declaredDataTypes;
    const readable = declared.map(friendlyDataType);

    const description = declared.length > 0
        ? `Apple exposes no API for the App Privacy answers, so this cannot be verified automatically. Your binary's privacy manifest declares ${declared.length} collected data type${declared.length === 1 ? '' : 's'}: ${readable.join(', ')}. The App Privacy label must list the same ones.`
        : 'Apple exposes no API for the App Privacy answers, so this cannot be verified automatically. Your binary\'s privacy manifest declares no collected data types, so the label should say Data Not Collected.';

    return [{
        category: 'privacy_manifest',
        severity: 'info',
        title: 'App Privacy label must be compared by hand',
        description,
        guideline_ref: getGuidelineRef('5.1.1'),
        fix_suggestion: appId
            ? `Open https://appstoreconnect.apple.com/apps/${appId}/distribution/privacy and confirm the declared types match. A label left at "Data Not Collected" after an app gains accounts or sync contradicts the binary and is a rejection.`
            : 'Open App Store Connect > your app > App Privacy and confirm the declared types match. A label left at "Data Not Collected" after an app gains accounts or sync contradicts the binary and is a rejection.',
        confidence: 100,
        status: 'not_checked',
    }];
}

/**
 * Demo account configuration.
 *
 * The Sign in with Apple case is a genuine trap. Apple's own guidance says to
 * supply demo credentials for single sign-on, but an Apple ID always requires
 * two-factor, and the code goes to the developer's devices. A reviewer given a
 * demo Apple ID gets stuck at the code prompt and concludes the login is broken.
 * For SIWA-only apps the correct configuration is no demo account plus notes
 * telling the reviewer to use their own Apple ID.
 */
function checkDemoAccount(metadata: AscSubmissionMetadata, evidence: BinaryEvidence): CheckResult[] {
    if (metadata.demoAccountRequired === undefined) return [];
    if (!evidence.signInRequired && !evidence.signInWithApple) return [];
    if (metadata.demoAccountRequired === true) return [];

    const notes = (metadata.reviewNotes ?? '').toLowerCase();
    const notesExplainSignIn =
        notes.includes('apple id') ||
        notes.includes('sign in with apple') ||
        notes.includes('continue with apple');

    if (evidence.signInWithApple && notesExplainSignIn) {
        // Correct configuration for a Sign in with Apple app. Nothing to report.
        return [];
    }

    if (evidence.signInWithApple) {
        return [{
            category: 'metadata',
            severity: 'warning',
            title: 'Sign in with Apple app has no demo account and no explanation',
            description: 'No demo account is provided and the review notes do not mention Sign in with Apple. A reviewer meeting an unexplained sign-in wall may reject under Guideline 2.1.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Leave the demo account off, which is right for Sign in with Apple since a demo Apple ID would send its two-factor code to your device, and state in the notes that the reviewer should tap Continue with Apple and use their own Apple ID.',
            confidence: 85,
            status: 'checked',
        }];
    }

    return [{
        category: 'metadata',
        severity: 'critical',
        title: 'App requires sign-in but no demo account is provided',
        description: 'This app requires signing in, and App Store Connect has no demo credentials. App Review cannot test an app it cannot get into, which is the most common rejection for login-gated apps.',
        guideline_ref: getGuidelineRef('2.1'),
        fix_suggestion: 'Tick Sign-In Required and supply a working account that does not expire and has no two-factor requirement the reviewer cannot satisfy.',
        confidence: 90,
        status: 'checked',
    }];
}

function checkBuild(metadata: AscSubmissionMetadata): CheckResult[] {
    if (metadata.hasBuildAttached === undefined) return [];
    if (metadata.hasBuildAttached) return [];

    return [{
        category: 'metadata',
        severity: 'warning',
        title: 'No build is attached to this version',
        description: `Version ${metadata.versionString ?? ''} has no build attached, so it cannot be submitted.`.replace('  ', ' '),
        guideline_ref: getGuidelineRef('2.1'),
        fix_suggestion: 'Upload a build and attach it to the version before submitting.',
        confidence: 100,
        status: 'checked',
    }];
}

/** Turn NSPrivacyCollectedDataTypeEmailAddress into "Email Address". */
function friendlyDataType(raw: string): string {
    return raw
        .replace(/^NSPrivacyCollectedDataType/, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim() || raw;
}
