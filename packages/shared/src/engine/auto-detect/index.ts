/**
 * Auto-Detection Engine
 *
 * Analyzes all available data sources (ASC, IPA binary, Info.plist) to pre-fill
 * compliance fields before asking the user. The cascade order reflects confidence:
 *   1. ASC data (95) - Apple's own source of truth
 *   2. IPA binary (70-95) - framework/entitlement/symbol analysis
 *   3. Info.plist (85-95) - declared capabilities and usage descriptions
 *   4. Ask user (last resort) - only for what can't be detected
 *
 * When multiple sources detect the same field, the highest-confidence one wins.
 */

import type { HardRulesInput } from '../types';
import { detectFromAsc, type AscDetectionInput } from './detect-from-asc';
import { detectFromBinary, type BinaryDetectionInput } from './detect-from-binary';
import { detectFromPlist } from './detect-from-plist';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AutoDetectInput {
    asc?: AscDetectionInput;
    ipa?: BinaryDetectionInput;
    plistContent?: string | Buffer;
}

export type DetectionSourceType = 'asc' | 'ipa_framework' | 'ipa_entitlement' | 'ipa_symbol' | 'plist';

export interface DetectionSource {
    /** Which HardRulesInput field this detection maps to */
    field: string;
    /** The detected value */
    value: boolean | string;
    /** Where this detection came from */
    source: DetectionSourceType;
    /** How confident we are (0-100) */
    confidence: number;
    /** Human-readable explanation of what was found */
    evidence: string;
}

export interface AutoDetectResult {
    /** Pre-filled values ready to merge into HardRulesInput */
    fields: Partial<HardRulesInput>;
    /** All individual detections (for display to user) */
    detections: DetectionSource[];
    /** Fields that could not be detected and must be asked */
    unresolved: string[];
}

// ─── Field → Question mapping ─────────────────────────────────────────────

/** Fields that we attempt to auto-detect, and conditions for when we need to ask follow-ups */
interface FollowUpRule {
    /** The field that triggers this follow-up */
    trigger: string;
    /** The trigger value that activates asking (true = when detected/confirmed) */
    triggerValue: boolean;
    /** The follow-up field to ask about */
    askField: string;
}

const FOLLOW_UP_RULES: FollowUpRule[] = [
    { trigger: 'sign_in_required', triggerValue: true, askField: 'has_account_deletion' },
    { trigger: 'has_iap', triggerValue: true, askField: 'has_restore_purchases' },
    { trigger: 'has_subscriptions', triggerValue: true, askField: 'has_restore_purchases' },
    { trigger: 'has_subscriptions', triggerValue: true, askField: 'subscription_terms_on_paywall' },
    { trigger: 'detected_healthkit', triggerValue: true, askField: 'has_health_disclaimers' },
];

// ─── Main orchestrator ────────────────────────────────────────────────────

/**
 * Run auto-detection across all available data sources.
 * Returns pre-filled fields, individual detections for display, and unresolved fields to ask.
 */
export function autoDetect(input: AutoDetectInput): AutoDetectResult {
    const allDetections: DetectionSource[] = [];

    // Stage 1: ASC (highest confidence)
    if (input.asc) {
        allDetections.push(...detectFromAsc(input.asc));
    }

    // Stage 2: IPA binary
    if (input.ipa) {
        allDetections.push(...detectFromBinary(input.ipa));
    }

    // Stage 3: Info.plist
    if (input.plistContent) {
        allDetections.push(...detectFromPlist(input.plistContent));
    }

    // Resolve conflicts: for each field, keep the highest-confidence detection
    const bestByField = new Map<string, DetectionSource>();
    for (const detection of allDetections) {
        const existing = bestByField.get(detection.field);
        if (!existing || detection.confidence > existing.confidence) {
            bestByField.set(detection.field, detection);
        }
    }

    // Build pre-filled HardRulesInput fields from resolved detections
    const fields: Partial<HardRulesInput> = {};
    for (const [field, detection] of bestByField) {
        mapDetectionToField(fields, field, detection.value);
    }

    // Determine which fields still need user input
    const unresolved = computeUnresolved(bestByField);

    // Filter detections to only include the winners (for cleaner display)
    const winningDetections = Array.from(bestByField.values());

    return {
        fields,
        detections: winningDetections,
        unresolved,
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Map a detection to the appropriate HardRulesInput field.
 */
function mapDetectionToField(
    fields: Partial<HardRulesInput>,
    fieldName: string,
    value: boolean | string,
): void {
    switch (fieldName) {
        case 'sign_in_required':
            fields.sign_in_required = value as boolean;
            break;
        case 'has_subscriptions':
            fields.has_subscriptions = value as boolean;
            break;
        case 'has_iap':
            fields.has_iap = value as boolean;
            break;
        case 'has_third_party_login':
            fields.has_third_party_login = value as boolean;
            break;
        case 'detected_third_party_login':
            fields.detected_third_party_login = value as boolean;
            break;
        case 'category':
            fields.category = value as string;
            break;
        case 'detected_healthkit':
            fields.detected_healthkit = value as boolean;
            break;
        case 'detected_background_location':
            fields.detected_background_location = value as boolean;
            break;
        case 'detected_sign_in_with_apple':
            fields.detected_sign_in_with_apple = value as boolean;
            break;
        case 'detected_push_notifications':
            fields.detected_push_notifications = value as boolean;
            break;
        case 'detected_vpn':
            fields.detected_vpn = value as boolean;
            break;
        case 'detected_apple_pay':
            fields.detected_apple_pay = value as boolean;
            break;
        // Informational fields (not mapped to HardRulesInput directly)
        case 'usage_descriptions':
        case 'encryption_non_exempt':
        case 'has_url_schemes':
            break;
    }
}

/**
 * Determine which fields still need to be asked based on what was detected
 * and which follow-up questions are triggered.
 */
function computeUnresolved(resolved: Map<string, DetectionSource>): string[] {
    const unresolved: string[] = [];

    // Core fields that need to be known
    const coreFields = ['sign_in_required', 'has_subscriptions', 'has_iap'];
    for (const field of coreFields) {
        if (!resolved.has(field)) {
            unresolved.push(field);
        }
    }

    // Check follow-up rules: if a trigger was detected, its follow-up field needs asking
    for (const rule of FOLLOW_UP_RULES) {
        const triggerDetection = resolved.get(rule.trigger);
        if (triggerDetection && triggerDetection.value === rule.triggerValue) {
            // The trigger condition is met — we need to ask the follow-up
            if (!resolved.has(rule.askField) && !unresolved.includes(rule.askField)) {
                unresolved.push(rule.askField);
            }
        }
    }

    // Special case: third-party login detected but no SIWA framework found
    // This is a high-confidence warning, no need to ask — just flag it
    const hasThirdParty = resolved.get('has_third_party_login');
    const hasSIWA = resolved.get('detected_sign_in_with_apple');
    if (hasThirdParty?.value === true && !hasSIWA) {
        // Don't add to unresolved — this will be a direct warning in conditional-warnings
    }

    return unresolved;
}

// Re-export sub-module types
export type { AscDetectionInput } from './detect-from-asc';
export type { BinaryDetectionInput } from './detect-from-binary';
