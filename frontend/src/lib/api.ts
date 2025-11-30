/**
 * Servicio API para comunicación con el backend
 * Implementa el patrón Repository para abstraer las llamadas HTTP
 * Sigue principios SOLID: Single Responsibility, Dependency Inversion
 */

import type {
    ProductResponse,
    ProductListResponse,
    ProductSearchParams,
    ProductComparisonRequest,
    ProductComparisonResponse,
    ComparisonBySpecsRequest,
    RecommendationListResponse,
    MarketStatsResponse,
    VendorStatsResponse,
    BrandStatsResponse,
    MarketOverviewResponse,
    CategoryInsightsResponse,
    SimilarProductsResponse,
    CompatibleProductsResponse,
    IncompatibleProductsResponse,
    HealthCheckResponse,
} from '@/types/api';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

// ============================================================================
// CLIENTE HTTP BASE
// ============================================================================

class ApiClient {
    private baseURL: string;
    private timeout: number;

    constructor(baseURL: string, timeout: number) {
        this.baseURL = baseURL;
        this.timeout = timeout;
    }

    /**
     * Realiza una petición HTTP genérica
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    error: 'Error desconocido',
                    detail: response.statusText,
                }));
                throw new Error(error.detail || error.error || 'Error en la petición');
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('La petición excedió el tiempo de espera');
                }
                throw error;
            }
            throw new Error('Error desconocido en la petición');
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const queryString = params
            ? '?' + new URLSearchParams(
                Object.entries(params)
                    .filter(([_, v]) => v !== undefined && v !== null)
                    .map(([k, v]) => [k, String(v)])
            ).toString()
            : '';

        return this.request<T>(`${endpoint}${queryString}`, {
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
        });
    }
}

// ============================================================================
// SERVICIO DE PRODUCTOS
// ============================================================================

class ProductService {
    constructor(private client: ApiClient) { }

    /**
     * Obtiene todos los productos con paginación
     */
    async getProducts(page = 1, pageSize = 20): Promise<ProductListResponse> {
        return this.client.get<ProductListResponse>('/products/', {
            page,
            page_size: pageSize,
        });
    }

    /**
     * Obtiene un producto por ID
     */
    async getProductById(id: string): Promise<ProductResponse> {
        return this.client.get<ProductResponse>(`/products/${id}`);
    }

    /**
     * Busca productos con filtros semánticos
     */
    async searchProducts(params: ProductSearchParams): Promise<ProductListResponse> {
        return this.client.get<ProductListResponse>('/products/search/', params);
    }

    /**
     * Obtiene productos similares
     */
    async getSimilarProducts(productId: string, limit = 5): Promise<SimilarProductsResponse> {
        return this.client.get<SimilarProductsResponse>(`/products/${productId}/similar`, {
            limit,
        });
    }

    /**
     * Obtiene productos compatibles
     */
    async getCompatibleProducts(productId: string): Promise<CompatibleProductsResponse> {
        return this.client.get<CompatibleProductsResponse>(`/products/${productId}/compatible`);
    }

    /**
     * Obtiene productos incompatibles
     */
    async getIncompatibleProducts(productId: string): Promise<IncompatibleProductsResponse> {
        return this.client.get<IncompatibleProductsResponse>(`/products/${productId}/incompatible`);
    }
}

// ============================================================================
// SERVICIO DE COMPARACIONES
// ============================================================================

class ComparisonService {
    constructor(private client: ApiClient) { }

    /**
     * Compara múltiples productos
     */
    async compareProducts(request: ProductComparisonRequest): Promise<ProductComparisonResponse> {
        return this.client.post<ProductComparisonResponse>('/comparisons/', request);
    }

    /**
     * Obtiene el mejor valor en una categoría
     */
    async getBestValue(category: string): Promise<ProductComparisonResponse> {
        return this.client.get<ProductComparisonResponse>(`/comparisons/best-value/${category}`);
    }

