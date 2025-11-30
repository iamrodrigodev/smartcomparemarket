/**
 * Custom hooks para recomendaciones usando React Query
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const recommendationKeys = {
    all: ['recommendations'] as const,
    user: (userId: string) => [...recommendationKeys.all, 'user', userId] as const,
    budget: (userId: string) => [...recommendationKeys.all, 'budget', userId] as const,
    personalized: (userId: string, params: any) =>
        [...recommendationKeys.all, 'personalized', userId, params] as const,
};

// ============================================================================
// HOOKS DE RECOMENDACIONES
// ============================================================================

/**
 * Hook para obtener recomendaciones de un usuario
 */
export function useRecommendations(userId: string | undefined, limit = 10) {
    return useQuery({
        queryKey: recommendationKeys.user(userId || ''),
        queryFn: () => api.recommendations.getRecommendations(userId!, limit),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
}

/**
 * Hook para obtener productos dentro del presupuesto
 */
export function useInBudgetRecommendations(userId: string | undefined, limit = 10) {
    return useQuery({
        queryKey: recommendationKeys.budget(userId || ''),
        queryFn: () => api.recommendations.getInBudget(userId!, limit),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook para recomendaciones personalizadas
 */
export function usePersonalizedRecommendations(
    userId: string | undefined,
    params: { categoria?: string; max_precio?: number; limit?: number } = {}
) {
    return useQuery({
        queryKey: recommendationKeys.personalized(userId || '', params),
        queryFn: () => api.recommendations.getPersonalized(userId!, params),
        enabled: !!userId,
        staleTime: 3 * 60 * 1000,
    });
}
