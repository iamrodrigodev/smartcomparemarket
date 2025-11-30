/**
 * Tipos TypeScript para la API del backend
 * Basados en los schemas Pydantic del backend
 */

// ============================================================================
// TIPOS DE PRODUCTO
// ============================================================================

export interface ProductResponse {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  stock?: number;
  categoria?: string;
  marca?: string;
  vendedor?: string;
  uri?: string;
  especificaciones: Record<string, unknown>;
}

export interface ProductListResponse {
  items: ProductResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductSearchParams {
  categoria?: string;
  min_precio?: number;
  max_precio?: number;
  marca?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

// ============================================================================
// TIPOS DE COMPARACIÓN
// ============================================================================

export interface ProductComparisonRequest {
  product_ids: string[];
}

export interface ProductComparisonResponse {
  productos: ProductResponse[];
  diferencias: Record<string, unknown[]>;
  mejor_precio: ProductResponse;
  timestamp: string;
}

export interface ComparisonBySpecsRequest {
  product_ids: string[];
  specs: string[];
}

// ============================================================================
// TIPOS DE RECOMENDACIONES
// ============================================================================

export interface RecommendationResponse {
  producto: ProductResponse;
  razon: string;
  score?: number;
}

export interface RecommendationListResponse {
  items: RecommendationResponse[];
  usuario_id: string;
  timestamp: string;
}

// ============================================================================
// TIPOS DE ANÁLISIS DE MERCADO
// ============================================================================

export interface MarketStatsResponse {
  categoria: string;
  precio_minimo: number;
  precio_maximo: number;
  precio_promedio: number;
  total_productos: number;
  rango_precio: number;
}

export interface VendorStatsResponse {
  vendedor: string;
  total_productos: number;
  precio_promedio: number;
  precio_minimo: number;
  precio_maximo: number;
  precio_competitivo: boolean;
}

export interface BrandStatsResponse {
  marca: string;
  total_productos: number;
  precio_promedio: number;
}

export interface MarketOverviewResponse {
  total_categorias: number;
  total_vendedores: number;
  total_marcas: number;
  precio_promedio_global: number;
  top_categoria: string;
  top_vendedor: string;
}

export interface CategoryInsightsResponse {
  categoria: string;
  total_productos: number;
  precio_promedio: number;
  precio_minimo: number;
  precio_maximo: number;
  percentil_precio: number;
  competitividad: string;
  insights: string[];
}

// ============================================================================
// TIPOS DE RELACIONES SEMÁNTICAS
// ============================================================================

export interface SimilarProductsResponse {
  producto_origen: ProductResponse;
  productos_similares: ProductResponse[];
}

export interface CompatibleProductsResponse {
  producto_origen: ProductResponse;
  productos_compatibles: ProductResponse[];
}

export interface IncompatibleProductsResponse {
  producto_origen: ProductResponse;
  productos_incompatibles: Array<{
    producto: ProductResponse;
    razon: string;
  }>;
}

// ============================================================================
// TIPOS GENÉRICOS
// ============================================================================

export interface MessageResponse {
  message: string;
  detail?: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  code?: string;
}

export interface HealthCheckResponse {
  status: string;
  version: string;
  ontology_loaded: boolean;
  sparql_connected: boolean;
  reasoner_active: boolean;
}