    /**
     * Compara productos por especificaciones específicas
     */
    async compareBySpecs(request: ComparisonBySpecsRequest): Promise<ProductComparisonResponse> {
        return this.client.post<ProductComparisonResponse>('/comparisons/by-specs', request);
    }
}

// ============================================================================
// SERVICIO DE RECOMENDACIONES
// ============================================================================

class RecommendationService {
    constructor(private client: ApiClient) { }

    /**
     * Obtiene recomendaciones para un usuario
     */
    async getRecommendations(userId: string, limit = 10): Promise<RecommendationListResponse> {
        return this.client.get<RecommendationListResponse>(`/recommendations/users/${userId}`, {
            limit,
        });
    }

    /**
     * Obtiene productos dentro del presupuesto del usuario
     */
    async getInBudget(userId: string, limit = 10): Promise<RecommendationListResponse> {
        return this.client.get<RecommendationListResponse>(`/recommendations/users/${userId}/budget`, {
            limit,
        });
    }

    /**
     * Obtiene recomendaciones personalizadas con filtros
     */
    async getPersonalized(
        userId: string,
        params: { categoria?: string; max_precio?: number; limit?: number }
    ): Promise<RecommendationListResponse> {
        return this.client.get<RecommendationListResponse>(
            `/recommendations/users/${userId}/personalized`,
            params
        );
    }
}

// ============================================================================
// SERVICIO DE ANÁLISIS DE MERCADO
// ============================================================================

class AnalysisService {
    constructor(private client: ApiClient) { }

    /**
     * Obtiene rangos de precio por categoría
     */
    async getPriceRanges(): Promise<MarketStatsResponse[]> {
        return this.client.get<MarketStatsResponse[]>('/analysis/price-ranges');
    }

    /**
     * Obtiene estadísticas de vendedores
     */
    async getVendorStats(): Promise<VendorStatsResponse[]> {
        return this.client.get<VendorStatsResponse[]>('/analysis/vendors');
    }

    /**
     * Obtiene comparación de marcas
     */
    async getBrandStats(): Promise<BrandStatsResponse[]> {
        return this.client.get<BrandStatsResponse[]>('/analysis/brands');
    }

    /**
     * Obtiene resumen general del mercado
     */
    async getOverview(): Promise<MarketOverviewResponse> {
        return this.client.get<MarketOverviewResponse>('/analysis/overview');
    }

    /**
     * Obtiene insights de una categoría específica
     */
    async getCategoryInsights(category: string): Promise<CategoryInsightsResponse> {
        return this.client.get<CategoryInsightsResponse>(`/analysis/categories/${category}/insights`);
    }
}

// ============================================================================
// SERVICIO DE HEALTH CHECK
// ============================================================================

class HealthService {
    constructor(private client: ApiClient) { }

    /**
     * Verifica el estado del backend
     */
    async check(): Promise<HealthCheckResponse> {
        return this.client.get<HealthCheckResponse>('/health');
    }
}

// ============================================================================
// API PRINCIPAL (FACADE PATTERN)
// ============================================================================

class SmartCompareMarketAPI {
    private client: ApiClient;

    public products: ProductService;
    public comparisons: ComparisonService;
    public recommendations: RecommendationService;
    public analysis: AnalysisService;
    public health: HealthService;

    constructor(baseURL: string, timeout: number) {
        this.client = new ApiClient(baseURL, timeout);

        // Inicializar servicios
        this.products = new ProductService(this.client);
        this.comparisons = new ComparisonService(this.client);
        this.recommendations = new RecommendationService(this.client);
        this.analysis = new AnalysisService(this.client);
        this.health = new HealthService(this.client);
    }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const api = new SmartCompareMarketAPI(API_BASE_URL, API_TIMEOUT);

// Exportar también los servicios individuales para testing
export { ProductService, ComparisonService, RecommendationService, AnalysisService, HealthService };
