"""
Ejemplos para documentación de Swagger/OpenAPI.
Estos ejemplos se usan en los schemas Pydantic para mejorar la documentación automática.
"""

# ============================================================================
# EJEMPLOS DE PRODUCTOS
# ============================================================================

PRODUCT_EXAMPLE = {
    "id": "Laptop_Dell_XPS13",
    "nombre": "Dell XPS 13 (2023)",
    "precio": 1299.99,
    "descripcion": "Laptop ultraportátil con pantalla InfinityEdge de 13.4 pulgadas",
    "stock": 15,
    "categoria": "Laptop",
    "marca": "Dell",
    "vendedor": "TechStore",
    "especificaciones": {
        "ram_gb": 16,
        "almacenamiento_gb": 512,
        "procesador": "Intel Core i7-1165G7",
        "pantalla_pulgadas": 13.4,
        "peso_kg": 1.2,
        "sistema_operativo": "Windows 11 Pro",
        "bateria_horas": 12
    },
    "uri": "http://smartcompare.com/ontologia#Laptop_Dell_XPS13"
}

PRODUCT_LIST_EXAMPLE = {
    "items": [
        PRODUCT_EXAMPLE,
        {
            "id": "Laptop_HP_Spectre",
            "nombre": "HP Spectre x360 14",
            "precio": 1399.99,
            "descripcion": "Laptop convertible 2 en 1 con pantalla táctil",
            "stock": 8,
            "categoria": "Laptop",
            "marca": "HP",
            "vendedor": "ElectroMart",
            "especificaciones": {
                "ram_gb": 8,
                "almacenamiento_gb": 256,
                "procesador": "Intel Core i5-1135G7",
                "pantalla_pulgadas": 13.3,
                "peso_kg": 1.3
            }
        }
    ],
    "total": 54,
    "page": 1,
    "page_size": 20,
    "total_pages": 3
}

# ============================================================================
# EJEMPLOS DE BÚSQUEDA
# ============================================================================

SEARCH_PARAMS_EXAMPLE = {
    "categoria": "Laptop",
    "min_precio": 500.0,
    "max_precio": 2000.0,
    "marca": "Dell",
    "keyword": "ultraportátil"
}

# ============================================================================
# EJEMPLOS DE COMPARACIÓN
# ============================================================================

COMPARISON_REQUEST_EXAMPLE = {
    "product_ids": [
        "Laptop_Dell_XPS13",
        "Laptop_HP_Spectre",
        "Laptop_Lenovo_X1"
    ]
}

COMPARISON_RESPONSE_EXAMPLE = {
    "productos": [
        PRODUCT_EXAMPLE,
        {
            "id": "Laptop_HP_Spectre",
            "nombre": "HP Spectre x360 14",
            "precio": 1399.99,
            "especificaciones": {
                "ram_gb": 8,
                "almacenamiento_gb": 256,
                "procesador": "Intel Core i5-1135G7"
            }
        }
    ],
    "diferencias": {
        "ram_gb": [16, 8],
        "almacenamiento_gb": [512, 256],
        "procesador": ["Intel Core i7-1165G7", "Intel Core i5-1135G7"]
    },
    "mejor_precio": {
        "id": "Laptop_Dell_XPS13",
        "nombre": "Dell XPS 13 (2023)",
        "precio": 1299.99
    },
    "timestamp": "2025-11-29T10:30:00Z"
}

# ============================================================================
# EJEMPLOS DE RECOMENDACIONES
# ============================================================================

RECOMMENDATION_RESPONSE_EXAMPLE = {
    "producto": PRODUCT_EXAMPLE,
    "razon": "Recomendado por perfil: producto dentro de tu presupuesto y categoría preferida",
    "score": 0.95
}

RECOMMENDATION_LIST_EXAMPLE = {
    "items": [
        RECOMMENDATION_RESPONSE_EXAMPLE,
        {
            "producto": {
                "id": "Laptop_Lenovo_X1",
                "nombre": "Lenovo ThinkPad X1 Carbon",
                "precio": 1599.99
            },
            "razon": "Similar a tus compras anteriores",
            "score": 0.85
        }
    ],
    "usuario_id": "Comprador_Juan",
    "timestamp": "2025-11-29T10:30:00Z"
}

# ============================================================================
# EJEMPLOS DE ANÁLISIS
# ============================================================================

MARKET_STATS_EXAMPLE = {
    "categoria": "Laptop",
    "precio_minimo": 499.99,
    "precio_maximo": 2999.99,
    "precio_promedio": 1249.50,
    "total_productos": 25,
    "rango_precio": 2500.00
}

VENDOR_STATS_EXAMPLE = {
    "vendedor": "TechStore",
    "total_productos": 42,
    "precio_promedio": 1150.00,
    "precio_minimo": 299.99,
    "precio_maximo": 3499.99,
    "precio_competitivo": True
}

MARKET_OVERVIEW_EXAMPLE = {
    "total_categorias": 8,
    "total_vendedores": 5,
    "total_marcas": 12,
    "precio_promedio_global": 875.50,
    "categoria_top": {
        "nombre": "Laptop",
        "productos": 25
    },
    "vendedor_top": {
        "nombre": "TechStore",
        "productos": 42
    }
}

# ============================================================================
# EJEMPLOS DE ERRORES
# ============================================================================

ERROR_404_EXAMPLE = {
    "error": "Producto no encontrado: Laptop_Fake123",
    "detail": "{'product_id': 'Laptop_Fake123'}",
    "code": "ProductNotFoundException"
}

ERROR_400_EXAMPLE = {
    "error": "Se requieren al menos 2 productos para comparar",
    "detail": None,
    "code": "ValueError"
}

ERROR_500_EXAMPLE = {
    "error": "Error al ejecutar consulta SPARQL",
    "detail": "Connection timeout",
    "code": "SPARQLQueryError"
}

# ============================================================================
# EJEMPLOS DE HEALTH CHECK
# ============================================================================

HEALTH_CHECK_EXAMPLE = {
    "status": "healthy",
    "version": "1.0.0",
    "ontology_loaded": True,
    "sparql_connected": True,
    "reasoner_active": True
}
