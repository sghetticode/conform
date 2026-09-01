// Big Five factors of personality
export const factors = [
    'extraversion',
    'agreeableness',
    'conscientiousness',
    'emotional-stability',
    'intellect-imagination',
] as const
  
export type Factor = (typeof factors)[number]

// Map factor keys to display names
export const factorNames: Record<Factor, string> = {
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    conscientiousness: 'Conscientiousness',
    'emotional-stability': 'Emotional Stability',
    'intellect-imagination': 'Intellect/Imagination',
}

export interface FactorResult {
    total: number
    percentage: number
}

export type FactorResults = Record<Factor, FactorResult>

// Interpretive levels for factor percentages
export type Level = 'Sparse' | 'Low' | 'Moderate' | 'High' | 'Dense'

// Map percentages (0-100) to interpretive levels based on raw input
export function levelFor(percentage: number): Level {
    if (percentage < 20) return 'Sparse'
    if (percentage < 40) return 'Low'
    if (percentage < 60) return 'Moderate'
    if (percentage < 80) return 'High'
    return 'Dense'
}
