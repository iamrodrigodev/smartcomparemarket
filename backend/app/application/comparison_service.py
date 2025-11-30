"""
Servicio de aplicación para comparación de productos.
Implementa casos de uso relacionados con comparaciones.
"""
from typing import Optional
from decimal import Decimal

from app.infrastructure.sparql.client import SPARQLClient
from app.infrastructure.sparql.queries import ComparisonQueries
from app.domain.entities import Product, ProductComparison
from app.core.exceptions import SPARQLQueryError, ProductNotFoundException
from app.application.product_service import ProductService


class ComparisonService:
    """
    Servicio de aplicación para comparación de productos.
    Implementa el Principio de Responsabilidad Única (SRP).
    """

    def __init__(
        self,
        sparql_client: SPARQLClient,
        product_service: ProductService
    ):
        """
        Inicializa el servicio de comparación.

        Args:
            sparql_client: Cliente SPARQL para consultas
            product_service: Servicio de productos
        """
        self.sparql_client = sparql_client
        self.product_service = product_service
        self.queries = ComparisonQueries()

    async def compare_products(
        self,
        product_ids: list[str]
    ) -> ProductComparison:
        """
        Compara múltiples productos.

        Args:
            product_ids: Lista de IDs de productos a comparar

        Returns:
            ProductComparison: Comparación de productos

        Raises:
            ProductNotFoundException: Si algún producto no existe
        """
        if len(product_ids) < 2:
            raise ValueError("Se requieren al menos 2 productos para comparar")

        try:
            # Ejecutar consulta SPARQL para comparación
            query = self.queries.compare_products(product_ids)
            result = await self.sparql_client.query(query)

            # Parsear productos
            products = self._parse_comparison_products(result)

            # Verificar que se encontraron todos los productos
            if len(products) != len(product_ids):
                found_ids = {p.id for p in products}
                missing_ids = set(product_ids) - found_ids
                raise ProductNotFoundException(
                    f"Productos no encontrados: {', '.join(missing_ids)}",
                    {"missing_ids": list(missing_ids)}
                )

            # Crear comparación
            comparison = ProductComparison(productos=products)

            return comparison

        except ProductNotFoundException:
            raise
        except Exception as e:
            raise SPARQLQueryError(
                f"Error al comparar productos: {str(e)}",
                {"product_ids": product_ids}
            )

    async def find_best_value_in_category(
        self,
        category: str,
        limit: int = 10
    ) -> list[dict]:
        """
        Encuentra productos con mejor relación calidad-precio.

        Args:
            category: Categoría de producto
            limit: Límite de resultados

        Returns:
            list[dict]: Lista de productos con score de valor
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.find_best_value_in_category(category, limit)
            result = await self.sparql_client.query(query)

            # Parsear resultados
            products_with_score = []
            bindings = result.get("results", {}).get("bindings", [])

            for binding in bindings:
                uri = binding.get("producto", {}).get("value", "")
                product_id = self._extract_id_from_uri(uri)

                products_with_score.append({
                    "id": product_id,
                    "nombre": binding.get("nombre", {}).get("value", ""),
                    "precio": Decimal(binding.get("precio", {}).get("value", "0")),
                    "ram": int(binding.get("ram", {}).get("value", "0")),
                    "almacenamiento": int(binding.get("almacenamiento", {}).get("value", "0")),
                    "valor_score": float(binding.get("valorScore", {}).get("value", "0"))
                })

            return products_with_score

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al buscar mejor valor: {str(e)}",
                {"category": category}
            )

    async def compare_by_specifications(
        self,
        product_ids: list[str],
        specifications: list[str]
    ) -> dict[str, dict]:
        """
        Compara productos por especificaciones específicas.

        Args:
            product_ids: Lista de IDs de productos
            specifications: Lista de especificaciones a comparar

        Returns:
            dict: Comparación estructurada por especificación
        """
        try:
            # Obtener productos completos
            products = []
            for product_id in product_ids:
                product = await self.product_service.get_product_by_id(product_id)
                products.append(product)

            # Construir comparación por especificaciones
            comparison_result = {}

            for spec in specifications:
                comparison_result[spec] = {}
                for product in products:
                    value = product.especificaciones.get(spec)
                    comparison_result[spec][product.id] = value

            return comparison_result

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al comparar especificaciones: {str(e)}",
                {"product_ids": product_ids, "specifications": specifications}
            )

    def _parse_comparison_products(self, sparql_result: dict) -> list[Product]:
        """
        Parsea resultados SPARQL de comparación a entidades Product.

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

                # Crear especificaciones
                specs = {}
                if binding.get("ram"):
                    specs["ram_gb"] = int(binding["ram"]["value"])
                if binding.get("almacenamiento"):
                    specs["almacenamiento_gb"] = int(binding["almacenamiento"]["value"])
                if binding.get("pulgadas"):
                    specs["pulgadas"] = float(binding["pulgadas"]["value"])
                if binding.get("procesador"):
                    specs["procesador"] = binding["procesador"]["value"]
                if binding.get("so"):
                    specs["sistema_operativo"] = binding["so"]["value"]

                # Crear producto
                product = Product(
                    id=product_id,
                    nombre=binding.get("nombre", {}).get("value", ""),
                    precio=Decimal(binding.get("precio", {}).get("value", "0")),
                    especificaciones=specs,
                    uri=uri
                )

                products.append(product)

            except (ValueError, KeyError):
                # Saltar productos con datos inválidos
                continue

        return products

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
