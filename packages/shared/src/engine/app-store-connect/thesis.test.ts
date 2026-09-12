import { describe, expect, it } from 'vitest';
import { checkAppStoreConnect } from './rules';
import type { AscSubmissionMetadata } from './client';
import type { BinaryEvidence } from './rules';

/**
 * The thesis check.
 *
 * Preflight exists so people do not get rejected over and over. The honest test
 * of that is not whether the code compiles, it is whether the finished tool
 * would have caught the defects that a real submission actually shipped with.
 *
 * On 2026-09-11 a real app went through final submission prep. Three separate
 * blockers were found by hand, and Preflight at the time caught none of them,
 * because all three lived in App Store Connect rather than on disk. These are
 * the real values from that submission, before and after the fixes.
 *
 * If this file ever goes green on the "before" state, the App Store Connect
 * work has regressed and the tool is back to being blind where it matters.
 */

/** Evidence read from the shipped binary: it links Sign in with Apple. */
const BINARY: BinaryEvidence = {
    signInWithApple: true,
    signInRequired: true,
    declaredDataTypes: [
        'NSPrivacyCollectedDataTypeEmailAddress',
        'NSPrivacyCollectedDataTypeName',
        'NSPrivacyCollectedDataTypeUserID',
        'NSPrivacyCollectedDataTypeOtherFinancialInfo',
        'NSPrivacyCollectedDataTypePhotosorVideos',
    ],
};

/** The submission as it stood before the problems were found. */
const BEFORE: AscSubmissionMetadata = {
    appId: '6790869268',
    bundleId: 'com.szakacsmedia.payday',
    appName: 'Payday: Tip & Pay Tracker',
    versionString: '1.0',
    appStoreState: 'PREPARE_FOR_SUBMISSION',
    // Blocker 1: unanswered, which silently blocks submission.
    usesIdfa: null,
    // Blocker 2: flatly false. The app hard-gates on Sign in with Apple.
    reviewNotes:
        'Payday requires no account and no sign-in, so no demo credentials are needed. ' +
        'Open the app and it goes straight to the Dashboard.',
    demoAccountRequired: false,
    privacyPolicyUrl: 'https://szakacsmedia.com/payday/privacy',
    description: 'Track your tips shift by shift.',
    hasBuildAttached: true,
};

/** The same submission after the fixes, which is what actually went to Apple. */
const AFTER: AscSubmissionMetadata = {
    ...BEFORE,
    appStoreState: 'WAITING_FOR_REVIEW',
    usesIdfa: false,
    reviewNotes:
        'SIGN-IN\nPayday requires Sign in with Apple, and there is no other sign-in method. ' +
        'No demo credentials are provided or needed: please tap "Continue with Apple" and use your own Apple ID.',
};

const criticals = (metadata: AscSubmissionMetadata) =>
    checkAppStoreConnect(metadata, BINARY)
        .filter((c) => c.severity === 'critical' && c.status === 'checked')
        .map((c) => c.title);

describe('would it have caught the real submission blockers?', () => {
    it('catches review notes that contradict the binary', () => {
        expect(criticals(BEFORE)).toContain('Review notes claim no sign-in, but the app requires one');
    });

    it('catches the unanswered Advertising Identifier question', () => {
        expect(criticals(BEFORE)).toContain('Advertising Identifier question is unanswered');
    });

    it('surfaces the privacy label for comparison, with the declared types spelled out', () => {
        // Apple exposes no API for the App Privacy answers, so this cannot be a
        // hard finding. What it can do is hand over the comparison already made,
        // which turns an invisible mismatch into a one-minute check. The real
        // label read "Data Not Collected" while the binary declared five types.
        const reminder = checkAppStoreConnect(BEFORE, BINARY)
            .find((c) => c.title.includes('App Privacy label'));

        expect(reminder).toBeDefined();
        expect(reminder!.description).toContain('5 collected data types');
        expect(reminder!.description).toContain('Email Address');
        expect(reminder!.description).toContain('Other Financial Info');
        expect(reminder!.fix_suggestion).toContain('6790869268');
    });

    it('catches at least the two machine-checkable blockers, and only those', () => {
        // Exactly two, because the third is not machine-checkable. Asserting the
        // count stops a future change from quietly adding noise here.
        expect(criticals(BEFORE)).toHaveLength(2);
    });
});

describe('and is quiet once they are fixed', () => {
    it('raises no criticals against the corrected submission', () => {
        expect(criticals(AFTER)).toEqual([]);
    });

    it('accepts no demo account when the notes explain Sign in with Apple', () => {
        const warnings = checkAppStoreConnect(AFTER, BINARY)
            .filter((c) => c.severity === 'warning' && c.status === 'checked')
            .map((c) => c.title);
        expect(warnings).toEqual([]);
    });

    it('still asks for the privacy label to be compared, since it cannot verify it', () => {
        const reminder = checkAppStoreConnect(AFTER, BINARY).find((c) => c.title.includes('App Privacy label'));
        expect(reminder?.status).toBe('not_checked');
    });
});
