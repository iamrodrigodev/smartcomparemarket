"""
Schemas Pydantic para validación y serialización de datos.
Separa la capa de API de la capa de dominio.
"""
from typing import Optional, Any
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.domain import examples


# ============================================================================
# SCHEMAS DE PRODUCTO
# ============================================================================

class ProductBase(BaseModel):
    """Schema base para Producto."""
    nombre: str = Field(..., min_length=1, max_length=255)
    precio: Decimal = Field(..., gt=0, decimal_places=2)
    descripcion: Optional[str] = Field(None, max_length=1000)
    stock: Optional[int] = Field(None, ge=0)
    categoria: Optional[str] = None
    marca: Optional[str] = None
    vendedor: Optional[str] = None


class ProductCreate(ProductBase):
    """Schema para crear un Producto."""
    especificaciones: Optional[dict[str, Any]] = Field(default_factory=dict)


class ProductUpdate(BaseModel):
    """Schema para actualizar un Producto."""
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    precio: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    descripcion: Optional[str] = Field(None, max_length=1000)
    stock: Optional[int] = Field(None, ge=0)
    especificaciones: Optional[dict[str, Any]] = None


class ProductResponse(ProductBase):
    """Schema para respuesta de Producto."""
    id: str
    uri: Optional[str] = None
    especificaciones: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": examples.PRODUCT_EXAMPLE
        }
    )


class ProductListResponse(BaseModel):
    """Schema para lista paginada de productos."""
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.PRODUCT_LIST_EXAMPLE
        }
    )


# ============================================================================
# SCHEMAS DE BÚSQUEDA Y FILTROS
# ============================================================================

class ProductSearchParams(BaseModel):
    """Schema para parámetros de búsqueda de productos."""
    categoria: Optional[str] = None
    min_precio: Optional[Decimal] = Field(None, ge=0)
    max_precio: Optional[Decimal] = Field(None, ge=0)
    marca: Optional[str] = None
    keyword: Optional[str] = None

    @field_validator('max_precio')
    @classmethod
    def validar_rango_precio(cls, v, info):
        """Valida que max_precio sea mayor que min_precio."""
        if v is not None and info.data.get('min_precio') is not None:
            if v < info.data['min_precio']:
                raise ValueError('max_precio debe ser mayor que min_precio')
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.SEARCH_PARAMS_EXAMPLE
        }
    )


# ============================================================================
# SCHEMAS DE COMPARACIÓN
# ============================================================================

class ProductComparisonRequest(BaseModel):
    """Schema para solicitar comparación de productos."""
    product_ids: list[str] = Field(..., min_length=2, max_length=10)

    @field_validator('product_ids')
    @classmethod
    def validar_productos_unicos(cls, v):
        """Valida que no haya IDs duplicados."""
        if len(v) != len(set(v)):
            raise ValueError('Los IDs de productos deben ser únicos')
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.COMPARISON_REQUEST_EXAMPLE
        }
    )


class ProductComparisonResponse(BaseModel):
    """Schema para respuesta de comparación."""
    productos: list[ProductResponse]
    diferencias: dict[str, list[Any]]
    mejor_precio: ProductResponse
    timestamp: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.COMPARISON_RESPONSE_EXAMPLE
        }
    )


# ============================================================================
# SCHEMAS DE USUARIO
# ============================================================================

class UserBase(BaseModel):
    """Schema base para Usuario."""
    nombre: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)


class UserCreate(UserBase):
    """Schema para crear un Usuario."""
    presupuesto_maximo: Optional[Decimal] = Field(None, gt=0)
    categorias_preferidas: list[str] = Field(default_factory=list)


class UserUpdate(BaseModel):
    """Schema para actualizar un Usuario."""
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    presupuesto_maximo: Optional[Decimal] = Field(None, gt=0)
    categorias_preferidas: Optional[list[str]] = None


class UserResponse(UserBase):
    """Schema para respuesta de Usuario."""
    id: str
    presupuesto_maximo: Optional[Decimal] = None
    categorias_preferidas: list[str] = Field(default_factory=list)
    historial_compras: list[str] = Field(default_factory=list)
    uri: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# SCHEMAS DE RECOMENDACIONES
# ============================================================================

class RecommendationResponse(BaseModel):
    """Schema para respuesta de recomendación."""
    producto: ProductResponse
    razon: str
    score: Optional[float] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.RECOMMENDATION_RESPONSE_EXAMPLE
        }
    )


class RecommendationListResponse(BaseModel):
    """Schema para lista de recomendaciones."""
    items: list[RecommendationResponse]
    usuario_id: str
    timestamp: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.RECOMMENDATION_LIST_EXAMPLE
        }
    )


# ============================================================================
# SCHEMAS DE ESTADÍSTICAS Y ANÁLISIS
# ============================================================================

class MarketStatsResponse(BaseModel):
    """Schema para estadísticas de mercado."""
    categoria: str
    precio_minimo: Decimal
    precio_maximo: Decimal
    precio_promedio: Decimal
    total_productos: int
    rango_precio: Decimal

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.MARKET_STATS_EXAMPLE
        }
    )


class VendorStatsResponse(BaseModel):
    """Schema para estadísticas de vendedor."""
    vendedor: str
    total_productos: int
    precio_promedio: Decimal
    precio_minimo: Decimal
    precio_maximo: Decimal
    precio_competitivo: bool

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.VENDOR_STATS_EXAMPLE
        }
    )


class BrandStatsResponse(BaseModel):
    """Schema para estadísticas de marca."""
    marca: str
    total_productos: int
    precio_promedio: Decimal


# ============================================================================
# SCHEMAS DE PRODUCTOS RELACIONADOS
# ============================================================================

class SimilarProductsResponse(BaseModel):
    """Schema para productos similares."""
    producto_origen: ProductResponse
    productos_similares: list[ProductResponse]


class CompatibleProductsResponse(BaseModel):
    """Schema para productos compatibles."""
    producto_origen: ProductResponse
    productos_compatibles: list[ProductResponse]


class IncompatibleProductsResponse(BaseModel):
    """Schema para productos incompatibles."""
    producto_origen: ProductResponse
    productos_incompatibles: list[dict[str, Any]]  # Incluye razón


# ============================================================================
# SCHEMAS GENÉRICOS
# ============================================================================

class MessageResponse(BaseModel):
    """Schema para mensajes genéricos."""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Schema para respuestas de error."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                examples.ERROR_404_EXAMPLE,
                examples.ERROR_400_EXAMPLE,
                examples.ERROR_500_EXAMPLE
            ]
        }
    )


class HealthCheckResponse(BaseModel):
    """Schema para health check."""
    status: str
    version: str
    ontology_loaded: bool
    sparql_connected: bool
    reasoner_active: bool

    model_config = ConfigDict(
        json_schema_extra={
            "example": examples.HEALTH_CHECK_EXAMPLE
        }
    )
