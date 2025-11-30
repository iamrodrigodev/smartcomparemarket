"""
Core configuration module for SmartCompareMarket API.
Implements configuration management with environment variables.
"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    Follows Single Responsibility Principle (SRP).
    """

    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "SmartCompareMarket API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Marketplace Semántico con Comparación Inteligente"
    DEBUG: bool = False

    # CORS Configuration
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081"
    ]
    
    # Alias for backward compatibility
    @property
    def CORS_ORIGINS(self) -> list[str]:
        return self.ALLOWED_ORIGINS


    # GraphDB/Stardog Configuration
    GRAPH_DB_URL: str = "http://localhost:7200"
    GRAPH_DB_REPOSITORY: str = "smartcomparemarket"
    GRAPH_DB_USERNAME: Optional[str] = None
    GRAPH_DB_PASSWORD: Optional[str] = None

    # Ontology Configuration
    ONTOLOGY_FILE_PATH: str = "../ontologies/SmartCompareMarket.owl"
    ONTOLOGY_BASE_URI: str = "http://smartcompare.com/ontologia#"

    # Reasoner Configuration
    REASONER_TYPE: str = "pellet"  # pellet, hermit, or fact++
    ENABLE_REASONING: bool = True
    REASONING_CACHE_TTL: int = 300  # seconds

    # SPARQL Query Configuration
    SPARQL_TIMEOUT: int = 30  # seconds
    MAX_QUERY_RESULTS: int = 1000

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Cache Configuration
    REDIS_URL: Optional[str] = None
    CACHE_ENABLED: bool = False
    CACHE_TTL: int = 600  # seconds

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance.
    Implements Singleton pattern for settings.
    """
    return Settings()


# Export settings instance
settings = get_settings()
