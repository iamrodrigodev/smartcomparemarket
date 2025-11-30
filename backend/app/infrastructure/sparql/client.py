"""
Cliente SPARQL para consultas a GraphDB/Stardog.
Implementa el patrón Repository para acceso a datos.
"""
from typing import Any, Optional
import httpx
from urllib.parse import urljoin

from app.core.exceptions import (
    SPARQLConnectionError,
    SPARQLQueryError
)


class SPARQLClient:
    """
    Cliente para ejecutar consultas SPARQL contra GraphDB/Stardog.
    Implementa Interface Segregation Principle (ISP).
    """

    def __init__(
        self,
        endpoint_url: str,
        repository: str,
        username: Optional[str] = None,
        password: Optional[str] = None,
        timeout: int = 30
    ):
        """
        Inicializa el cliente SPARQL.

        Args:
            endpoint_url: URL base de GraphDB/Stardog
            repository: Nombre del repositorio
            username: Usuario (opcional)
            password: Contraseña (opcional)
            timeout: Timeout para consultas en segundos
        """
        self.endpoint_url = endpoint_url
        self.repository = repository
        self.timeout = timeout

        # Construir URL del endpoint SPARQL
        self.sparql_endpoint = urljoin(
            endpoint_url,
            f"/repositories/{repository}"
        )

        # Configurar autenticación si se proporciona
        self.auth = None
        if username and password:
            self.auth = (username, password)

        # Cliente HTTP asíncrono
        self.client = httpx.AsyncClient(
            auth=self.auth,
            timeout=timeout,
            headers={
                "Accept": "application/sparql-results+json",
                "Content-Type": "application/sparql-query"
            }
        )

    async def query(
        self,
        sparql_query: str,
        reasoning: bool = False
    ) -> dict[str, Any]:
        """
        Ejecuta una consulta SPARQL SELECT.

        Args:
            sparql_query: Consulta SPARQL
            reasoning: Si se debe habilitar razonamiento

        Returns:
            dict: Resultados en formato JSON

        Raises:
            SPARQLQueryError: Si la consulta falla
            SPARQLConnectionError: Si hay error de conexión
        """
        try:
            # Agregar prefijos comunes
            query_with_prefixes = self._add_prefixes(sparql_query)

            # Parámetros de la consulta
            params = {}
            if reasoning:
                params["infer"] = "true"

            # Ejecutar consulta
            response = await self.client.post(
                self.sparql_endpoint,
                content=query_with_prefixes,
                params=params
            )

            # Verificar respuesta
            if response.status_code == 200:
                return response.json()
            else:
                raise SPARQLQueryError(
                    f"SPARQL query failed with status {response.status_code}: {response.text}",
                    {"query": sparql_query, "status": response.status_code}
                )

        except httpx.ConnectError as e:
            raise SPARQLConnectionError(
                f"Failed to connect to SPARQL endpoint: {str(e)}",
                {"endpoint": self.sparql_endpoint}
            )
        except httpx.TimeoutException as e:
            raise SPARQLQueryError(
                f"SPARQL query timeout: {str(e)}",
                {"query": sparql_query, "timeout": self.timeout}
            )
        except Exception as e:
            if isinstance(e, (SPARQLQueryError, SPARQLConnectionError)):
                raise
            raise SPARQLQueryError(
                f"Unexpected error during SPARQL query: {str(e)}",
                {"query": sparql_query}
            )

    async def update(self, sparql_update: str) -> bool:
        """
        Ejecuta una actualización SPARQL INSERT/DELETE.

        Args:
            sparql_update: Consulta SPARQL UPDATE

        Returns:
            bool: True si la actualización fue exitosa

        Raises:
            SPARQLQueryError: Si la actualización falla
        """
        try:
            # Endpoint para actualizaciones
            update_endpoint = urljoin(
                self.endpoint_url,
                f"/repositories/{self.repository}/statements"
            )

            # Agregar prefijos
            update_with_prefixes = self._add_prefixes(sparql_update)

            # Ejecutar actualización
            response = await self.client.post(
                update_endpoint,
                content=update_with_prefixes,
                headers={"Content-Type": "application/sparql-update"}
            )

            return response.status_code in [200, 204]

        except Exception as e:
            raise SPARQLQueryError(
                f"SPARQL update failed: {str(e)}",
                {"update": sparql_update}
            )

    async def ask(self, sparql_ask: str) -> bool:
        """
        Ejecuta una consulta SPARQL ASK.

        Args:
            sparql_ask: Consulta SPARQL ASK

        Returns:
            bool: Resultado de la consulta ASK

        Raises:
            SPARQLQueryError: Si la consulta falla
        """
        try:
            query_with_prefixes = self._add_prefixes(sparql_ask)

            response = await self.client.post(
                self.sparql_endpoint,
                content=query_with_prefixes
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("boolean", False)
            else:
                raise SPARQLQueryError(
                    f"SPARQL ASK query failed: {response.text}",
                    {"query": sparql_ask}
                )

        except Exception as e:
            if isinstance(e, SPARQLQueryError):
                raise
            raise SPARQLQueryError(
                f"Error executing ASK query: {str(e)}",
                {"query": sparql_ask}
            )

    def _add_prefixes(self, query: str) -> str:
        """
        Agrega prefijos SPARQL comunes a la consulta.

        Args:
            query: Consulta SPARQL original

        Returns:
            str: Consulta con prefijos agregados
        """
        prefixes = """
PREFIX sc: <http://smartcompare.com/ontologia#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

"""
        # Si la consulta ya tiene prefijos, no duplicar
        if "PREFIX" in query.upper():
            return query

        return prefixes + query

    async def close(self):
        """Cierra el cliente HTTP."""
        await self.client.aclose()

    async def __aenter__(self):
        """Context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        await self.close()
