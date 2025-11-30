/**
 * Custom hooks para comparaciones usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductComparisonRequest, ComparisonBySpecsRequest } from '@/types/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const comparisonKeys = {
    all: ['comparisons'] as const,
    compare: (productIds: string[]) => [...comparisonKeys.all, 'compare', productIds.sort()] as const,
    bestValue: (category: string) => [...comparisonKeys.all, 'best-value', category] as const,
    bySpecs: (productIds: string[], specs: string[]) =>
        [...comparisonKeys.all, 'by-specs', productIds.sort(), specs.sort()] as const,
};

// ============================================================================
// HOOKS DE COMPARACIONES
// ============================================================================

/**
 * Hook para comparar productos (mutation porque es POST)
 */
export function useCompareProducts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: ProductComparisonRequest) =>
            api.comparisons.compareProducts(request),
        onSuccess: (data, variables) => {
            // Cachear el resultado
            queryClient.setQueryData(
                comparisonKeys.compare(variables.product_ids),
                data
            );
        },
    });
}

/**
 * Hook para obtener el mejor valor en una categoría
 */
export function useBestValue(category: string | undefined) {
    return useQuery({
        queryKey: comparisonKeys.bestValue(category || ''),
        queryFn: () => api.comparisons.getBestValue(category!),
        enabled: !!category,
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
}

/**
 * Hook para comparar por especificaciones
 */
export function useCompareBySpecs() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: ComparisonBySpecsRequest) =>
            api.comparisons.compareBySpecs(request),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(
                comparisonKeys.bySpecs(variables.product_ids, variables.specs),
                data
            );
        },
    });
}
