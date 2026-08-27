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
