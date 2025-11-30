"""
Consultas SPARQL predefinidas para el marketplace.
Implementa el patrón Query Object para encapsular consultas complejas.
"""
from typing import Optional


class ProductQueries:
    """Consultas SPARQL relacionadas con productos."""

    @staticmethod
    def get_all_products(limit: int = 20, offset: int = 0) -> str:
        """
        Obtiene todos los productos con sus propiedades básicas.

        Args:
            limit: Límite de resultados
            offset: Offset para paginación

        Returns:
            str: Consulta SPARQL
        """
        return f"""
SELECT DISTINCT ?producto ?nombre ?precio ?descripcion ?stock ?marca ?vendedor
WHERE {{
    ?producto rdf:type/rdfs:subClassOf* sc:Producto .
    ?producto sc:tieneNombre ?nombre .
    ?producto sc:tienePrecio ?precio .

    OPTIONAL {{ ?producto sc:tieneDescripcion ?descripcion }}
    OPTIONAL {{ ?producto sc:tieneStock ?stock }}
    OPTIONAL {{
        ?producto sc:tieneMarca ?marcaUri .
        ?marcaUri sc:tieneNombre ?marca .
    }}
    OPTIONAL {{
        ?producto sc:vendidoPor ?vendedorUri .
        ?vendedorUri sc:tieneNombre ?vendedor .
    }}
}}
ORDER BY ?nombre
LIMIT {limit}
OFFSET {offset}
"""

    @staticmethod
    def get_product_by_id(product_id: str) -> str:
        """
        Obtiene un producto específico con todas sus propiedades.

        Args:
            product_id: ID del producto

        Returns:
            str: Consulta SPARQL
        """
        return f"""
SELECT ?propiedad ?valor
WHERE {{
    sc:{product_id} ?propiedad ?valor .
}}
"""

    @staticmethod
    def search_products(
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        marca: Optional[str] = None,
        keyword: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> str:
        """
        Búsqueda de productos con filtros semánticos.

        Args:
            category: Categoría de producto
            min_price: Precio mínimo
            max_price: Precio máximo
            marca: Marca del producto
            keyword: Palabra clave en nombre o descripción
            limit: Límite de resultados
            offset: Offset para paginación

        Returns:
            str: Consulta SPARQL
        """
        filters = []

        # Filtro por categoría (con jerarquía)
        if category:
            filters.append(f"?producto rdf:type/rdfs:subClassOf* sc:{category} .")

        # Filtro por precio mínimo
        if min_price is not None:
            filters.append(f"FILTER(?precio >= {min_price})")

        # Filtro por precio máximo
        if max_price is not None:
            filters.append(f"FILTER(?precio <= {max_price})")

        # Filtro por marca
        if marca:
            filters.append(f"""
                ?producto sc:tieneMarca ?marcaUri .
                ?marcaUri sc:tieneNombre "{marca}" .
            """)

        # Filtro por palabra clave
        if keyword:
            filters.append(f"""
                {{
                    ?producto sc:tieneNombre ?nombre .
                    FILTER(CONTAINS(LCASE(?nombre), "{keyword.lower()}"))
                }}
                UNION
                {{
                    ?producto sc:tieneDescripcion ?desc .
                    FILTER(CONTAINS(LCASE(?desc), "{keyword.lower()}"))
                }}
            """)

        filter_clause = "\n    ".join(filters) if filters else ""

        return f"""
SELECT DISTINCT ?producto ?nombre ?precio ?stock ?marca ?vendedor ?categoria
WHERE {{
    ?producto rdf:type ?categoria .
    ?producto rdf:type/rdfs:subClassOf* sc:Producto .
    ?producto sc:tieneNombre ?nombre .
    ?producto sc:tienePrecio ?precio .

    {filter_clause}

    OPTIONAL {{ ?producto sc:tieneStock ?stock }}
    OPTIONAL {{
        ?producto sc:tieneMarca ?marcaUri .
        ?marcaUri sc:tieneNombre ?marca .
    }}
    OPTIONAL {{
        ?producto sc:vendidoPor ?vendedorUri .
        ?vendedorUri sc:tieneNombre ?vendedor .
    }}
}}
ORDER BY ?precio
LIMIT {limit}
OFFSET {offset}
"""

    @staticmethod
    def get_similar_products(product_id: str, limit: int = 5) -> str:
        """
        Obtiene productos similares usando la propiedad esSimilarA.

        Args:
            product_id: ID del producto
            limit: Límite de resultados

        Returns:
            str: Consulta SPARQL
        """
        return f"""
SELECT DISTINCT ?similar ?nombre ?precio ?marca
WHERE {{
    {{
        sc:{product_id} sc:esSimilarA ?similar .
    }}
    UNION
    {{
        ?similar sc:esSimilarA sc:{product_id} .
    }}
    UNION
    {{
        sc:{product_id} sc:esEquivalenteTecnico ?similar .
    }}

    ?similar sc:tieneNombre ?nombre .
    ?similar sc:tienePrecio ?precio .

    OPTIONAL {{
        ?similar sc:tieneMarca ?marcaUri .
        ?marcaUri sc:tieneNombre ?marca .
    }}
}}
LIMIT {limit}
"""

    @staticmethod
    def get_compatible_products(product_id: str) -> str:
        """
        Obtiene productos compatibles.

        Args:
            product_id: ID del producto

        Returns:
            str: Consulta SPARQL
        """
        return """
SELECT DISTINCT ?compatible ?nombre ?precio
WHERE {
    {
        sc:""" + product_id + """ sc:esCompatibleCon ?compatible .
    }
    UNION
    {
        ?compatible sc:esCompatibleCon sc:""" + product_id + """ .
    }

    ?compatible sc:tieneNombre ?nombre .
    ?compatible sc:tienePrecio ?precio .
}
"""

    @staticmethod
    def get_incompatible_products(product_id: str) -> str:
        """
        Obtiene productos incompatibles.

        Args:
            product_id: ID del producto

        Returns:
            str: Consulta SPARQL
        """
        return """
SELECT DISTINCT ?incompatible ?nombre ?razon
WHERE {
    {
        sc:""" + product_id + """ sc:incompatibleCon ?incompatible .
    }
    UNION
    {
        ?incompatible sc:incompatibleCon sc:""" + product_id + """ .
    }

    ?incompatible sc:tieneNombre ?nombre .

    OPTIONAL {
        sc:""" + product_id + """ sc:tieneSistemaOperativo ?so1 .
        ?incompatible sc:tieneSistemaOperativo ?so2 .
        FILTER(?so1 != ?so2)
        BIND("Sistema operativo diferente" AS ?razon)
    }
}
"""


class ComparisonQueries:
    """Consultas SPARQL para comparación de productos."""

    @staticmethod
    def compare_products(product_ids: list[str]) -> str:
        """
        Compara múltiples productos mostrando sus especificaciones.

        Args:
            product_ids: Lista de IDs de productos a comparar

        Returns:
            str: Consulta SPARQL
        """
        # Crear VALUES clause con los productos
        products_values = " ".join([f"sc:{pid}" for pid in product_ids])

        return f"""
SELECT ?producto ?nombre ?precio ?ram ?almacenamiento ?pulgadas ?procesador ?so
WHERE {{
    VALUES ?producto {{ {products_values} }}

    ?producto sc:tieneNombre ?nombre .
    ?producto sc:tienePrecio ?precio .

    OPTIONAL {{ ?producto sc:tieneRAM_GB ?ram }}
    OPTIONAL {{ ?producto sc:tieneAlmacenamiento_GB ?almacenamiento }}
    OPTIONAL {{ ?producto sc:tienePulgadas ?pulgadas }}
    OPTIONAL {{ ?producto sc:procesadorModelo ?procesador }}
    OPTIONAL {{
        ?producto sc:tieneSistemaOperativo ?soUri .
        ?soUri sc:tieneNombre ?so .
    }}
}}
"""

    @staticmethod
    def find_best_value_in_category(category: str, limit: int = 10) -> str:
        """
        Encuentra productos con mejor relación calidad-precio en una categoría.

        Args:
            category: Categoría de producto
            limit: Límite de resultados

        Returns:
            str: Consulta SPARQL
        """
        return f"""
SELECT ?producto ?nombre ?precio ?ram ?almacenamiento
    ((?ram + ?almacenamiento) / ?precio AS ?valorScore)
WHERE {{
    ?producto rdf:type/rdfs:subClassOf* sc:{category} .
    ?producto sc:tieneNombre ?nombre .
    ?producto sc:tienePrecio ?precio .
    ?producto sc:tieneRAM_GB ?ram .
    ?producto sc:tieneAlmacenamiento_GB ?almacenamiento .

    FILTER(?precio > 0)
}}
ORDER BY DESC(?valorScore)
LIMIT {limit}
"""


class RecommendationQueries:
    """Consultas SPARQL para recomendaciones."""

    @staticmethod
    def get_recommendations_for_user(user_id: str, limit: int = 10) -> str:
        """
        Obtiene recomendaciones para un usuario basadas en reglas SWRL.

        Args:
            user_id: ID del usuario
            limit: Límite de resultados

        Returns:
            str: Consulta SPARQL
        """
        return f"""
SELECT DISTINCT ?producto ?nombre ?precio ?razon
WHERE {{
    {{
        # Productos recomendados por reglas SWRL
        ?producto sc:esRecomendadoPara sc:{user_id} .
        BIND("Recomendado por perfil" AS ?razon)
    }}
    UNION
    {{
        # Productos dentro del presupuesto
        ?producto sc:estaDentroPresupuesto sc:{user_id} .
        BIND("Dentro de presupuesto" AS ?razon)
    }}
    UNION
    {{
        # Productos de categorías preferidas
        sc:{user_id} sc:prefiereCategoria ?categoria .
        ?producto rdf:type/rdfs:subClassOf* ?categoria .
        BIND("Categoría preferida" AS ?razon)
    }}

    ?producto sc:tieneNombre ?nombre .
    ?producto sc:tienePrecio ?precio .
}}
LIMIT {limit}
"""

    @staticmethod
    def get_user_budget_products(user_id: str) -> str:
        """
        Obtiene productos dentro del presupuesto del usuario.

        Args:
            user_id: ID del usuario

        Returns:
            str: Consulta SPARQL
        """
        return f"""
SELECT ?producto ?nombre ?precio
WHERE {{
    sc:{user_id} sc:presupuestoMaximo ?presupuesto .

    ?producto rdf:type/rdfs:subClassOf* sc:Producto .
    ?producto sc:tieneNombre ?nombre .
    ?producto sc:tienePrecio ?precio .

    FILTER(?precio <= ?presupuesto)
}}
ORDER BY DESC(?precio)
"""


class MarketAnalysisQueries:
    """Consultas SPARQL para análisis de mercado."""

    @staticmethod
    def get_price_range_by_category() -> str:
        """
        Obtiene rango de precios por categoría.

        Returns:
            str: Consulta SPARQL
        """
        return """
SELECT ?categoria
    (MIN(?precio) AS ?precioMinimo)
    (MAX(?precio) AS ?precioMaximo)
    (AVG(?precio) AS ?precioPromedio)
    (COUNT(?producto) AS ?totalProductos)
WHERE {
    ?producto rdf:type ?categoria .
    ?categoria rdfs:subClassOf* sc:Producto .
    ?producto sc:tienePrecio ?precio .
}
GROUP BY ?categoria
ORDER BY DESC(?totalProductos)
"""

    @staticmethod
    def get_vendor_statistics() -> str:
        """
        Obtiene estadísticas por vendedor.

        Returns:
            str: Consulta SPARQL
        """
        return """
SELECT ?vendedor
    (COUNT(?producto) AS ?totalProductos)
    (AVG(?precio) AS ?precioPromedio)
    (MIN(?precio) AS ?precioMinimo)
    (MAX(?precio) AS ?precioMaximo)
WHERE {
    ?producto sc:vendidoPor ?vendedorUri .
    ?vendedorUri sc:tieneNombre ?vendedor .
    ?producto sc:tienePrecio ?precio .
}
GROUP BY ?vendedor
ORDER BY DESC(?totalProductos)
"""

    @staticmethod
    def get_brand_comparison() -> str:
        """
        Compara marcas por precio y cantidad de productos.

        Returns:
            str: Consulta SPARQL
        """
        return """
SELECT ?marca
    (COUNT(?producto) AS ?totalProductos)
    (AVG(?precio) AS ?precioPromedio)
WHERE {
    ?producto sc:tieneMarca ?marcaUri .
    ?marcaUri sc:tieneNombre ?marca .
    ?producto sc:tienePrecio ?precio .
}
GROUP BY ?marca
HAVING (COUNT(?producto) > 0)
ORDER BY DESC(?totalProductos)
"""
