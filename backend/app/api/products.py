"""
Router de API para endpoints de productos.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.application.product_service import ProductService
from app.domain.schemas import (
    ProductResponse,
    ProductListResponse,
    ProductSearchParams,
    SimilarProductsResponse,
    CompatibleProductsResponse,
    IncompatibleProductsResponse
)
from app.core.dependencies import (
    SPARQLClientDep,
    ReasonerEngineDep,
    PaginationDep
)
from app.core.exceptions import ProductNotFoundException

# ============================================================================
# CONFIGURACIÓN DEL ROUTER
# ============================================================================

router = APIRouter(
    prefix="/products",
    tags=["products"]
)


# ============================================================================
# DEPENDENCIAS
# ============================================================================

async def get_product_service(
    sparql_client: SPARQLClientDep,
    reasoner: ReasonerEngineDep
) -> ProductService:
    """
    Inyecta el servicio de productos.

    Args:
        sparql_client: Cliente SPARQL
        reasoner: Motor de razonamiento

    Returns:
        ProductService: Servicio de productos
    """
    return ProductService(sparql_client, reasoner)


ProductServiceDep = Annotated[ProductService, Depends(get_product_service)]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get(
    "/",
    response_model=ProductListResponse,
    summary="Listar productos",
    description="Obtiene una lista paginada de todos los productos disponibles"
)
async def list_products(
    service: ProductServiceDep,
    pagination: PaginationDep
):
    """
    Lista todos los productos con paginación.

    - **page**: Número de página (empezando en 1)
    - **page_size**: Cantidad de productos por página

    Returns una lista de productos con información de paginación.
    """
    products = await service.get_all_products(
        limit=pagination.limit,
        offset=pagination.offset
    )

    # Calcular total de páginas (por ahora estimado)
    # En producción, se haría una consulta COUNT separada
    total_items = len(products)
    total_pages = (total_items + pagination.page_size - 1) // pagination.page_size

    return ProductListResponse(
        items=[ProductResponse.model_validate(p.__dict__) for p in products],
        total=total_items,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=max(total_pages, 1)
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Obtener producto",
    description="Obtiene los detalles completos de un producto específico"
)
async def get_product(
    product_id: str,
    service: ProductServiceDep
):
    """
    Obtiene un producto por su ID.

    - **product_id**: Identificador único del producto

    Raises:
        404: Si el producto no existe
    """
    try:
        product = await service.get_product_by_id(product_id)
        return ProductResponse.model_validate(product.__dict__)

    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/search/",
    response_model=ProductListResponse,
    summary="Buscar productos",
    description="Busca productos aplicando filtros semánticos"
)
async def search_products(
    service: ProductServiceDep,
    pagination: PaginationDep,
    categoria: Annotated[str | None, Query(description="Categoría del producto")] = None,
    min_precio: Annotated[float | None, Query(description="Precio mínimo", ge=0)] = None,
    max_precio: Annotated[float | None, Query(description="Precio máximo", ge=0)] = None,
    marca: Annotated[str | None, Query(description="Marca del producto")] = None,
    keyword: Annotated[str | None, Query(description="Palabra clave en nombre o descripción")] = None
):
    """
    Busca productos con filtros avanzados.

    Filtros disponibles:
    - **categoria**: Filtra por categoría (soporta jerarquía semántica)
    - **min_precio**: Precio mínimo
    - **max_precio**: Precio máximo
    - **marca**: Marca específica
    - **keyword**: Búsqueda por palabra clave en nombre o descripción

    Los filtros se combinan con AND lógico.
    """
    # Crear parámetros de búsqueda
    search_params = ProductSearchParams(
        categoria=categoria,
        min_precio=min_precio,
        max_precio=max_precio,
        marca=marca,
        keyword=keyword
    )

    # Ejecutar búsqueda
    products = await service.search_products(
        search_params,
        limit=pagination.limit,
        offset=pagination.offset
    )

    # Calcular total de páginas
    total_items = len(products)
    total_pages = (total_items + pagination.page_size - 1) // pagination.page_size

    return ProductListResponse(
        items=[ProductResponse.model_validate(p.__dict__) for p in products],
        total=total_items,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=max(total_pages, 1)
    )


@router.get(
    "/{product_id}/similar",
    response_model=SimilarProductsResponse,
    summary="Productos similares",
    description="Obtiene productos similares usando relaciones semánticas"
)
async def get_similar_products(
    product_id: str,
    service: ProductServiceDep,
    limit: Annotated[int, Query(description="Límite de resultados", ge=1, le=20)] = 5
):
    """
    Obtiene productos similares a uno dado.

    Usa las relaciones semánticas definidas en la ontología:
    - esSimilarA
    - esEquivalenteTecnico

    - **product_id**: ID del producto de referencia
    - **limit**: Cantidad máxima de productos similares a retornar
    """
    try:
        # Obtener producto origen
        origin = await service.get_product_by_id(product_id)

        # Obtener similares
        similar = await service.get_similar_products(product_id, limit)

        return SimilarProductsResponse(
            producto_origen=ProductResponse.model_validate(origin.__dict__),
            productos_similares=[
                ProductResponse.model_validate(p.__dict__) for p in similar
            ]
        )

    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/{product_id}/compatible",
    response_model=CompatibleProductsResponse,
    summary="Productos compatibles",
    description="Obtiene productos compatibles con uno dado"
)
async def get_compatible_products(
    product_id: str,
    service: ProductServiceDep
):
    """
    Obtiene productos compatibles.

    Usa la relación semántica esCompatibleCon definida en la ontología.

    - **product_id**: ID del producto de referencia
    """
    try:
        # Obtener producto origen
        origin = await service.get_product_by_id(product_id)

        # Obtener compatibles
        compatible = await service.get_compatible_products(product_id)

        return CompatibleProductsResponse(
            producto_origen=ProductResponse.model_validate(origin.__dict__),
            productos_compatibles=[
                ProductResponse.model_validate(p.__dict__) for p in compatible
            ]
        )

    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/{product_id}/incompatible",
    response_model=IncompatibleProductsResponse,
    summary="Productos incompatibles",
    description="Obtiene productos incompatibles con razones"
)
async def get_incompatible_products(
    product_id: str,
    service: ProductServiceDep
):
    """
    Obtiene productos incompatibles con razones.

    Usa la relación semántica incompatibleCon y reglas de inferencia
    para detectar incompatibilidades (ej: sistemas operativos diferentes).

    - **product_id**: ID del producto de referencia
    """
    try:
        # Obtener producto origen
        origin = await service.get_product_by_id(product_id)

        # Obtener incompatibles
        incompatible = await service.get_incompatible_products(product_id)

        return IncompatibleProductsResponse(
            producto_origen=ProductResponse.model_validate(origin.__dict__),
            productos_incompatibles=incompatible
        )

    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
