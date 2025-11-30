/**
 * Custom hooks para análisis de mercado usando React Query
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const analysisKeys = {
    all: ['analysis'] as const,
    priceRanges: () => [...analysisKeys.all, 'price-ranges'] as const,
    vendors: () => [...analysisKeys.all, 'vendors'] as const,
    brands: () => [...analysisKeys.all, 'brands'] as const,
    overview: () => [...analysisKeys.all, 'overview'] as const,
    categoryInsights: (category: string) =>
        [...analysisKeys.all, 'category-insights', category] as const,
};

// ============================================================================
// HOOKS DE ANÁLISIS
// ============================================================================

/**
 * Hook para obtener rangos de precio por categoría
 */
export function usePriceRanges() {
    return useQuery({
        queryKey: analysisKeys.priceRanges(),
        queryFn: () => api.analysis.getPriceRanges(),
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
}

/**
 * Hook para obtener estadísticas de vendedores
 */
export function useVendorStats() {
    return useQuery({
        queryKey: analysisKeys.vendors(),
        queryFn: () => api.analysis.getVendorStats(),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook para obtener estadísticas de marcas
 */
export function useBrandStats() {
    return useQuery({
        queryKey: analysisKeys.brands(),
        queryFn: () => api.analysis.getBrandStats(),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook para obtener resumen del mercado
 */
export function useMarketOverview() {
    return useQuery({
        queryKey: analysisKeys.overview(),
        queryFn: () => api.analysis.getOverview(),
        staleTime: 15 * 60 * 1000, // 15 minutos
    });
}

/**
 * Hook para obtener insights de una categoría
 */
export function useCategoryInsights(category: string | undefined) {
    return useQuery({
        queryKey: analysisKeys.categoryInsights(category || ''),
        queryFn: () => api.analysis.getCategoryInsights(category!),
        enabled: !!category,
        staleTime: 10 * 60 * 1000,
    });
}
