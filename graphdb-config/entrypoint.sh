#!/bin/sh

# Iniciar GraphDB en segundo plano
# La ruta al binario puede variar, pero usualmente es esta en la imagen oficial
/opt/graphdb/dist/bin/graphdb &
GRAPHDB_PID=$!

# Esperar a que GraphDB esté listo
echo "⏳ Esperando a que GraphDB inicie..."
# Intentar conectar hasta que responda. Usamos localhost.
# Si curl no existe, esto fallará. Asumimos que curl está presente o se instala.
# Si falla, el script continuará y GraphDB seguirá corriendo, pero no se inicializará.
MAX_RETRIES=30
COUNT=0
while ! curl -s "http://localhost:7200/rest/repositories" > /dev/null; do
  echo "   GraphDB no está listo aún. Reintentando..."
  sleep 2
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Timeout esperando a GraphDB."
    break
  fi
done

if [ $COUNT -lt $MAX_RETRIES ]; then
    echo "✅ GraphDB está en línea."

    REPO_ID="smartcomparemarket"
    CONFIG_FILE="/opt/graphdb-config/repo-config.ttl"
    ONTOLOGY_FILE="/ontologies/SmartCompareMarket.owl"

    # Verificar si el repositorio existe
    if curl -s "http://localhost:7200/rest/repositories" | grep -q "$REPO_ID"; then
      echo "ℹ️ El repositorio '$REPO_ID' ya existe."
    else
      echo "🚀 Creando repositorio '$REPO_ID'..."
      curl -X POST \
        -H "Content-Type: multipart/form-data" \
        -F "config=@$CONFIG_FILE" \
        "http://localhost:7200/rest/repositories"
    fi

    # Cargar Ontología (siempre intentamos cargarla para actualizar, o podríamos verificar si está vacía)
    echo "📚 Cargando/Actualizando ontología..."
    curl -X POST \
      -H "Content-Type: application/rdf+xml" \
      -H "Accept: application/json" \
      --data-binary "@$ONTOLOGY_FILE" \
      "http://localhost:7200/repositories/$REPO_ID/statements"
      
    echo "✨ Inicialización completada."
fi

# Mantener el contenedor corriendo esperando al proceso de GraphDB
wait $GRAPHDB_PID
