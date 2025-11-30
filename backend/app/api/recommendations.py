"""
Router de API para endpoints de recomendaciones.
"""
from typing import Annotated
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.application.recommendation_service import RecommendationService
from app.domain.schemas import (
    RecommendationListResponse,
    RecommendationResponse,
    ProductResponse
)
from app.core.dependencies import SPARQLClientDep, ReasonerEngineDep

# ============================================================================
# CONFIGURACIÓN DEL ROUTER
# ============================================================================

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)


# ============================================================================
# DEPENDENCIAS
# ============================================================================

async def get_recommendation_service(
    sparql_client: SPARQLClientDep,
    reasoner: ReasonerEngineDep
) -> RecommendationService:
    """
    Inyecta el servicio de recomendaciones.

    Args:
        sparql_client: Cliente SPARQL
        reasoner: Motor de razonamiento

    Returns:
        RecommendationService: Servicio de recomendaciones
    """
    return RecommendationService(sparql_client, reasoner)


RecommendationServiceDep = Annotated[
    RecommendationService,
    Depends(get_recommendation_service)
]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get(
    "/users/{user_id}",
    response_model=RecommendationListResponse,
    summary="Recomendaciones para usuario",
    description="Obtiene recomendaciones personalizadas usando reglas SWRL y razonamiento semántico"
)
async def get_user_recommendations(
    user_id: str,
    service: RecommendationServiceDep,
    limit: Annotated[int, Query(description="Límite de recomendaciones", ge=1, le=50)] = 10
):
    """
    Obtiene recomendaciones personalizadas para un usuario.

    Las recomendaciones se generan usando:
    - **Reglas SWRL**: Definidas en la ontología
    - **Razonamiento semántico**: Inferencias sobre el perfil del usuario
    - **Historial de compras**: Productos similares a compras anteriores
    - **Categorías preferidas**: Productos en categorías de interés
    - **Presupuesto**: Productos dentro del rango de precio del usuario

    - **user_id**: ID del usuario
    - **limit**: Cantidad máxima de recomendaciones
    """
    try:
        recommendations = await service.get_recommendations_for_user(user_id, limit)

        return RecommendationListResponse(
            items=[
                RecommendationResponse(
                    producto=ProductResponse.model_validate(rec.producto.__dict__),
                    razon=rec.razon,
                    score=rec.score
                )
                for rec in recommendations
            ],
            usuario_id=user_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener recomendaciones: {str(e)}"
        )


@router.get(
    "/users/{user_id}/budget",
    response_model=list[ProductResponse],
    summary="Productos en presupuesto",
    description="Obtiene productos dentro del presupuesto del usuario"
)
async def get_budget_products(
    user_id: str,
    service: RecommendationServiceDep
):
    """
    Obtiene productos dentro del presupuesto del usuario.

    Filtra productos basándose en la propiedad presupuestoMaximo del usuario
    definida en la ontología.

    - **user_id**: ID del usuario
    """
    try:
        products = await service.get_budget_products(user_id)

        return [
            ProductResponse.model_validate(p.__dict__)
            for p in products
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener productos en presupuesto: {str(e)}"
        )


@router.get(
    "/users/{user_id}/personalized",
    response_model=RecommendationListResponse,
    summary="Recomendaciones personalizadas con filtros",
    description="Recomendaciones con filtros adicionales de categoría y precio"
)
async def get_personalized_recommendations(
    user_id: str,
    service: RecommendationServiceDep,
    categoria: Annotated[str | None, Query(description="Filtrar por categoría")] = None,
    max_precio: Annotated[float | None, Query(description="Precio máximo", ge=0)] = None,
    limit: Annotated[int, Query(description="Límite de recomendaciones", ge=1, le=50)] = 10
):
    """
    Obtiene recomendaciones personalizadas con filtros adicionales.

    Combina la recomendación semántica con filtros específicos para
    refinar los resultados según necesidades puntuales del usuario.

    - **user_id**: ID del usuario
    - **categoria**: Filtrar por categoría específica (opcional)
    - **max_precio**: Precio máximo (opcional)
    - **limit**: Cantidad máxima de recomendaciones
    """
    try:
        # Convertir max_precio a Decimal si existe
        max_price_decimal = Decimal(str(max_precio)) if max_precio else None

        recommendations = await service.get_personalized_recommendations(
            user_id=user_id,
            category=categoria,
            max_price=max_price_decimal,
            limit=limit
        )

        return RecommendationListResponse(
            items=[
                RecommendationResponse(
                    producto=ProductResponse.model_validate(rec.producto.__dict__),
                    razon=rec.razon,
                    score=rec.score
                )
                for rec in recommendations
            ],
            usuario_id=user_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener recomendaciones personalizadas: {str(e)}"
        )
