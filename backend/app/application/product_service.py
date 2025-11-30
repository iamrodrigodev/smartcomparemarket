"""
Servicio de aplicación para gestión de productos.
Implementa casos de uso relacionados con productos.
"""
from typing import Optional
from decimal import Decimal

from app.infrastructure.sparql.client import SPARQLClient
from app.infrastructure.sparql.queries import ProductQueries
from app.infrastructure.reasoner.engine import ReasonerEngine
from app.domain.entities import Product
from app.domain.schemas import ProductSearchParams
from app.core.exceptions import ProductNotFoundException, SPARQLQueryError


class ProductService:
    """
    Servicio de aplicación para productos.
    Implementa el Principio de Responsabilidad Única (SRP).
    """

    def __init__(
        self,
        sparql_client: SPARQLClient,
        reasoner: Optional[ReasonerEngine] = None
    ):
        """
        Inicializa el servicio de productos.

        Args:
            sparql_client: Cliente SPARQL para consultas
            reasoner: Motor de razonamiento (opcional)
        """
        self.sparql_client = sparql_client
        self.reasoner = reasoner
        self.queries = ProductQueries()

    async def get_all_products(
        self,
        limit: int = 20,
        offset: int = 0
    ) -> list[Product]:
        """
        Obtiene todos los productos con paginación.

        Args:
            limit: Límite de resultados
            offset: Offset para paginación

        Returns:
            list[Product]: Lista de productos
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.get_all_products(limit, offset)
            result = await self.sparql_client.query(query)

            # Transformar resultados a entidades
            products = self._parse_products(result)

            return products

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener productos: {str(e)}",
                {"limit": limit, "offset": offset}
            )

    async def get_product_by_id(self, product_id: str) -> Product:
        """
        Obtiene un producto por su ID.

        Args:
            product_id: ID del producto

        Returns:
            Product: Producto encontrado

        Raises:
            ProductNotFoundException: Si el producto no existe
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.get_product_by_id(product_id)
            result = await self.sparql_client.query(query)

            # Verificar si se encontró el producto
            bindings = result.get("results", {}).get("bindings", [])
            if not bindings:
                raise ProductNotFoundException(
                    f"Producto no encontrado: {product_id}",
                    {"product_id": product_id}
                )

            # Construir producto desde las propiedades
            product = self._build_product_from_properties(
                product_id,
                bindings
            )

            return product

        except ProductNotFoundException:
            raise
        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener producto: {str(e)}",
                {"product_id": product_id}
            )

    async def search_products(
        self,
        search_params: ProductSearchParams,
        limit: int = 20,
        offset: int = 0
    ) -> list[Product]:
        """
        Busca productos con filtros.

        Args:
            search_params: Parámetros de búsqueda
            limit: Límite de resultados
            offset: Offset para paginación

        Returns:
            list[Product]: Lista de productos que coinciden
        """
        try:
            # Ejecutar consulta SPARQL con filtros
            query = self.queries.search_products(
                category=search_params.categoria,
                min_price=float(search_params.min_precio) if search_params.min_precio else None,
                max_price=float(search_params.max_precio) if search_params.max_precio else None,
                marca=search_params.marca,
                keyword=search_params.keyword,
                limit=limit,
                offset=offset
            )

            result = await self.sparql_client.query(query)

            # Transformar resultados a entidades
            products = self._parse_products(result)

            return products

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al buscar productos: {str(e)}",
                {"search_params": search_params.model_dump()}
            )

    async def get_similar_products(
        self,
        product_id: str,
        limit: int = 5
    ) -> list[Product]:
        """
        Obtiene productos similares usando relaciones semánticas.

        Args:
            product_id: ID del producto de referencia
            limit: Límite de resultados

        Returns:
            list[Product]: Lista de productos similares
        """
        try:
            # Habilitar razonamiento si está disponible
            use_reasoning = self.reasoner is not None
            if use_reasoning:
                await self.reasoner.ensure_reasoning()

            # Ejecutar consulta SPARQL
            query = self.queries.get_similar_products(product_id, limit)
            result = await self.sparql_client.query(
                query,
                reasoning=use_reasoning
            )

            # Transformar resultados a entidades
            products = self._parse_products(result)

            return products

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener productos similares: {str(e)}",
                {"product_id": product_id}
            )

    async def get_compatible_products(
        self,
        product_id: str
    ) -> list[Product]:
        """
        Obtiene productos compatibles.

        Args:
            product_id: ID del producto de referencia

        Returns:
            list[Product]: Lista de productos compatibles
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.get_compatible_products(product_id)
            result = await self.sparql_client.query(query)

            # Transformar resultados a entidades
            products = self._parse_products(result)

            return products

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener productos compatibles: {str(e)}",
                {"product_id": product_id}
            )

    async def get_incompatible_products(
        self,
        product_id: str
    ) -> list[dict]:
        """
        Obtiene productos incompatibles con razones.

        Args:
            product_id: ID del producto de referencia

        Returns:
            list[dict]: Lista de productos incompatibles con razones
        """
        try:
            # Ejecutar consulta SPARQL
            query = self.queries.get_incompatible_products(product_id)
            result = await self.sparql_client.query(query)

            # Transformar resultados
            incompatibles = []
            bindings = result.get("results", {}).get("bindings", [])

            for binding in bindings:
                incompatibles.append({
                    "producto_id": self._extract_id_from_uri(
                        binding.get("incompatible", {}).get("value", "")
                    ),
                    "nombre": binding.get("nombre", {}).get("value", ""),
                    "razon": binding.get("razon", {}).get("value", "No especificada")
                })

            return incompatibles

        except Exception as e:
            raise SPARQLQueryError(
                f"Error al obtener productos incompatibles: {str(e)}",
                {"product_id": product_id}
            )

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
                    descripcion=binding.get("descripcion", {}).get("value"),
                    stock=int(binding.get("stock", {}).get("value", 0)) if binding.get("stock") else None,
                    categoria=binding.get("categoria", {}).get("value"),
                    marca=binding.get("marca", {}).get("value"),
                    vendedor=binding.get("vendedor", {}).get("value"),
                    uri=uri
                )

                products.append(product)

            except (ValueError, KeyError) as e:
                # Saltar productos con datos inválidos
                continue

        return products

    def _build_product_from_properties(
        self,
        product_id: str,
        bindings: list[dict]
    ) -> Product:
        """
        Construye un producto desde propiedades SPARQL.

        Args:
            product_id: ID del producto
            bindings: Bindings de propiedades del producto

        Returns:
            Product: Producto construido
        """
        # Diccionario para almacenar propiedades
        props = {}
        specs = {}

        # Procesar cada propiedad
        for binding in bindings:
            prop_uri = binding.get("propiedad", {}).get("value", "")
            prop_name = prop_uri.split("#")[-1] if "#" in prop_uri else prop_uri
            value = binding.get("valor", {}).get("value", "")

            # Mapear propiedades conocidas
            if prop_name == "tieneNombre":
                props["nombre"] = value
            elif prop_name == "tienePrecio":
                props["precio"] = Decimal(value)
            elif prop_name == "tieneDescripcion":
                props["descripcion"] = value
            elif prop_name == "tieneStock":
                props["stock"] = int(value)
            else:
                # Almacenar como especificación
                specs[prop_name] = value

        # Crear producto con valores por defecto si faltan
        return Product(
            id=product_id,
            nombre=props.get("nombre", f"Producto {product_id}"),
            precio=props.get("precio", Decimal("0")),
            descripcion=props.get("descripcion"),
            stock=props.get("stock"),
            especificaciones=specs,
            uri=f"http://smartcompare.com/ontologia#{product_id}"
        )

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
