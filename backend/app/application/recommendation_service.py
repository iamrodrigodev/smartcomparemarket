"""
Servicio de aplicación para recomendaciones de productos.
Implementa casos de uso relacionados con recomendaciones semánticas.
"""
from typing import Optional
from decimal import Decimal

from app.infrastructure.sparql.client import SPARQLClient
from app.infrastructure.sparql.queries import RecommendationQueries
from app.infrastructure.reasoner.engine import ReasonerEngine
from app.domain.entities import Product, Recommendation
from app.core.exceptions import SPARQLQueryError


class RecommendationService:
    """
    Servicio de aplicación para recomendaciones.
    Implementa el Principio de Responsabilidad Única (SRP).
    """

    def __init__(
        self,
        sparql_client: SPARQLClient,
        reasoner: Optional[ReasonerEngine] = None
    ):
        """
        Inicializa el servicio de recomendaciones.

        Args:
            sparql_client: Cliente SPARQL para consultas
            reasoner: Motor de razonamiento (opcional)
        """
        self.sparql_client = sparql_client
        self.reasoner = reasoner
        self.queries = RecommendationQueries()

    async def get_recommendations_for_user(
        self,
        user_id: str,
        limit: int = 10
    ) -> list[Recommendation]:
        """
        Obtiene recomendaciones para un usuario.
        Usa reglas SWRL y razonamiento semántico.

        Args:
            user_id: ID del usuario
            limit: Límite de recomendaciones

        Returns:
            list[Recommendation]: Lista de recomendaciones
        """
        try:
            # Asegurar que el razonamiento está actualizado
            if self.reasoner:
                await self.reasoner.ensure_reasoning()

            # Ejecutar consulta SPARQL con razonamiento
            query = self.queries.get_recommendations_for_user(user_id, limit)
            result = await self.sparql_client.query(
                query,
                reasoning=self.reasoner is not None
            )

            # Parsear recomendaciones
            recommendations = self._parse_recommendations(
                result,
                user_id
            )

            # Ordenar por score (si existe) o por razón
            recommendations.sort()

            return recommendations

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener recomendaciones: {str(e)}",
                {"user_id": user_id}
            )

    async def get_budget_products(
        self,
        user_id: str
    ) -> list[Product]:
        """
        Obtiene productos dentro del presupuesto del usuario.

        Args:
            user_id: ID del usuario

        Returns:
            list[Product]: Lista de productos dentro del presupuesto
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.get_user_budget_products(user_id)
            result = await self.sparql_client.query(query)

            # Parsear productos
            products = self._parse_products(result)

            return products

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener productos en presupuesto: {str(e)}",
                {"user_id": user_id}
            )

    async def get_personalized_recommendations(
        self,
        user_id: str,
        category: Optional[str] = None,
        max_price: Optional[Decimal] = None,
        limit: int = 10
    ) -> list[Recommendation]:
        """
        Obtiene recomendaciones personalizadas con filtros adicionales.

        Args:
            user_id: ID del usuario
            category: Categoría específica (opcional)
            max_price: Precio máximo (opcional)
            limit: Límite de recomendaciones

        Returns:
            list[Recommendation]: Lista de recomendaciones filtradas
        """
        try:
            # Obtener recomendaciones base
            recommendations = await self.get_recommendations_for_user(
                user_id,
                limit=limit * 2  # Obtener más para filtrar
            )

            # Aplicar filtros adicionales
            filtered = []
            for rec in recommendations:
                # Filtro por categoría
                if category and rec.producto.categoria != category:
                    continue

                # Filtro por precio
                if max_price and rec.producto.precio > max_price:
                    continue

                filtered.append(rec)

                # Limitar resultados
                if len(filtered) >= limit:
                    break

            return filtered

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener recomendaciones personalizadas: {str(e)}",
                {"user_id": user_id, "category": category}
            )

    def _parse_recommendations(
        self,
        sparql_result: dict,
        user_id: str
    ) -> list[Recommendation]:
        """
        Parsea resultados SPARQL a entidades Recommendation.

        Args:
            sparql_result: Resultado de consulta SPARQL
            user_id: ID del usuario

        Returns:
            list[Recommendation]: Lista de recomendaciones parseadas
        """
        recommendations = []
        bindings = sparql_result.get("results", {}).get("bindings", [])

        for binding in bindings:
            try:
                # Extraer ID del URI
                uri = binding.get("producto", {}).get("value", "")
                product_id = self._extract_id_from_uri(uri)

                # Crear producto
                product = Product(
                    id=product_id,
                    nombre=binding.get("nombre", {}).get("value", ""),
                    precio=Decimal(binding.get("precio", {}).get("value", "0")),
                    uri=uri
                )

                # Crear recomendación
                razon = binding.get("razon", {}).get("value", "Recomendado")

                # Calcular score basado en la razón
                score = self._calculate_score_from_reason(razon)

                recommendation = Recommendation(
                    producto=product,
                    razon=razon,
                    score=score,
                    usuario_id=user_id
                )

                recommendations.append(recommendation)

            except (ValueError, KeyError):
                # Saltar recomendaciones con datos inválidos
                continue

        return recommendations

    def _parse_products(self, sparql_result: dict) -> list[Product]:
        """
        Parsea resultados SPARQL a entidades Product.

        Args:
            sparql_result: Resultado de consulta SPARQL

        Returns:
            list[Product]: Lista de productos parseados
        """
        products = []
        bindings = sparql_result.get("results", {}).get("bindings", [])

        for binding in bindings:
            try:
                # Extraer ID del URI
                uri = binding.get("producto", {}).get("value", "")
                product_id = self._extract_id_from_uri(uri)

                # Crear producto
                product = Product(
                    id=product_id,
                    nombre=binding.get("nombre", {}).get("value", ""),
                    precio=Decimal(binding.get("precio", {}).get("value", "0")),
                    uri=uri
                )

                products.append(product)

            except (ValueError, KeyError):
                # Saltar productos con datos inválidos
                continue

        return products

    def _calculate_score_from_reason(self, razon: str) -> float:
        """
        Calcula un score basado en la razón de recomendación.

        Args:
            razon: Razón de la recomendación

        Returns:
            float: Score (0.0 - 1.0)
        """
        # Mapear razones a scores
        score_map = {
            "Recomendado por perfil": 1.0,
            "Dentro de presupuesto": 0.8,
            "Categoría preferida": 0.6,
            "Similar a compras anteriores": 0.9,
        }

        # Buscar coincidencia parcial
        for key, score in score_map.items():
            if key.lower() in razon.lower():
                return score

        # Score por defecto
        return 0.5

    def _extract_id_from_uri(self, uri: str) -> str:
        """
        Extrae el ID de un URI.

        Args:
            uri: URI completo

        Returns:
            str: ID extraído
        """
        if "#" in uri:
            return uri.split("#")[-1]
        elif "/" in uri:
            return uri.split("/")[-1]
        return uri
