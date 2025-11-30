#!/bin/bash

# Configuración
GRAPHDB_URL="http://graphdb:7200"
REPO_ID="smartcomparemarket"
CONFIG_FILE="/opt/graphdb-config/repo-config.ttl"
ONTOLOGY_FILE="/ontologies/SmartCompareMarket.owl"
DATA_FILE="/opt/graphdb-config/data.ttl"

echo "Esperando a que GraphDB inicie..."
until curl -s "$GRAPHDB_URL/rest/repositories" > /dev/null; do
  echo "   GraphDB no está listo aún. Reintentando en 5s..."
  sleep 5
done
echo "GraphDB está en línea."

# Verificar si el repositorio existe
if curl -s "$GRAPHDB_URL/rest/repositories" | grep -q "$REPO_ID"; then
  echo "El repositorio '$REPO_ID' ya existe."
else
  echo "Creando repositorio '$REPO_ID'..."
  # Crear repositorio usando el archivo de configuración
  curl -X POST \
    -H "Content-Type: multipart/form-data" \
    -F "config=@$CONFIG_FILE" \
    "$GRAPHDB_URL/rest/repositories"
  
  if [ $? -eq 0 ]; then
    echo "Repositorio creado exitosamente."
  else
    echo "Error al crear el repositorio."
    exit 1
  fi
fi

# Cargar Ontología
echo "Cargando ontología..."
curl -X POST \
  -H "Content-Type: application/rdf+xml" \
  -H "Accept: application/json" \
  --data-binary "@$ONTOLOGY_FILE" \
  "$GRAPHDB_URL/repositories/$REPO_ID/statements"

if [ $? -eq 0 ]; then
  echo "Ontología cargada."
else
  echo "Error al cargar la ontología."
fi

# Cargar Datos de Prueba
echo "Cargando datos de prueba..."
curl -X POST \
  -H "Content-Type: text/turtle" \
  -H "Accept: application/json" \
  --data-binary "@$DATA_FILE" \
  "$GRAPHDB_URL/repositories/$REPO_ID/statements"

if [ $? -eq 0 ]; then
  echo "Datos de prueba cargados."
else
  echo "Error al cargar datos de prueba."
fi

echo "Inicialización completada."
