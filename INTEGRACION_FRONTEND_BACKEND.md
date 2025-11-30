# Integración Frontend-Backend - SmartCompareMarket

## 📋 Resumen

Este documento describe la integración completa entre el frontend (React + TypeScript + Vite) y el backend (FastAPI + OWL + SPARQL).

## ✅ Componentes Implementados

### 1. **Configuración de Entorno**
- ✅ Variables de entorno (`.env`)
- ✅ URL del backend configurable
- ✅ Timeouts y configuración de API

### 2. **Capa de Tipos (TypeScript)**
- ✅ `src/types/api.ts` - Tipos que mapean schemas Pydantic del backend
- ✅ Type-safety completo en toda la aplicación
- ✅ Interfaces para todos los endpoints

### 3. **Servicio API**
- ✅ `src/lib/api.ts` - Cliente HTTP con patrón Facade
- ✅ Manejo de errores y timeouts
- ✅ Servicios separados por dominio:
  - `ProductService` - CRUD de productos
  - `ComparisonService` - Comparaciones
  - `RecommendationService` - Recomendaciones personalizadas
  - `AnalysisService` - Análisis de mercado SPARQL
  - `HealthService` - Health checks

### 4. **Hooks Personalizados (React Query)**
- ✅ `src/hooks/useProducts.ts` - Productos y búsquedas
- ✅ `src/hooks/useComparisons.ts` - Comparaciones
- ✅ `src/hooks/useRecommendations.ts` - Recomendaciones
- ✅ `src/hooks/useAnalysis.ts` - Análisis de mercado
- ✅ Caché inteligente y refetch automático
- ✅ Estados de loading y error

### 5. **Transformadores de Datos**
- ✅ `src/lib/transformers.ts` - Patrón Adapter
- ✅ Conversión de datos backend → frontend
- ✅ Generación de datos derivados (ratings, imágenes, etc.)

### 6. **Componentes Actualizados**
- ✅ `src/pages/Index.tsx` - Página principal con datos reales
- ✅ `src/components/marketplace/MarketAnalysisPanel.tsx` - Análisis SPARQL
- ✅ Indicadores de carga y manejo de errores
- ✅ Fallbacks para cuando el backend no está disponible

## 🏗️ Arquitectura

```
Frontend (React)
├── UI Components
│   └── Presentational (sin lógica de negocio)
├── Custom Hooks (React Query)
│   └── Estado + Caché + Refetch
├── API Service (Facade Pattern)
│   ├── ProductService
│   ├── ComparisonService
│   ├── RecommendationService
│   └── AnalysisService
├── HTTP Client
│   └── Fetch con timeout y error handling
└── Types (TypeScript)
    └── Mapeo de schemas Pydantic

Backend (FastAPI)
├── API Routes
├── Application Services
├── Domain Entities
├── Infrastructure
│   ├── SPARQL Client
│   ├── Ontology Loader
│   └── Reasoner Engine
└── OWL Ontology
```

## 🔄 Flujo de Datos

```
1. Usuario interactúa con UI
   ↓
2. Componente llama a custom hook
   ↓
3. Hook ejecuta query con React Query
   ↓
4. API Service hace petición HTTP
   ↓
5. Backend procesa con SPARQL/Reasoner
   ↓
6. Respuesta se transforma (Adapter)
   ↓
7. React Query cachea resultado
   ↓
8. UI se actualiza automáticamente
```

## 🚀 Cómo Usar

### Paso 1: Iniciar el Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Paso 2: Iniciar el Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará en `http://localhost:5173` y se conectará automáticamente al backend en `http://localhost:8000`.

## 📡 Endpoints Utilizados

### Productos
- `GET /api/v1/products/` - Lista paginada
- `GET /api/v1/products/{id}` - Detalle de producto
- `GET /api/v1/products/search/` - Búsqueda con filtros
- `GET /api/v1/products/{id}/similar` - Productos similares
- `GET /api/v1/products/{id}/compatible` - Productos compatibles
- `GET /api/v1/products/{id}/incompatible` - Productos incompatibles

### Comparaciones
- `POST /api/v1/comparisons/` - Comparar productos
- `GET /api/v1/comparisons/best-value/{category}` - Mejor valor
- `POST /api/v1/comparisons/by-specs` - Comparar por specs

