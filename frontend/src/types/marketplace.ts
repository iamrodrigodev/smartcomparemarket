// Types for the marketplace application
// All data should come from the backend API

export interface ProductSpec {
    name: string;
    value: string;
    unit?: string;
}

export interface SemanticRelation {
    type: 'similar' | 'alternative' | 'complement' | 'upgrade';
    productId: string;
    reason: string;
}

export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    subcategory?: string;
    price: number;
    originalPrice?: number;
    image: string;
    description: string;
    rating: number;
    reviews: number;
    inStock: boolean;
    specifications: ProductSpec[];
    semanticTags?: string[];
    ontologyClass?: string;
    relations?: SemanticRelation[];
    seller?: string;
    isPremium?: boolean;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    count: number;
    subcategories?: string[];
}

export interface PriceRange {
    id: string;
    label: string;
    min: number;
    max: number;
}

export interface SemanticFilter {
    id: string;
    label: string;
    description: string;
    icon: string;
}
