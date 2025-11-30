"""
Módulo de dependencias para inyección en FastAPI.
Implementa el patrón Dependency Injection siguiendo principios SOLID.
"""
from typing import Annotated
from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings
from app.infrastructure.sparql.client import SPARQLClient
from app.infrastructure.ontology.loader import OntologyLoader
from app.infrastructure.reasoner.engine import ReasonerEngine


# Dependencia de configuración
def get_current_settings() -> Settings:
    """
    Obtiene la configuración actual de la aplicación.

    Returns:
        Settings: Instancia de configuración
    """
    return get_settings()


# Tipo anotado para configuración
SettingsDep = Annotated[Settings, Depends(get_current_settings)]


# Dependencia del cliente SPARQL
async def get_sparql_client(
    settings: SettingsDep
) -> SPARQLClient:
    """
    Crea y retorna un cliente SPARQL.
    Implementa el patrón Factory.

    Args:
        settings: Configuración de la aplicación

    Returns:
        SPARQLClient: Cliente configurado para consultas SPARQL
    """
    client = SPARQLClient(
        endpoint_url=settings.GRAPH_DB_URL,
        repository=settings.GRAPH_DB_REPOSITORY,
        username=settings.GRAPH_DB_USERNAME,
        password=settings.GRAPH_DB_PASSWORD,
        timeout=settings.SPARQL_TIMEOUT
    )
    return client


# Tipo anotado para cliente SPARQL
SPARQLClientDep = Annotated[SPARQLClient, Depends(get_sparql_client)]


# Dependencia del cargador de ontologías
async def get_ontology_loader(
    settings: SettingsDep
) -> OntologyLoader:
    """
    Crea y retorna un cargador de ontologías.

    Args:
        settings: Configuración de la aplicación

    Returns:
        OntologyLoader: Cargador de ontologías configurado
    """
    loader = OntologyLoader(
        ontology_path=settings.ONTOLOGY_FILE_PATH,
        base_uri=settings.ONTOLOGY_BASE_URI
    )

    # Cargar ontología si no está cargada
    if not loader.is_loaded():
        await loader.load()

    return loader


# Tipo anotado para cargador de ontologías
OntologyLoaderDep = Annotated[OntologyLoader, Depends(get_ontology_loader)]


# Dependencia del motor de razonamiento
async def get_reasoner_engine(
    ontology_loader: OntologyLoaderDep,
    settings: SettingsDep
) -> ReasonerEngine:
    """
    Crea y retorna un motor de razonamiento.

    Args:
        ontology_loader: Cargador de ontologías
        settings: Configuración de la aplicación

    Returns:
        ReasonerEngine: Motor de razonamiento configurado
    """
    if not settings.ENABLE_REASONING:
        return None

    engine = ReasonerEngine(
        ontology=ontology_loader.get_ontology(),
        reasoner_type=settings.REASONER_TYPE,
        cache_ttl=settings.REASONING_CACHE_TTL
    )

    return engine


# Tipo anotado para motor de razonamiento
ReasonerEngineDep = Annotated[ReasonerEngine, Depends(get_reasoner_engine)]


# Dependencia de validación de API Key (opcional)
async def verify_api_key(
    x_api_key: Annotated[str | None, Header()] = None,
    settings: SettingsDep = None
) -> str:
    """
    Verifica la API key si está configurada.

    Args:
        x_api_key: API key del header
        settings: Configuración de la aplicación

    Returns:
        str: API key validada

    Raises:
        HTTPException: Si la API key es inválida
    """
    # Por ahora, sin validación de API key
    # Se puede implementar más adelante
    return x_api_key or "anonymous"


# Tipo anotado para API key
APIKeyDep = Annotated[str, Depends(verify_api_key)]


# Dependencia de paginación
class PaginationParams:
    """Parámetros de paginación reutilizables."""

    def __init__(
        self,
        page: int = 1,
        page_size: int = 20,
        settings: Settings = Depends(get_current_settings)
    ):
        """
        Inicializa parámetros de paginación.

        Args:
            page: Número de página (empezando en 1)
            page_size: Tamaño de página
            settings: Configuración de la aplicación
        """
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El número de página debe ser mayor a 0"
            )

        # Limitar tamaño de página
        max_size = settings.MAX_PAGE_SIZE
        if page_size > max_size:
            page_size = max_size

        if page_size < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El tamaño de página debe ser mayor a 0"
            )

        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size
        self.limit = page_size


# Tipo anotado para paginación
PaginationDep = Annotated[PaginationParams, Depends()]
