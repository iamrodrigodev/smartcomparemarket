"""
Custom exceptions for SmartCompareMarket API.
Follows Open/Closed Principle - extensible but not modifiable.
"""
from typing import Any, Optional
from fastapi import HTTPException, status


class SmartCompareMarketException(Exception):
    """Base exception for all custom exceptions."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class OntologyException(SmartCompareMarketException):
    """Exception raised for ontology-related errors."""
    pass


class OntologyLoadError(OntologyException):
    """Exception raised when ontology file cannot be loaded."""
    pass


class OntologyValidationError(OntologyException):
    """Exception raised when ontology validation fails."""
    pass


class SPARQLException(SmartCompareMarketException):
    """Exception raised for SPARQL-related errors."""
    pass


class SPARQLQueryError(SPARQLException):
    """Exception raised when SPARQL query fails."""
    pass


class SPARQLConnectionError(SPARQLException):
    """Exception raised when connection to SPARQL endpoint fails."""
    pass


class ReasonerException(SmartCompareMarketException):
    """Exception raised for reasoner-related errors."""
    pass


class ReasonerInitializationError(ReasonerException):
    """Exception raised when reasoner cannot be initialized."""
    pass


class ReasoningError(ReasonerException):
    """Exception raised when reasoning process fails."""
    pass


class ProductNotFoundException(SmartCompareMarketException):
    """Exception raised when product is not found."""

    def __init__(self, product_id: str):
        super().__init__(
            f"Product with ID '{product_id}' not found",
            {"product_id": product_id}
        )


class InvalidFilterException(SmartCompareMarketException):
    """Exception raised when filter parameters are invalid."""
    pass


class RecommendationException(SmartCompareMarketException):
    """Exception raised for recommendation-related errors."""
    pass


# HTTP Exception Handlers
def ontology_not_found_exception() -> HTTPException:
    """Returns HTTPException for ontology not found."""
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Ontology service is not available"
    )


def sparql_connection_exception() -> HTTPException:
    """Returns HTTPException for SPARQL connection error."""
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database connection failed"
    )


def product_not_found_exception(product_id: str) -> HTTPException:
    """Returns HTTPException for product not found."""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Product '{product_id}' not found"
    )


def invalid_query_exception(message: str) -> HTTPException:
    """Returns HTTPException for invalid query."""
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message
    )


def reasoning_failed_exception(message: str) -> HTTPException:
    """Returns HTTPException for reasoning failure."""
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Reasoning failed: {message}"
    )
