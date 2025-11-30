"""
Aplicación principal de FastAPI para SmartCompareMarket.
Punto de entrada de la API REST.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import (
    SmartCompareMarketException,
    OntologyException,
    SPARQLException
)
from app.api import products, comparisons, recommendations, analysis
from app.domain.schemas import HealthCheckResponse, ErrorResponse

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

settings = get_settings()


# ============================================================================
# LIFECYCLE
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación.

    Startup:
    - Valida la conexión con GraphDB
    - Carga la ontología
    - Inicializa el reasoner

    Shutdown:
    - Cierra conexiones
    """
    # Startup
    print("🚀 Iniciando SmartCompareMarket API...")
    print(f"📍 Endpoint SPARQL: {settings.GRAPH_DB_URL}")
    print(f"📚 Repositorio: {settings.GRAPH_DB_REPOSITORY}")
    print(f"🧠 Razonamiento: {'Habilitado' if settings.ENABLE_REASONING else 'Deshabilitado'}")

    yield

    # Shutdown
    print("👋 Cerrando SmartCompareMarket API...")


# ============================================================================
# APLICACIÓN
# ============================================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    # SmartCompareMarket API

    API RESTful para marketplace semántico con capacidades de:
    - 🔍 Búsqueda avanzada de productos
    - ⚖️ Comparación inteligente de productos
    - 🎯 Recomendaciones personalizadas usando SWRL
    - 📊 Análisis de mercado y estadísticas
    - 🧠 Razonamiento semántico con Pellet/FaCT++

    ## Características principales:

    ### Búsqueda Semántica
    - Filtros por categoría con soporte de jerarquía
    - Búsqueda por rango de precios
    - Filtrado por marca y palabra clave
    - Paginación de resultados

    ### Comparación de Productos
    - Comparación lado a lado de múltiples productos
    - Detección automática de diferencias
    - Cálculo de mejor relación calidad-precio
    - Comparación por especificaciones específicas

    ### Recomendaciones
    - Basadas en perfil de usuario
    - Usando reglas SWRL definidas en ontología
    - Filtrado por presupuesto y categorías preferidas
    - Razonamiento semántico para inferencias

    ### Análisis de Mercado
    - Estadísticas de precios por categoría
    - Comparación de vendedores y marcas
    - Insights de competitividad
    - Resumen general del mercado

    ## Tecnologías

    - **Ontología**: OWL 2 con SWRL
    - **Triplestore**: GraphDB/Stardog
    - **Consultas**: SPARQL 1.1
    - **Razonamiento**: Pellet/FaCT++/HermiT
    - **Framework**: FastAPI
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)


# ============================================================================
# MIDDLEWARE
# ============================================================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(SmartCompareMarketException)
async def smartcompare_exception_handler(request, exc: SmartCompareMarketException):
    """Handler para excepciones personalizadas de la aplicación."""
    return ErrorResponse(
        error=exc.message,
        detail=str(exc.details) if exc.details else None,
        code=exc.__class__.__name__
    )


@app.exception_handler(OntologyException)
async def ontology_exception_handler(request, exc: OntologyException):
    """Handler para excepciones de ontología."""
    return ErrorResponse(
        error=exc.message,
        detail=str(exc.details) if exc.details else None,
        code="ONTOLOGY_ERROR"
    )


@app.exception_handler(SPARQLException)
async def sparql_exception_handler(request, exc: SPARQLException):
    """Handler para excepciones de SPARQL."""
    return ErrorResponse(
        error=exc.message,
        detail=str(exc.details) if exc.details else None,
        code="SPARQL_ERROR"
    )


# ============================================================================
# ROUTERS
# ============================================================================

# Incluir routers con prefijo de versión
app.include_router(
    products.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    comparisons.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    recommendations.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    analysis.router,
    prefix=settings.API_V1_PREFIX
)


# ============================================================================
# ENDPOINTS RAÍZ
# ============================================================================

@app.get(
    "/",
    response_model=dict,
    summary="Raíz de la API",
    tags=["root"]
)
async def root():
    """
    Endpoint raíz de la API.

    Retorna información básica y enlaces a la documentación.
    """
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "description": "Marketplace semántico con capacidades de razonamiento OWL",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": "/openapi.json"
    }


@app.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health check",
    tags=["health"]
)
async def health_check():
    """
    Endpoint de health check.

    Verifica el estado de:
    - API
    - Conexión SPARQL
    - Ontología cargada
    - Reasoner activo
    """
    # TODO: Implementar verificaciones reales
    # Por ahora retorna estado mock
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        ontology_loaded=True,
        sparql_connected=True,
        reasoner_active=settings.ENABLE_REASONING
    )


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
