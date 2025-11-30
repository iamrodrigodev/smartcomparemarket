/**
 * Custom hooks para productos usando React Query
 * Implementa caché, refetch automático y manejo de estados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductSearchParams } from '@/types/api';

// ============================================================================
// QUERY KEYS (para caché y invalidación)
// ============================================================================

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (params: ProductSearchParams) => [...productKeys.lists(), params] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
    similar: (id: string) => [...productKeys.all, 'similar', id] as const,
    compatible: (id: string) => [...productKeys.all, 'compatible', id] as const,
    incompatible: (id: string) => [...productKeys.all, 'incompatible', id] as const,
};

// ============================================================================
// HOOKS DE PRODUCTOS
// ============================================================================

/**
 * Hook para obtener lista de productos con paginación
 */
export function useProducts(page = 1, pageSize = 20) {
    return useQuery({
        queryKey: productKeys.list({ page, page_size: pageSize }),
        queryFn: () => api.products.getProducts(page, pageSize),
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    });
}

/**
 * Hook para buscar productos con filtros
 */
export function useProductSearch(params: ProductSearchParams) {
    return useQuery({
        queryKey: productKeys.list(params),
        queryFn: () => api.products.searchProducts(params),
        enabled: Object.keys(params).length > 0, // Solo ejecutar si hay filtros
        staleTime: 3 * 60 * 1000, // 3 minutos
    });
}

/**
 * Hook para obtener un producto por ID
 */
export function useProduct(id: string | undefined) {
    return useQuery({
        queryKey: productKeys.detail(id || ''),
        queryFn: () => api.products.getProductById(id!),
        enabled: !!id, // Solo ejecutar si hay ID
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
}

/**
 * Hook para obtener productos similares
 */
export function useSimilarProducts(productId: string | undefined, limit = 5) {
    return useQuery({
        queryKey: productKeys.similar(productId || ''),
        queryFn: () => api.products.getSimilarProducts(productId!, limit),
        enabled: !!productId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook para obtener productos compatibles
 */
export function useCompatibleProducts(productId: string | undefined) {
    return useQuery({
        queryKey: productKeys.compatible(productId || ''),
        queryFn: () => api.products.getCompatibleProducts(productId!),
        enabled: !!productId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook para obtener productos incompatibles
 */
export function useIncompatibleProducts(productId: string | undefined) {
    return useQuery({
        queryKey: productKeys.incompatible(productId || ''),
        queryFn: () => api.products.getIncompatibleProducts(productId!),
        enabled: !!productId,
        staleTime: 10 * 60 * 1000,
    });
}
