"""
Cargador de ontologías OWL usando owlready2.
Implementa el patrón Singleton para la ontología cargada.
"""
from typing import Optional
from pathlib import Path
import owlready2 as owl

from app.core.exceptions import (
    OntologyLoadError,
    OntologyNotFoundError,
    OntologyValidationError
)


class OntologyLoader:
    """
    Cargador y gestor de ontologías OWL.
    Implementa el Principio de Responsabilidad Única (SRP).
    """

    def __init__(
        self,
        ontology_path: str,
        base_uri: str = "http://smartcompare.com/ontologia#"
    ):
        """
        Inicializa el cargador de ontologías.

        Args:
            ontology_path: Ruta al archivo OWL
            base_uri: URI base de la ontología
        """
        self.ontology_path = Path(ontology_path)
        self.base_uri = base_uri
        self.ontology: Optional[owl.Ontology] = None
        self._loaded = False

    async def load(self) -> owl.Ontology:
        """
        Carga la ontología desde el archivo OWL.

        Returns:
            owl.Ontology: Ontología cargada

        Raises:
            OntologyNotFoundError: Si el archivo no existe
            OntologyLoadError: Si hay error al cargar
        """
        try:
            # Verificar que el archivo existe
            if not self.ontology_path.exists():
                raise OntologyNotFoundError(
                    f"Archivo de ontología no encontrado: {self.ontology_path}",
                    {"path": str(self.ontology_path)}
                )

            # Cargar ontología usando owlready2
            # Usar world para aislar la ontología
            world = owl.World()

            # Cargar el archivo OWL
            self.ontology = world.get_ontology(
                f"file://{self.ontology_path.absolute()}"
            ).load()

            self._loaded = True
            return self.ontology

        except FileNotFoundError as e:
            raise OntologyNotFoundError(
                f"Archivo de ontología no encontrado: {str(e)}",
                {"path": str(self.ontology_path)}
            )
        except Exception as e:
            raise OntologyLoadError(
                f"Error al cargar la ontología: {str(e)}",
                {"path": str(self.ontology_path)}
            )

    def is_loaded(self) -> bool:
        """
        Verifica si la ontología está cargada.

        Returns:
            bool: True si está cargada, False en caso contrario
        """
        return self._loaded and self.ontology is not None

    def get_ontology(self) -> owl.Ontology:
        """
        Obtiene la ontología cargada.

        Returns:
            owl.Ontology: Ontología cargada

        Raises:
            OntologyLoadError: Si la ontología no está cargada
        """
        if not self.is_loaded():
            raise OntologyLoadError(
                "La ontología no ha sido cargada. Llame a load() primero.",
                {}
            )
        return self.ontology

    def get_class(self, class_name: str) -> Optional[owl.ThingClass]:
        """
        Obtiene una clase de la ontología por su nombre.

        Args:
            class_name: Nombre de la clase (sin prefijo)

        Returns:
            owl.ThingClass: Clase encontrada o None
        """
        if not self.is_loaded():
            return None

        # Buscar la clase en el namespace
        namespace = self.ontology.get_namespace(self.base_uri)
        return getattr(namespace, class_name, None)

    def get_property(self, property_name: str) -> Optional[owl.PropertyClass]:
        """
        Obtiene una propiedad de la ontología por su nombre.

        Args:
            property_name: Nombre de la propiedad (sin prefijo)

        Returns:
            owl.PropertyClass: Propiedad encontrada o None
        """
        if not self.is_loaded():
            return None

        # Buscar la propiedad en el namespace
        namespace = self.ontology.get_namespace(self.base_uri)
        return getattr(namespace, property_name, None)

    def get_individual(self, individual_name: str) -> Optional[owl.Thing]:
        """
        Obtiene un individuo de la ontología por su nombre.

        Args:
            individual_name: Nombre del individuo (sin prefijo)

        Returns:
            owl.Thing: Individuo encontrado o None
        """
        if not self.is_loaded():
            return None

        # Buscar el individuo en el namespace
        namespace = self.ontology.get_namespace(self.base_uri)
        return getattr(namespace, individual_name, None)

    def search_classes(
        self,
        parent_class: Optional[str] = None,
        include_subclasses: bool = True
    ) -> list[owl.ThingClass]:
        """
        Busca clases en la ontología.

        Args:
            parent_class: Clase padre para filtrar (opcional)
            include_subclasses: Si se deben incluir subclases

        Returns:
            list[owl.ThingClass]: Lista de clases encontradas
        """
        if not self.is_loaded():
            return []

        if parent_class:
            parent = self.get_class(parent_class)
            if not parent:
                return []

            if include_subclasses:
                # Obtener todas las subclases (recursivamente)
                return list(parent.descendants())
            else:
                # Solo subclases directas
                return list(parent.subclasses())
        else:
            # Todas las clases definidas en la ontología
            return list(self.ontology.classes())

    def search_individuals(
        self,
        class_name: Optional[str] = None
    ) -> list[owl.Thing]:
        """
        Busca individuos en la ontología.

        Args:
            class_name: Clase para filtrar individuos (opcional)

        Returns:
            list[owl.Thing]: Lista de individuos encontrados
        """
        if not self.is_loaded():
            return []

        if class_name:
            cls = self.get_class(class_name)
            if not cls:
                return []
            # Obtener instancias de la clase
            return list(cls.instances())
        else:
            # Todos los individuos
            return list(self.ontology.individuals())

    def validate_ontology(self) -> bool:
        """
        Valida la consistencia de la ontología.

        Returns:
            bool: True si la ontología es consistente

        Raises:
            OntologyValidationError: Si la ontología es inconsistente
        """
        if not self.is_loaded():
            raise OntologyValidationError(
                "La ontología no está cargada",
                {}
            )

        try:
            # Intentar sincronizar con el reasoner
            # Esto detectará inconsistencias
            with self.ontology.get_namespace(self.base_uri):
                owl.sync_reasoner_pellet(
                    [self.ontology],
                    infer_property_values=False,
                    infer_data_property_values=False
                )
            return True

        except owl.OwlReadyInconsistentOntologyError as e:
            raise OntologyValidationError(
                f"La ontología es inconsistente: {str(e)}",
                {}
            )
        except Exception as e:
            raise OntologyValidationError(
                f"Error al validar la ontología: {str(e)}",
                {}
            )

    async def reload(self) -> owl.Ontology:
        """
        Recarga la ontología desde el archivo.

        Returns:
            owl.Ontology: Ontología recargada
        """
        self._loaded = False
        self.ontology = None
        return await self.load()

    def get_stats(self) -> dict:
        """
        Obtiene estadísticas de la ontología cargada.

        Returns:
            dict: Diccionario con estadísticas
        """
        if not self.is_loaded():
            return {
                "loaded": False,
                "classes": 0,
                "individuals": 0,
                "properties": 0
            }

        return {
            "loaded": True,
            "classes": len(list(self.ontology.classes())),
            "individuals": len(list(self.ontology.individuals())),
            "object_properties": len(list(self.ontology.object_properties())),
            "data_properties": len(list(self.ontology.data_properties())),
            "annotation_properties": len(list(self.ontology.annotation_properties())),
            "base_iri": self.ontology.base_iri
        }
