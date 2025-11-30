"""
Entidades del dominio del marketplace.
Representan conceptos de negocio siguiendo Domain-Driven Design (DDD).
"""
from typing import Optional, Any
from dataclasses import dataclass, field
from decimal import Decimal
from datetime import datetime


@dataclass
class Product:
    """
    Entidad Producto - Representa un producto en el marketplace.
    Implementa el Principio de Responsabilidad Única (SRP).
    """
    id: str
    nombre: str
    precio: Decimal
    descripcion: Optional[str] = None
    stock: Optional[int] = None
    categoria: Optional[str] = None
    marca: Optional[str] = None
    vendedor: Optional[str] = None
    especificaciones: dict[str, Any] = field(default_factory=dict)
    uri: Optional[str] = None

    def __post_init__(self):
        """Validaciones post-inicialización."""
        if self.precio < 0:
            raise ValueError("El precio no puede ser negativo")
        if self.stock is not None and self.stock < 0:
            raise ValueError("El stock no puede ser negativo")

    @property
    def disponible(self) -> bool:
        """Verifica si el producto está disponible."""
        return self.stock is None or self.stock > 0

    def actualizar_precio(self, nuevo_precio: Decimal):
        """
        Actualiza el precio del producto.

        Args:
            nuevo_precio: Nuevo precio del producto
        """
        if nuevo_precio < 0:
            raise ValueError("El precio no puede ser negativo")
        self.precio = nuevo_precio

    def actualizar_stock(self, nuevo_stock: int):
        """
        Actualiza el stock del producto.

        Args:
            nuevo_stock: Nuevo stock del producto
        """
        if nuevo_stock < 0:
            raise ValueError("El stock no puede ser negativo")
        self.stock = nuevo_stock


@dataclass
class ProductComparison:
    """
    Entidad que representa una comparación entre productos.
    """
    productos: list[Product]
    criterios: list[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        """Validaciones post-inicialización."""
        if len(self.productos) < 2:
            raise ValueError("Se requieren al menos 2 productos para comparar")

    def obtener_mejor_precio(self) -> Product:
        """
        Obtiene el producto con el mejor precio.

        Returns:
            Product: Producto con el precio más bajo
        """
        return min(self.productos, key=lambda p: p.precio)

    def obtener_diferencias(self) -> dict[str, list[Any]]:
        """
        Obtiene las diferencias entre productos.

        Returns:
            dict: Diccionario con las diferencias por criterio
        """
        diferencias = {}

        # Comparar especificaciones
        all_keys = set()
        for producto in self.productos:
            all_keys.update(producto.especificaciones.keys())

        for key in all_keys:
            valores = [
                producto.especificaciones.get(key)
                for producto in self.productos
            ]
            # Solo agregar si hay diferencias
            if len(set(str(v) for v in valores)) > 1:
                diferencias[key] = valores

        return diferencias


@dataclass
class User:
    """
    Entidad Usuario - Representa un usuario del marketplace.
    """
    id: str
    nombre: str
    email: str
    presupuesto_maximo: Optional[Decimal] = None
    categorias_preferidas: list[str] = field(default_factory=list)
    historial_compras: list[str] = field(default_factory=list)
    uri: Optional[str] = None

    def agregar_compra(self, producto_id: str):
        """
        Agrega un producto al historial de compras.

        Args:
            producto_id: ID del producto comprado
        """
        if producto_id not in self.historial_compras:
            self.historial_compras.append(producto_id)

    def agregar_categoria_preferida(self, categoria: str):
        """
        Agrega una categoría a las preferidas.

        Args:
            categoria: Nombre de la categoría
        """
        if categoria not in self.categorias_preferidas:
            self.categorias_preferidas.append(categoria)

    def puede_pagar(self, precio: Decimal) -> bool:
        """
        Verifica si el usuario puede pagar un producto.

        Args:
            precio: Precio del producto

        Returns:
            bool: True si puede pagar, False en caso contrario
        """
        if self.presupuesto_maximo is None:
            return True
        return precio <= self.presupuesto_maximo


@dataclass
class Recommendation:
    """
    Entidad Recomendación - Representa una recomendación de producto.
    """
    producto: Product
    razon: str
    score: Optional[float] = None
    usuario_id: Optional[str] = None

    def __lt__(self, other: 'Recommendation') -> bool:
        """Permite ordenar recomendaciones por score."""
        if self.score is None:
            return False
        if other.score is None:
            return True
        return self.score > other.score  # Mayor score primero


@dataclass
class MarketStats:
    """
    Entidad que representa estadísticas del mercado.
    """
    categoria: str
    precio_minimo: Decimal
    precio_maximo: Decimal
    precio_promedio: Decimal
    total_productos: int

    @property
    def rango_precio(self) -> Decimal:
        """Calcula el rango de precios."""
        return self.precio_maximo - self.precio_minimo


@dataclass
class VendorStats:
    """
    Entidad que representa estadísticas de un vendedor.
    """
    vendedor: str
    total_productos: int
    precio_promedio: Decimal
    precio_minimo: Decimal
    precio_maximo: Decimal

    @property
    def precio_competitivo(self) -> bool:
        """
        Verifica si el vendedor tiene precios competitivos.
        Se considera competitivo si el promedio está en el 40% inferior del rango.
        """
        rango = self.precio_maximo - self.precio_minimo
        if rango == 0:
            return True
        posicion = (self.precio_promedio - self.precio_minimo) / rango
        return posicion <= 0.4
