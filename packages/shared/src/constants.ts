/**
 * Credit costs per review type
 */
export const CREDIT_COSTS = {
    full: 0,
    recheck: 0,
} as const

/**
 * Legacy credit amounts. Open-source/self-hosted Preflight is free by default.
 */
export const CREDIT_AMOUNTS: Record<string, number> = {
}
