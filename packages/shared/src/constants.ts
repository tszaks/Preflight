/**
 * Credit costs per review type
 */
export const CREDIT_COSTS = {
    full: 100,
    recheck: 25,
} as const

/**
 * Credit amounts per pricing plan
 */
export const CREDIT_AMOUNTS: Record<string, number> = {
    starter: 200,
    pro: 600,
    agency: 2000,
}
