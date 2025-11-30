"""
Router de API para endpoints de análisis de mercado.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status

from app.application.analysis_service import AnalysisService
from app.domain.schemas import (
    MarketStatsResponse,
    VendorStatsResponse,
    BrandStatsResponse
)
from app.core.dependencies import SPARQLClientDep

# ============================================================================
# CONFIGURACIÓN DEL ROUTER
# ============================================================================

router = APIRouter(
    prefix="/analysis",
    tags=["analysis"]
)


# ============================================================================
# DEPENDENCIAS
# ============================================================================

async def get_analysis_service(
    sparql_client: SPARQLClientDep
) -> AnalysisService:
    """
    Inyecta el servicio de análisis.

    Args:
        sparql_client: Cliente SPARQL

    Returns:
        AnalysisService: Servicio de análisis
    """
    return AnalysisService(sparql_client)


AnalysisServiceDep = Annotated[AnalysisService, Depends(get_analysis_service)]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get(
    "/price-ranges",
    response_model=list[MarketStatsResponse],
    summary="Rangos de precio por categoría",
    description="Obtiene estadísticas de precios agrupadas por categoría"
)
async def get_price_ranges(
    service: AnalysisServiceDep
):
    """
    Obtiene rangos de precio por categoría.

    Para cada categoría retorna:
    - **precio_minimo**: Precio más bajo
    - **precio_maximo**: Precio más alto
    - **precio_promedio**: Precio promedio
    - **rango_precio**: Diferencia entre máximo y mínimo
    - **total_productos**: Cantidad de productos en la categoría

    Útil para análisis de mercado y posicionamiento de precios.
    """
    try:
        stats_list = await service.get_price_range_by_category()

        return [
            MarketStatsResponse(
                categoria=stat.categoria,
                precio_minimo=stat.precio_minimo,
                precio_maximo=stat.precio_maximo,
                precio_promedio=stat.precio_promedio,
                total_productos=stat.total_productos,
                rango_precio=stat.rango_precio
            )
            for stat in stats_list
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener rangos de precio: {str(e)}"
        )


@router.get(
    "/vendors",
    response_model=list[VendorStatsResponse],
    summary="Estadísticas de vendedores",
    description="Obtiene estadísticas de productos y precios por vendedor"
)
async def get_vendor_stats(
    service: AnalysisServiceDep
):
    """
    Obtiene estadísticas por vendedor.

    Para cada vendedor retorna:
    - **total_productos**: Cantidad de productos que vende
    - **precio_promedio**: Precio promedio de sus productos
    - **precio_minimo**: Precio más bajo que ofrece
    - **precio_maximo**: Precio más alto que ofrece
    - **precio_competitivo**: Indica si sus precios son competitivos

    Útil para analizar la oferta de cada vendedor.
    """
    try:
        stats_list = await service.get_vendor_statistics()

        return [
            VendorStatsResponse(
                vendedor=stat.vendedor,
                total_productos=stat.total_productos,
                precio_promedio=stat.precio_promedio,
                precio_minimo=stat.precio_minimo,
                precio_maximo=stat.precio_maximo,
                precio_competitivo=stat.precio_competitivo
            )
            for stat in stats_list
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas de vendedores: {str(e)}"
        )


@router.get(
    "/brands",
    response_model=list[BrandStatsResponse],
    summary="Comparación de marcas",
    description="Obtiene estadísticas de productos y precios por marca"
)
async def get_brand_stats(
    service: AnalysisServiceDep
):
    """
    Obtiene comparación de marcas.

    Para cada marca retorna:
    - **total_productos**: Cantidad de productos de la marca
    - **precio_promedio**: Precio promedio de productos de la marca

    Útil para análisis de posicionamiento de marca en el mercado.
    """
    try:
        brands_list = await service.get_brand_comparison()

        return [
            BrandStatsResponse(
                marca=brand["marca"],
                total_productos=brand["total_productos"],
                precio_promedio=brand["precio_promedio"]
            )
            for brand in brands_list
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener comparación de marcas: {str(e)}"
        )


@router.get(
    "/overview",
    response_model=dict,
    summary="Resumen del mercado",
    description="Obtiene un resumen general con estadísticas clave del mercado"
)
async def get_market_overview(
    service: AnalysisServiceDep
):
    """
    Obtiene un resumen general del mercado.

    Retorna estadísticas agregadas incluyendo:
    - Total de categorías, vendedores y marcas
    - Precio promedio global
    - Categoría con más productos
    - Vendedor con más productos

    Útil para dashboards y vistas generales del marketplace.
    """
    try:
        overview = await service.get_market_overview()
        return overview

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener resumen del mercado: {str(e)}"
        )


@router.get(
    "/categories/{categoria}/insights",
    response_model=dict,
    summary="Insights de categoría",
    description="Obtiene insights detallados de una categoría específica"
)
async def get_category_insights(
    categoria: str,
    service: AnalysisServiceDep
):
    """
    Obtiene insights detallados de una categoría.

    Para una categoría específica retorna:
    - Estadísticas de precios (min, max, promedio, rango)
    - Total de productos
    - Percentil de precio (posición relativa en el mercado)
    - Indicador de competitividad de precios

    - **categoria**: Nombre de la categoría (ej: "Laptop", "Smartphone")
    """
    try:
        insights = await service.get_category_insights(categoria)

        if not insights.get("encontrada"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría no encontrada: {categoria}"
            )

        return insights

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener insights de categoría: {str(e)}"
        )
