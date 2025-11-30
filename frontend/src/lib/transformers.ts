/**
 * Utilidades para transformar datos del backend al formato del frontend
 * Implementa el patrón Adapter para compatibilidad entre formatos
 */

import type { ProductResponse } from '@/types/api';
import type { Product, ProductSpec, SemanticRelation } from '@/types/marketplace';

// ============================================================================
// TRANSFORMADORES DE PRODUCTOS
// ============================================================================

/**
 * Transforma un ProductResponse del backend a Product del frontend
 */
export function transformProductResponse(apiProduct: ProductResponse): Product {
    // Extraer especificaciones del objeto especificaciones
    const specs: ProductSpec[] = Object.entries(apiProduct.especificaciones || {})
        .filter(([key]) => !['categoria', 'marca', 'vendedor'].includes(key))
        .map(([name, value]) => {
            // Intentar detectar unidades
            const valueStr = String(value);
            const match = valueStr.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);

            if (match) {
                return {
                    name: formatSpecName(name),
                    value: match[1],
                    unit: match[2] || undefined,
                };
            }

            return {
                name: formatSpecName(name),
                value: valueStr,
            };
        });

    // Extraer datos semánticos
    const semanticTags = extractSemanticTags(apiProduct);
    const ontologyClass = extractOntologyClass(apiProduct);

    // Generar imagen placeholder basada en categoría
    const image = generateProductImage(apiProduct.categoria || 'default');

    return {
        id: apiProduct.id,
        name: apiProduct.nombre,
        brand: apiProduct.marca || 'Sin marca',
        category: mapCategory(apiProduct.categoria),
        subcategory: extractSubcategory(apiProduct),
        price: Number(apiProduct.precio),
        originalPrice: calculateOriginalPrice(Number(apiProduct.precio)),
        image,
        description: apiProduct.descripcion || 'Sin descripción',
        rating: generateRating(),
        reviews: generateReviewCount(),
        inStock: (apiProduct.stock || 0) > 0,
        specifications: specs,
        semanticTags,
        ontologyClass,
        relations: [], // Se cargarían por separado con las APIs de relaciones
        seller: apiProduct.vendedor || 'Vendedor desconocido',
        isPremium: checkIfPremium(apiProduct),
    };
}

/**
 * Formatea el nombre de una especificación
 */
function formatSpecName(name: string): string {
    const nameMap: Record<string, string> = {
        ram_gb: 'RAM',
        almacenamiento_gb: 'Almacenamiento',
        procesador: 'Procesador',
        pantalla_pulgadas: 'Pantalla',
        bateria_mah: 'Batería',
        peso_kg: 'Peso',
        sistema_operativo: 'Sistema Operativo',
    };

    return nameMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Extrae tags semánticos del producto
 */
function extractSemanticTags(product: ProductResponse): string[] {
    const tags: string[] = [];

    // Tags basados en categoría
    if (product.categoria) {
        tags.push(product.categoria.toLowerCase());
    }

    // Tags basados en marca
    if (product.marca) {
        tags.push(product.marca.toLowerCase());
    }

    // Tags basados en especificaciones
    const specs = product.especificaciones || {};

    if (specs.ram_gb && Number(specs.ram_gb) >= 16) {
        tags.push('alto rendimiento');
    }

    if (specs.sistema_operativo) {
        tags.push(String(specs.sistema_operativo).toLowerCase());
    }

    // Tags de precio
    const precio = Number(product.precio);
    if (precio > 1000) {
        tags.push('premium');
    } else if (precio < 300) {
        tags.push('económico');
    }

    return [...new Set(tags)]; // Eliminar duplicados
}

/**
 * Extrae la clase de ontología
 */
function extractOntologyClass(product: ProductResponse): string {
    const categoria = product.categoria || 'Producto';
    const specs = product.especificaciones || {};

    // Construir jerarquía basada en especificaciones
    let hierarchy = categoria;

    if (specs.subcategoria) {
        hierarchy += ` > ${specs.subcategoria}`;
    }

    return hierarchy;
}

/**
 * Mapea categorías del backend a categorías del frontend
 */
function mapCategory(categoria?: string): string {
    if (!categoria) return 'otros';

    const categoryMap: Record<string, string> = {
        Laptop: 'laptops',
        Smartphone: 'smartphones',
        Tablet: 'tablets',
        Audio: 'audio',
        Monitor: 'monitors',
        Almacenamiento: 'storage',
    };

    return categoryMap[categoria] || categoria.toLowerCase();
}

/**
 * Extrae subcategoría de las especificaciones
 */
function extractSubcategory(product: ProductResponse): string {
    const specs = product.especificaciones || {};

    if (specs.subcategoria) {
        return String(specs.subcategoria);
    }

    // Inferir subcategoría basada en especificaciones
    if (product.categoria === 'Laptop') {
        if (specs.gpu) return 'Gaming';
        if (Number(specs.peso_kg || 0) < 1.5) return 'Ultrabook';
        return 'Standard';
    }

    return 'General';
}

/**
 * Genera una imagen placeholder basada en categoría
 */
function generateProductImage(categoria: string): string {
    const imageMap: Record<string, string> = {
        Laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        Smartphone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        Tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        Audio: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
        Monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
        Almacenamiento: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
    };

    return imageMap[categoria] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
}

/**
 * Calcula precio original (simulado con descuento)
 */
function calculateOriginalPrice(price: number): number | undefined {
    // 30% de probabilidad de tener descuento
    if (Math.random() > 0.7) {
        return Math.round(price * 1.2 * 100) / 100;
    }
    return undefined;
}

/**
 * Genera rating aleatorio (temporal hasta tener datos reales)
 */
function generateRating(): number {
    return Math.round((4 + Math.random()) * 10) / 10;
}

/**
 * Genera cantidad de reviews (temporal)
 */
function generateReviewCount(): number {
    return Math.floor(Math.random() * 1000) + 50;
}

/**
 * Determina si un producto es premium
 */
function checkIfPremium(product: ProductResponse): boolean {
    const precio = Number(product.precio);
    const specs = product.especificaciones || {};

    // Premium si precio > 1000 o tiene especificaciones de alta gama
    return precio > 1000 ||
        Number(specs.ram_gb || 0) >= 16 ||
        Boolean(specs.gpu);
}

// ============================================================================
// TRANSFORMADORES DE LISTAS
// ============================================================================

/**
 * Transforma una lista de productos del backend
 */
export function transformProductList(apiProducts: ProductResponse[]): Product[] {
    return apiProducts.map(transformProductResponse);
}

// ============================================================================
// UTILIDADES DE FORMATO
// ============================================================================

/**
 * Formatea precio en formato de moneda
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
}

/**
 * Formatea fecha
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