### Recomendaciones
- `GET /api/v1/recommendations/users/{user_id}` - Recomendaciones generales
- `GET /api/v1/recommendations/users/{user_id}/budget` - En presupuesto
- `GET /api/v1/recommendations/users/{user_id}/personalized` - Personalizadas

### Análisis
- `GET /api/v1/analysis/price-ranges` - Rangos de precio
- `GET /api/v1/analysis/vendors` - Estadísticas de vendedores
- `GET /api/v1/analysis/brands` - Estadísticas de marcas
- `GET /api/v1/analysis/overview` - Resumen del mercado
- `GET /api/v1/analysis/categories/{categoria}/insights` - Insights de categoría

## 🎯 Requisitos Funcionales Cumplidos

| # | Requisito | Implementación |
|---|-----------|----------------|
| 1 | Ontología de productos | ✅ Backend OWL + Frontend consume |
| 2 | Equivalencias semánticas | ✅ Endpoints `/similar`, `/compatible` |
| 3 | Reglas de inferencia | ✅ Backend Reasoner + SWRL |
| 4 | Motor de comparación | ✅ Tablas JSON en interfaz |
| 5 | Búsqueda semántica | ✅ `/products/search/` con filtros |
| 6 | Recomendaciones | ✅ Basadas en perfil + razonamiento |
| 7 | Consultas SPARQL | ✅ Panel de análisis de mercado |
| 8 | Clasificación OWL | ✅ Subsunción automática |
| 9 | Validación consistencia | ✅ Backend reasoner |

## 🔧 Configuración

### Variables de Entorno Frontend

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=30000
VITE_ENABLE_REASONING=true
VITE_ENABLE_MOCK_DATA=false
```

### Caché de React Query

- **Productos**: 5 minutos stale time
- **Búsquedas**: 3 minutos stale time
- **Análisis**: 10-15 minutos stale time
- **Recomendaciones**: 5 minutos stale time

## 🛡️ Manejo de Errores

### Estados Manejados
- ✅ **Loading**: Indicadores visuales con Loader2
- ✅ **Error**: Mensajes descriptivos con instrucciones
- ✅ **Empty**: Estados vacíos con CTAs
- ✅ **Timeout**: Mensajes específicos de timeout
- ✅ **Network**: Detección de backend offline

### Fallbacks
- Si el backend no responde, se muestran mensajes claros
- No se usan datos mock en producción
- Instrucciones para verificar el backend

## 🎨 Principios SOLID Aplicados

### Single Responsibility
- Cada servicio tiene una única responsabilidad
- Hooks separados por dominio
- Transformadores específicos

### Open/Closed
- Servicios extensibles sin modificación
- Nuevos endpoints se agregan fácilmente

### Liskov Substitution
- Todos los servicios implementan interfaces consistentes

### Interface Segregation
- Hooks específicos, no monolíticos
- Servicios separados por funcionalidad

### Dependency Inversion
- Componentes dependen de hooks (abstracciones)
- Hooks dependen de servicios
- Servicios dependen de cliente HTTP

## 📊 Performance

### Optimizaciones Implementadas
- ✅ React Query para caché automático
- ✅ Lazy loading de datos
- ✅ Debounce en búsquedas (puede agregarse)
- ✅ Paginación en listas
- ✅ Stale-while-revalidate pattern

## 🧪 Testing (Recomendado)

```typescript
// Ejemplo de test con React Query
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '@/hooks/useProducts';

test('useProducts fetches products', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useProducts(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

## 📝 Próximos Pasos (Opcional)

1. **Autenticación**: Agregar JWT tokens
2. **WebSockets**: Actualizaciones en tiempo real
3. **Offline Mode**: Service Workers + IndexedDB
4. **Tests**: Unit + Integration tests
5. **Optimistic Updates**: Mutaciones optimistas
6. **Infinite Scroll**: Para listas largas
7. **Debounce**: En búsquedas en tiempo real

## 🐛 Troubleshooting

### Error: "Failed to fetch"
- Verificar que el backend esté corriendo
- Verificar CORS en el backend
- Verificar URL en `.env`

### Error: "Network timeout"
- Aumentar `VITE_API_TIMEOUT`
- Verificar consultas SPARQL lentas

### Datos no se actualizan
- Verificar stale time en hooks
- Forzar refetch con `queryClient.invalidateQueries()`

## 📚 Recursos

- [React Query Docs](https://tanstack.com/query/latest)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)

---

**Autor**: SmartCompareMarket Team  
**Fecha**: 2025-11-29  
**Versión**: 1.0.0
