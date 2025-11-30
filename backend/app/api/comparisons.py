"""
Router de API para endpoints de comparación de productos.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.application.comparison_service import ComparisonService
from app.application.product_service import ProductService
from app.domain.schemas import (
    ProductComparisonRequest,
    ProductComparisonResponse,
    ProductResponse
)
from app.core.dependencies import SPARQLClientDep, ReasonerEngineDep
from app.core.exceptions import ProductNotFoundException

# ============================================================================
# CONFIGURACIÓN DEL ROUTER
# ============================================================================

router = APIRouter(
    prefix="/comparisons",
    tags=["comparisons"]
)


# ============================================================================
# DEPENDENCIAS
# ============================================================================

async def get_comparison_service(
    sparql_client: SPARQLClientDep,
    reasoner: ReasonerEngineDep
) -> ComparisonService:
    """
    Inyecta el servicio de comparación.

    Args:
        sparql_client: Cliente SPARQL
        reasoner: Motor de razonamiento

    Returns:
        ComparisonService: Servicio de comparación
    """
    product_service = ProductService(sparql_client, reasoner)
    return ComparisonService(sparql_client, product_service)


ComparisonServiceDep = Annotated[ComparisonService, Depends(get_comparison_service)]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post(
    "/",
    response_model=ProductComparisonResponse,
    summary="Comparar productos",
    description="Compara múltiples productos mostrando diferencias y mejor precio"
)
async def compare_products(
    request: ProductComparisonRequest,
    service: ComparisonServiceDep
):
    """
    Compara múltiples productos.

    Recibe una lista de IDs de productos y retorna:
    - Lista de productos con todas sus especificaciones
    - Diferencias entre productos
    - Producto con mejor precio

    Requiere entre 2 y 10 productos para comparar.

    Ejemplo de request:
    ```json
    {
        "product_ids": ["Laptop_Dell_XPS13", "Laptop_HP_Spectre", "Laptop_Lenovo_X1"]
    }
    ```
    """
    try:
        comparison = await service.compare_products(request.product_ids)

        return ProductComparisonResponse(
            productos=[
                ProductResponse.model_validate(p.__dict__)
                for p in comparison.productos
            ],
            diferencias=comparison.obtener_diferencias(),
            mejor_precio=ProductResponse.model_validate(
                comparison.obtener_mejor_precio().__dict__
            )
        )

    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/best-value/{category}",
    response_model=list[dict],
    summary="Mejor relación calidad-precio",
    description="Encuentra productos con mejor relación calidad-precio en una categoría"
)
async def find_best_value(
    category: str,
    service: ComparisonServiceDep,
    limit: Annotated[int, Query(description="Límite de resultados", ge=1, le=20)] = 10
):
    """
    Encuentra productos con mejor relación calidad-precio.

    Calcula un score de valor basado en:
    - RAM
    - Almacenamiento
    - Precio

    Los productos se ordenan por el mejor score (mayor RAM + almacenamiento / precio).

    - **category**: Categoría de productos (ej: "Laptop", "Smartphone")
    - **limit**: Cantidad máxima de productos a retornar
    """
    try:
        products = await service.find_best_value_in_category(category, limit)
        return products

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al buscar mejor valor: {str(e)}"
        )


@router.post(
    "/by-specs",
    response_model=dict,
    summary="Comparar por especificaciones",
    description="Compara productos por especificaciones específicas"
)
async def compare_by_specifications(
    product_ids: list[str],
    specifications: list[str],
    service: ComparisonServiceDep
):
    """
    Compara productos por especificaciones específicas.

    Permite enfocarse en comparar solo ciertos atributos de los productos.

    Ejemplo de request:
    ```json
    {
        "product_ids": ["Laptop_Dell_XPS13", "Laptop_HP_Spectre"],
        "specifications": ["ram_gb", "almacenamiento_gb", "procesador"]
    }
    ```

    Returns:
    ```json
    {
        "ram_gb": {
            "Laptop_Dell_XPS13": 16,
            "Laptop_HP_Spectre": 8
        },
        "almacenamiento_gb": {
            "Laptop_Dell_XPS13": 512,
            "Laptop_HP_Spectre": 256
        }
    }
    ```
    """
    try:
        if len(product_ids) < 2:
            raise ValueError("Se requieren al menos 2 productos para comparar")

        if not specifications:
            raise ValueError("Se requiere al menos 1 especificación para comparar")

        comparison = await service.compare_by_specifications(
            product_ids,
            specifications
        )

        return comparison

    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
