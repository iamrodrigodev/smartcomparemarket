# SmartCompareMarket API

API RESTful para marketplace semántico con capacidades de razonamiento OWL y consultas SPARQL.

## 🎯 Características

- **Búsqueda Semántica**: Consultas avanzadas con soporte de jerarquías OWL
- **Comparación Inteligente**: Comparación de productos con detección automática de diferencias
- **Recomendaciones Personalizadas**: Sistema de recomendaciones basado en reglas SWRL
- **Análisis de Mercado**: Estadísticas y análisis de precios, vendedores y marcas
- **Razonamiento Semántico**: Inferencias automáticas usando Pellet/FaCT++/HermiT

## 🏗️ Arquitectura

El proyecto sigue una **arquitectura en capas** implementando **principios SOLID**:

```
backend/
├── app/
│   ├── api/                    # Capa de API (Routers FastAPI)
│   │   ├── products.py
│   │   ├── comparisons.py
│   │   ├── recommendations.py
│   │   └── analysis.py
│   ├── application/            # Capa de Aplicación (Servicios)
│   │   ├── product_service.py
│   │   ├── comparison_service.py
│   │   ├── recommendation_service.py
│   │   └── analysis_service.py
│   ├── domain/                 # Capa de Dominio (Entidades)
│   │   ├── entities.py
│   │   └── schemas.py
│   ├── infrastructure/         # Capa de Infraestructura
│   │   ├── sparql/            # Cliente SPARQL y consultas
│   │   ├── ontology/          # Cargador de ontologías
│   │   └── reasoner/          # Motor de razonamiento
│   ├── core/                   # Configuración y utilidades
│   │   ├── config.py
│   │   ├── exceptions.py
│   │   └── dependencies.py
│   └── main.py                 # Aplicación FastAPI
```

## 🚀 Instalación

### Requisitos Previos

- Python 3.10+
- GraphDB o Stardog
- Java 11+ (para Pellet/FaCT++)

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd smartcomparemarket/backend
```

### 2. Crear entorno virtual

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 5. Iniciar GraphDB

```bash
# Asegúrate de tener GraphDB corriendo en http://localhost:7200
# Crea un repositorio llamado 'smartcomparemarket'
```

### 6. Cargar la ontología

```bash
# Usa la interfaz de GraphDB para importar:
# ../ontologies/SmartCompareMarket.owl
```

## 🏃 Ejecución

### Modo desarrollo

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Modo producción

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

La API estará disponible en:
- Documentación Swagger: http://localhost:8000/docs
- Documentación ReDoc: http://localhost:8000/redoc
- API: http://localhost:8000/api/v1

## 📚 Documentación de la API

### Endpoints de Productos

- `GET /api/v1/products/` - Listar todos los productos (paginado)
- `GET /api/v1/products/{product_id}` - Obtener producto por ID
- `GET /api/v1/products/search/` - Buscar productos con filtros
- `GET /api/v1/products/{product_id}/similar` - Productos similares
- `GET /api/v1/products/{product_id}/compatible` - Productos compatibles
- `GET /api/v1/products/{product_id}/incompatible` - Productos incompatibles

### Endpoints de Comparación

- `POST /api/v1/comparisons/` - Comparar múltiples productos
- `GET /api/v1/comparisons/best-value/{category}` - Mejor relación calidad-precio
- `POST /api/v1/comparisons/by-specs` - Comparar por especificaciones

### Endpoints de Recomendaciones

- `GET /api/v1/recommendations/users/{user_id}` - Recomendaciones para usuario
- `GET /api/v1/recommendations/users/{user_id}/budget` - Productos en presupuesto
- `GET /api/v1/recommendations/users/{user_id}/personalized` - Recomendaciones personalizadas

### Endpoints de Análisis

- `GET /api/v1/analysis/price-ranges` - Rangos de precio por categoría
- `GET /api/v1/analysis/vendors` - Estadísticas de vendedores
- `GET /api/v1/analysis/brands` - Comparación de marcas
- `GET /api/v1/analysis/overview` - Resumen del mercado
- `GET /api/v1/analysis/categories/{categoria}/insights` - Insights de categoría

## 🧪 Testing

```bash
# Ejecutar tests
pytest

# Con cobertura
pytest --cov=app --cov-report=html
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `GRAPH_DB_URL` | URL del servidor GraphDB | `http://localhost:7200` |
| `GRAPH_DB_REPOSITORY` | Nombre del repositorio | `smartcomparemarket` |
| `ONTOLOGY_FILE_PATH` | Ruta al archivo OWL | `../ontologies/SmartCompareMarket.owl` |
| `ENABLE_REASONING` | Habilitar razonamiento | `true` |
| `REASONER_TYPE` | Tipo de reasoner | `pellet` |
| `SPARQL_TIMEOUT` | Timeout de consultas (seg) | `30` |
| `MAX_PAGE_SIZE` | Tamaño máximo de página | `100` |

## 📖 Ejemplos de Uso

### Buscar productos por categoría y precio

```bash
curl "http://localhost:8000/api/v1/products/search/?categoria=Laptop&min_precio=500&max_precio=1500"
```

### Comparar productos

```bash
curl -X POST "http://localhost:8000/api/v1/comparisons/" \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": ["Laptop_Dell_XPS13", "Laptop_HP_Spectre"]
  }'
```

### Obtener recomendaciones

```bash
curl "http://localhost:8000/api/v1/recommendations/users/Comprador_Juan?limit=10"
```

## 🛠️ Tecnologías

- **Framework**: FastAPI 0.109
- **OWL/Ontologías**: owlready2 0.46
- **Cliente HTTP**: httpx 0.26
- **Validación**: Pydantic 2.5
- **Servidor**: Uvicorn
- **Triplestore**: GraphDB / Stardog
- **Reasoner**: Pellet / FaCT++ / HermiT

## 📋 Principios de Diseño

- **SOLID**: Todos los módulos siguen principios SOLID
- **Clean Architecture**: Separación clara de capas
- **DDD**: Domain-Driven Design en capa de dominio
- **Dependency Injection**: FastAPI Depends para DI
- **Repository Pattern**: Acceso a datos a través de repositorios
- **Query Object Pattern**: Consultas SPARQL encapsuladas

## 🐛 Troubleshooting

### Error de conexión con GraphDB

```bash
# Verificar que GraphDB está corriendo
curl http://localhost:7200/repositories

# Verificar que el repositorio existe
curl http://localhost:7200/repositories/smartcomparemarket
```

### Error al cargar la ontología

```bash
# Verificar que el archivo OWL existe
ls ../ontologies/SmartCompareMarket.owl

# Verificar permisos de lectura
chmod 644 ../ontologies/SmartCompareMarket.owl
```

### Error del reasoner

```bash
# Verificar instalación de Java
java -version

# Desactivar razonamiento temporalmente
export ENABLE_REASONING=false
```

## 📄 Licencia

Este proyecto es parte de SmartCompareMarket.

## 👥 Contribución

Ver CONTRIBUTING.md para detalles sobre el proceso de contribución.

## 📞 Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio.
