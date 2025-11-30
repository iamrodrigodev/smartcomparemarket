"""
Módulo de consultas SPARQL.
"""
from app.infrastructure.sparql.client import SPARQLClient
from app.infrastructure.sparql.queries import (
    ProductQueries,
    ComparisonQueries,
    RecommendationQueries,
    MarketAnalysisQueries
)

__all__ = [
    "SPARQLClient",
    "ProductQueries",
    "ComparisonQueries",
    "RecommendationQueries",
    "MarketAnalysisQueries"
]
