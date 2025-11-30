"""
Servicio de aplicación para análisis de mercado.
Implementa casos de uso relacionados con estadísticas y análisis.
"""
from decimal import Decimal

from app.infrastructure.sparql.client import SPARQLClient
from app.infrastructure.sparql.queries import MarketAnalysisQueries
from app.domain.entities import MarketStats, VendorStats
from app.core.exceptions import SPARQLQueryError


class AnalysisService:
    """
    Servicio de aplicación para análisis de mercado.
    Implementa el Principio de Responsabilidad Única (SRP).
    """

    def __init__(self, sparql_client: SPARQLClient):
        """
        Inicializa el servicio de análisis.

        Args:
            sparql_client: Cliente SPARQL para consultas
        """
        self.sparql_client = sparql_client
        self.queries = MarketAnalysisQueries()

    async def get_price_range_by_category(self) -> list[MarketStats]:
        """
        Obtiene estadísticas de precios por categoría.

        Returns:
            list[MarketStats]: Lista de estadísticas por categoría
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.get_price_range_by_category()
            result = await self.sparql_client.query(query)

            # Parsear resultados
            stats_list = []
            bindings = result.get("results", {}).get("bindings", [])

            for binding in bindings:
                try:
                    # Extraer categoría del URI
                    categoria_uri = binding.get("categoria", {}).get("value", "")
                    categoria = self._extract_name_from_uri(categoria_uri)

                    # Crear estadísticas
                    stats = MarketStats(
                        categoria=categoria,
                        precio_minimo=Decimal(
                            binding.get("precioMinimo", {}).get("value", "0")
                        ),
                        precio_maximo=Decimal(
                            binding.get("precioMaximo", {}).get("value", "0")
                        ),
                        precio_promedio=Decimal(
                            binding.get("precioPromedio", {}).get("value", "0")
                        ),
                        total_productos=int(
                            binding.get("totalProductos", {}).get("value", "0")
                        )
                    )

                    stats_list.append(stats)

                except (ValueError, KeyError):
                    # Saltar categorías con datos inválidos
                    continue

            return stats_list

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener estadísticas por categoría: {str(e)}",
                {}
            )

    async def get_vendor_statistics(self) -> list[VendorStats]:
        """
        Obtiene estadísticas por vendedor.

        Returns:
            list[VendorStats]: Lista de estadísticas por vendedor
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.get_vendor_statistics()
            result = await self.sparql_client.query(query)

            # Parsear resultados
            stats_list = []
            bindings = result.get("results", {}).get("bindings", [])

            for binding in bindings:
                try:
                    # Crear estadísticas
                    stats = VendorStats(
                        vendedor=binding.get("vendedor", {}).get("value", ""),
                        total_productos=int(
                            binding.get("totalProductos", {}).get("value", "0")
                        ),
                        precio_promedio=Decimal(
                            binding.get("precioPromedio", {}).get("value", "0")
                        ),
                        precio_minimo=Decimal(
                            binding.get("precioMinimo", {}).get("value", "0")
                        ),
                        precio_maximo=Decimal(
                            binding.get("precioMaximo", {}).get("value", "0")
                        )
                    )

                    stats_list.append(stats)

                except (ValueError, KeyError):
                    # Saltar vendedores con datos inválidos
                    continue

            return stats_list

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener estadísticas de vendedores: {str(e)}",
                {}
            )

    async def get_brand_comparison(self) -> list[dict]:
        """
        Obtiene comparación de marcas.

        Returns:
            list[dict]: Lista de estadísticas por marca
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.get_brand_comparison()
            result = await self.sparql_client.query(query)

            # Parsear resultados
            brands_list = []
            bindings = result.get("results", {}).get("bindings", [])

            for binding in bindings:
                try:
                    brands_list.append({
                        "marca": binding.get("marca", {}).get("value", ""),
                        "total_productos": int(
                            binding.get("totalProductos", {}).get("value", "0")
                        ),
                        "precio_promedio": Decimal(
                            binding.get("precioPromedio", {}).get("value", "0")
                        )
                    })

                except (ValueError, KeyError):
                    # Saltar marcas con datos inválidos
                    continue

            return brands_list

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener comparación de marcas: {str(e)}",
                {}
            )

    async def get_market_overview(self) -> dict:
        """
        Obtiene un resumen general del mercado.

        Returns:
            dict: Resumen con múltiples estadísticas
        """
        try:
            # Obtener todas las estadísticas en paralelo
            price_stats = await self.get_price_range_by_category()
            vendor_stats = await self.get_vendor_statistics()
            brand_stats = await self.get_brand_comparison()

            # Calcular totales
            total_categorias = len(price_stats)
            total_vendedores = len(vendor_stats)
            total_marcas = len(brand_stats)

            # Calcular promedio global de precios
            all_averages = [stat.precio_promedio for stat in price_stats]
            precio_promedio_global = (
                sum(all_averages) / len(all_averages)
                if all_averages
                else Decimal("0")
            )

            # Encontrar categoría con más productos
            categoria_top = max(
                price_stats,
                key=lambda x: x.total_productos,
                default=None
            )

            # Encontrar vendedor con más productos
            vendedor_top = max(
                vendor_stats,
                key=lambda x: x.total_productos,
                default=None
            )

            return {
                "total_categorias": total_categorias,
                "total_vendedores": total_vendedores,
                "total_marcas": total_marcas,
                "precio_promedio_global": precio_promedio_global,
                "categoria_top": {
                    "nombre": categoria_top.categoria,
                    "productos": categoria_top.total_productos
                } if categoria_top else None,
                "vendedor_top": {
                    "nombre": vendedor_top.vendedor,
                    "productos": vendedor_top.total_productos
                } if vendedor_top else None
            }

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener resumen del mercado: {str(e)}",
                {}
            )

    async def get_category_insights(self, categoria: str) -> dict:
        """
        Obtiene insights detallados de una categoría específica.

        Args:
            categoria: Nombre de la categoría

        Returns:
            dict: Insights de la categoría
        """
        try:
            # Obtener estadísticas de todas las categorías
            all_stats = await self.get_price_range_by_category()

            # Filtrar por categoría específica
            category_stat = next(
                (stat for stat in all_stats if stat.categoria == categoria),
                None
            )

            if not category_stat:
                return {
                    "categoria": categoria,
                    "encontrada": False
                }

            # Calcular percentil de precio
            all_averages = [stat.precio_promedio for stat in all_stats]
            sorted_averages = sorted(all_averages)
            percentil = (
                sorted_averages.index(category_stat.precio_promedio) /
                len(sorted_averages) * 100
            )

            return {
                "categoria": categoria,
                "encontrada": True,
                "precio_minimo": category_stat.precio_minimo,
                "precio_maximo": category_stat.precio_maximo,
                "precio_promedio": category_stat.precio_promedio,
                "rango_precio": category_stat.rango_precio,
                "total_productos": category_stat.total_productos,
                "percentil_precio": round(percentil, 2),
                "precio_competitivo": percentil < 50  # Bajo 50% es competitivo
            }

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener insights de categoría: {str(e)}",
                {"categoria": categoria}
            )

    def _extract_name_from_uri(self, uri: str) -> str:
        """
        Extrae el nombre de un URI.

        Args:
            uri: URI completo

        Returns:
            str: Nombre extraído
        """
        if "#" in uri:
            return uri.split("#")[-1]
        elif "/" in uri:
            return uri.split("/")[-1]
        return uri
