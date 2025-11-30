"""
Motor de razonamiento semántico usando Pellet o FaCT++.
Implementa el patrón Strategy para diferentes tipos de reasoners.
"""
from typing import Optional, Any, Literal
from datetime import datetime, timedelta
import owlready2 as owl
from functools import lru_cache

from app.core.exceptions import (
    ReasonerError,
    ReasonerTimeoutError,
    ReasonerInconsistencyError
)


class ReasonerEngine:
    """
    Motor de razonamiento para inferencias sobre la ontología.
    Implementa el Principio Abierto/Cerrado (OCP) permitiendo
    diferentes estrategias de razonamiento.
    """

    def __init__(
        self,
        ontology: owl.Ontology,
        reasoner_type: Literal["pellet", "hermit", "fact++"] = "pellet",
        cache_ttl: int = 300  # 5 minutos
    ):
        """
        Inicializa el motor de razonamiento.

        Args:
            ontology: Ontología sobre la cual razonar
            reasoner_type: Tipo de reasoner a usar
            cache_ttl: Tiempo de vida del caché en segundos
        """
        self.ontology = ontology
        self.reasoner_type = reasoner_type
        self.cache_ttl = cache_ttl
        self._last_reasoning_time: Optional[datetime] = None
        self._cache_valid = False

    async def run_inference(
        self,
        infer_properties: bool = True,
        infer_data_properties: bool = True,
        debug: bool = False
    ) -> bool:
        """
        Ejecuta el proceso de razonamiento sobre la ontología.

        Args:
            infer_properties: Inferir valores de object properties
            infer_data_properties: Inferir valores de data properties
            debug: Activar modo debug del reasoner

        Returns:
            bool: True si el razonamiento fue exitoso

        Raises:
            ReasonerError: Si hay error durante el razonamiento
            ReasonerInconsistencyError: Si se detectan inconsistencias
            ReasonerTimeoutError: Si el razonamiento excede el timeout
        """
        try:
            # Seleccionar función de razonamiento según el tipo
            if self.reasoner_type == "pellet":
                reasoner_func = owl.sync_reasoner_pellet
            elif self.reasoner_type == "hermit":
                reasoner_func = owl.sync_reasoner_hermit
            elif self.reasoner_type == "fact++":
                reasoner_func = owl.sync_reasoner_factpp
            else:
                raise ReasonerError(
                    f"Tipo de reasoner no soportado: {self.reasoner_type}",
                    {"reasoner_type": self.reasoner_type}
                )

            # Ejecutar razonamiento
            reasoner_func(
                [self.ontology],
                infer_property_values=infer_properties,
                infer_data_property_values=infer_data_properties,
                debug=debug
            )

            # Actualizar timestamp y caché
            self._last_reasoning_time = datetime.now()
            self._cache_valid = True

            return True

        except owl.OwlReadyInconsistentOntologyError as e:
            raise ReasonerInconsistencyError(
                f"La ontología es inconsistente: {str(e)}",
                {"reasoner": self.reasoner_type}
            )
        except TimeoutError as e:
            raise ReasonerTimeoutError(
                f"El razonamiento excedió el tiempo límite: {str(e)}",
                {"reasoner": self.reasoner_type}
            )
        except Exception as e:
            raise ReasonerError(
                f"Error durante el razonamiento: {str(e)}",
                {"reasoner": self.reasoner_type}
            )

    def is_cache_valid(self) -> bool:
        """
        Verifica si el caché de razonamiento es válido.

        Returns:
            bool: True si el caché es válido
        """
        if not self._cache_valid or not self._last_reasoning_time:
            return False

        # Verificar si ha pasado el TTL
        elapsed = datetime.now() - self._last_reasoning_time
        return elapsed.total_seconds() < self.cache_ttl

    async def ensure_reasoning(self) -> bool:
        """
        Asegura que el razonamiento esté actualizado.
        Si el caché es inválido, ejecuta razonamiento nuevo.

        Returns:
            bool: True si el razonamiento está actualizado
        """
        if not self.is_cache_valid():
            return await self.run_inference()
        return True

    def invalidate_cache(self):
        """
        Invalida el caché de razonamiento.
        Útil cuando se modifica la ontología.
        """
        self._cache_valid = False

    async def check_consistency(self) -> bool:
        """
        Verifica la consistencia de la ontología.

        Returns:
            bool: True si la ontología es consistente

        Raises:
            ReasonerInconsistencyError: Si hay inconsistencias
        """
        try:
            await self.run_inference(
                infer_properties=False,
                infer_data_properties=False
            )
            return True
        except ReasonerInconsistencyError:
            raise
        except Exception as e:
            raise ReasonerError(
                f"Error al verificar consistencia: {str(e)}",
                {}
            )

    def get_inferred_classes(self, individual_name: str) -> list[str]:
        """
        Obtiene las clases inferidas para un individuo.

        Args:
            individual_name: Nombre del individuo

        Returns:
            list[str]: Lista de nombres de clases inferidas
        """
        try:
            # Obtener el individuo
            namespace = self.ontology.get_namespace(
                "http://smartcompare.com/ontologia#"
            )
            individual = getattr(namespace, individual_name, None)

            if not individual:
                return []

            # Obtener clases inferidas (is_a después del razonamiento)
            inferred_classes = []
            for cls in individual.is_a:
                if isinstance(cls, owl.ThingClass):
                    inferred_classes.append(cls.name)

            return inferred_classes

        except Exception as e:
            raise ReasonerError(
                f"Error al obtener clases inferidas: {str(e)}",
                {"individual": individual_name}
            )

    def get_inferred_properties(
        self,
        individual_name: str,
        property_name: str
    ) -> list[Any]:
        """
        Obtiene los valores inferidos de una propiedad para un individuo.

        Args:
            individual_name: Nombre del individuo
            property_name: Nombre de la propiedad

        Returns:
            list[Any]: Lista de valores inferidos
        """
        try:
            # Obtener el individuo
            namespace = self.ontology.get_namespace(
                "http://smartcompare.com/ontologia#"
            )
            individual = getattr(namespace, individual_name, None)

            if not individual:
                return []

            # Obtener la propiedad
            prop = getattr(namespace, property_name, None)
            if not prop:
                return []

            # Obtener valores de la propiedad
            values = getattr(individual, property_name, [])

            # Convertir a lista si no lo es
            if not isinstance(values, list):
                values = [values]

            return values

        except Exception as e:
            raise ReasonerError(
                f"Error al obtener propiedades inferidas: {str(e)}",
                {"individual": individual_name, "property": property_name}
            )

    async def get_explanations(
        self,
        individual_name: str,
        class_name: str
    ) -> list[str]:
        """
        Obtiene explicaciones de por qué un individuo pertenece a una clase.

        Args:
            individual_name: Nombre del individuo
            class_name: Nombre de la clase

        Returns:
            list[str]: Lista de explicaciones textuales
        """
        try:
            # Esta funcionalidad requiere un reasoner con soporte para explicaciones
            # Por ahora, retornamos explicación básica

            # Asegurar que el razonamiento está actualizado
            await self.ensure_reasoning()

            namespace = self.ontology.get_namespace(
                "http://smartcompare.com/ontologia#"
            )

            individual = getattr(namespace, individual_name, None)
            cls = getattr(namespace, class_name, None)

            if not individual or not cls:
                return []

            explanations = []

            # Verificar si es miembro directo
            if cls in individual.is_a:
                explanations.append(
                    f"{individual_name} es directamente de tipo {class_name}"
                )

            # Verificar propiedades que podrían inferir la membresía
            for prop in individual.get_properties():
                values = getattr(individual, prop.name, [])
                if values:
                    explanations.append(
                        f"{individual_name} tiene {prop.name} = {values}"
                    )

            return explanations

        except Exception as e:
            raise ReasonerError(
                f"Error al obtener explicaciones: {str(e)}",
                {"individual": individual_name, "class": class_name}
            )

    def get_stats(self) -> dict:
        """
        Obtiene estadísticas del motor de razonamiento.

        Returns:
            dict: Diccionario con estadísticas
        """
        return {
            "reasoner_type": self.reasoner_type,
            "cache_ttl": self.cache_ttl,
            "cache_valid": self.is_cache_valid(),
            "last_reasoning": (
                self._last_reasoning_time.isoformat()
                if self._last_reasoning_time
                else None
            )
        }
