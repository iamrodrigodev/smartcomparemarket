export interface ProductSpec {
  name: string;
  value: string;
  unit?: string;
}

export interface SemanticRelation {
  type: 'equivalent' | 'compatible' | 'incompatible';
  productId: string;
  reason: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  specifications: ProductSpec[];
  semanticTags: string[];
  ontologyClass: string;
  relations: SemanticRelation[];
  seller: string;
  isPremium?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  productCount: number;
}

export const categories: Category[] = [
  {
    id: 'laptops',
    name: 'Laptops',
    icon: '💻',
    subcategories: ['Gaming', 'Ultrabook', 'Workstation', 'Budget'],
    productCount: 156
  },
  {
    id: 'smartphones',
    name: 'Smartphones',
    icon: '📱',
    subcategories: ['Flagship', 'Mid-range', 'Budget', 'Gaming'],
    productCount: 234
  },
  {
    id: 'tablets',
    name: 'Tablets',
    icon: '📟',
    subcategories: ['Professional', 'Entertainment', 'Budget'],
    productCount: 89
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: '🎧',
    subcategories: ['Headphones', 'Earbuds', 'Speakers', 'Soundbars'],
    productCount: 312
  },
  {
    id: 'monitors',
    name: 'Monitores',
    icon: '🖥️',
    subcategories: ['Gaming', 'Professional', 'Ultrawide', 'Office'],
    productCount: 178
  },
  {
    id: 'storage',
    name: 'Almacenamiento',
    icon: '💾',
    subcategories: ['SSD', 'HDD', 'NVMe', 'External'],
    productCount: 145
  }
];

export const products: Product[] = [
  {
    id: 'laptop-001',
    name: 'ProBook X1 Elite',
    brand: 'TechPro',
    category: 'laptops',
    subcategory: 'Ultrabook',
    price: 1299.99,
    originalPrice: 1499.99,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    description: 'Ultrabook premium con pantalla 4K y procesador de última generación',
    rating: 4.8,
    reviews: 234,
    inStock: true,
    specifications: [
      { name: 'Procesador', value: 'Intel Core i7-13700H' },
      { name: 'RAM', value: '16', unit: 'GB' },
      { name: 'Almacenamiento', value: '512', unit: 'GB SSD NVMe' },
      { name: 'Pantalla', value: '14" 4K OLED' },
      { name: 'Batería', value: '72', unit: 'Wh' },
      { name: 'Peso', value: '1.3', unit: 'kg' },
    ],
    semanticTags: ['ultrabook', 'profesional', 'portátil', '4K', 'premium'],
    ontologyClass: 'Laptop > Ultrabook > Premium',
    relations: [
      { type: 'equivalent', productId: 'laptop-002', reason: 'Especificaciones similares de rendimiento' },
      { type: 'compatible', productId: 'monitor-001', reason: 'Compatible vía USB-C DisplayPort' },
    ],
    seller: 'TechStore Pro',
    isPremium: true
  },
  {
    id: 'laptop-002',
    name: 'ZenBook Pro 14',
    brand: 'AsusZen',
    category: 'laptops',
    subcategory: 'Ultrabook',
    price: 1249.99,
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400',
    description: 'Diseño elegante con rendimiento excepcional para profesionales',
    rating: 4.7,
    reviews: 189,
    inStock: true,
    specifications: [
      { name: 'Procesador', value: 'AMD Ryzen 7 7840U' },
      { name: 'RAM', value: '16', unit: 'GB' },
      { name: 'Almacenamiento', value: '512', unit: 'GB SSD NVMe' },
      { name: 'Pantalla', value: '14" 2.8K OLED' },
      { name: 'Batería', value: '75', unit: 'Wh' },
      { name: 'Peso', value: '1.4', unit: 'kg' },
    ],
    semanticTags: ['ultrabook', 'profesional', 'portátil', 'OLED', 'diseño'],
    ontologyClass: 'Laptop > Ultrabook > Premium',
    relations: [
      { type: 'equivalent', productId: 'laptop-001', reason: 'Alternativa semántica en mismo segmento' },
      { type: 'compatible', productId: 'audio-002', reason: 'Optimizado para audio Hi-Fi' },
    ],
    seller: 'ElectroMart'
  },
  {
    id: 'laptop-003',
    name: 'GameMaster RTX',
    brand: 'GamerX',
    category: 'laptops',
    subcategory: 'Gaming',
    price: 1899.99,
    originalPrice: 2199.99,
    image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400',
    description: 'Laptop gaming con RTX 4070 y pantalla 240Hz',
    rating: 4.9,
    reviews: 456,
    inStock: true,
    specifications: [
      { name: 'Procesador', value: 'Intel Core i9-13900HX' },
      { name: 'RAM', value: '32', unit: 'GB' },
      { name: 'GPU', value: 'RTX 4070 8GB' },
      { name: 'Almacenamiento', value: '1', unit: 'TB SSD NVMe' },
      { name: 'Pantalla', value: '16" QHD 240Hz' },
      { name: 'Peso', value: '2.5', unit: 'kg' },
    ],
    semanticTags: ['gaming', 'RTX', 'alto rendimiento', '240Hz', 'competitivo'],
    ontologyClass: 'Laptop > Gaming > High-End',
    relations: [
      { type: 'compatible', productId: 'monitor-002', reason: 'G-Sync compatible' },
      { type: 'incompatible', productId: 'laptop-001', reason: 'Diferente caso de uso (gaming vs productividad)' },
    ],
    seller: 'GameZone',
    isPremium: true
  },
  {
    id: 'smartphone-001',
    name: 'Galaxy Ultra Pro',
    brand: 'Samsung',
    category: 'smartphones',
    subcategory: 'Flagship',
    price: 1199.99,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    description: 'Smartphone flagship con cámara de 200MP y S Pen integrado',
    rating: 4.8,
    reviews: 1234,
    inStock: true,
    specifications: [
      { name: 'Procesador', value: 'Snapdragon 8 Gen 3' },
      { name: 'RAM', value: '12', unit: 'GB' },
      { name: 'Almacenamiento', value: '256', unit: 'GB' },
      { name: 'Pantalla', value: '6.8" Dynamic AMOLED 2X' },
      { name: 'Cámara', value: '200MP + 12MP + 10MP + 10MP' },
      { name: 'Batería', value: '5000', unit: 'mAh' },
    ],
    semanticTags: ['flagship', 'cámara', 'S Pen', 'premium', '5G'],
    ontologyClass: 'Smartphone > Flagship > Premium',
    relations: [
      { type: 'equivalent', productId: 'smartphone-002', reason: 'Competidor directo en segmento flagship' },
      { type: 'compatible', productId: 'audio-001', reason: 'Bluetooth 5.3 compatible' },
    ],
    seller: 'MobileWorld'
  },
  {
    id: 'smartphone-002',
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    category: 'smartphones',
    subcategory: 'Flagship',
    price: 1299.99,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
    description: 'El iPhone más avanzado con chip A17 Pro y titanio',
    rating: 4.9,
    reviews: 2345,
    inStock: true,
    specifications: [
      { name: 'Procesador', value: 'Apple A17 Pro' },
      { name: 'RAM', value: '8', unit: 'GB' },
      { name: 'Almacenamiento', value: '256', unit: 'GB' },
      { name: 'Pantalla', value: '6.7" Super Retina XDR' },
      { name: 'Cámara', value: '48MP + 12MP + 12MP' },
      { name: 'Batería', value: '4422', unit: 'mAh' },
    ],
    semanticTags: ['flagship', 'iOS', 'titanio', 'premium', 'ProRes'],
    ontologyClass: 'Smartphone > Flagship > iOS',
    relations: [
      { type: 'equivalent', productId: 'smartphone-001', reason: 'Alternativa en ecosistema diferente' },
      { type: 'incompatible', productId: 'laptop-003', reason: 'Ecosistemas diferentes (iOS vs Windows)' },
    ],
    seller: 'iStore Premium',
    isPremium: true
  },
  {
    id: 'audio-001',
    name: 'SoundPods Pro',
    brand: 'AudioMax',
    category: 'audio',
    subcategory: 'Earbuds',
    price: 249.99,
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    description: 'Auriculares TWS con ANC adaptativo y audio espacial',
    rating: 4.6,
    reviews: 567,
    inStock: true,
    specifications: [
      { name: 'Tipo', value: 'True Wireless' },
      { name: 'ANC', value: 'Adaptativo' },
      { name: 'Batería', value: '8h + 32h case' },
      { name: 'Códecs', value: 'AAC, LDAC, aptX' },
      { name: 'Resistencia', value: 'IPX5' },
      { name: 'Bluetooth', value: '5.3' },
    ],
    semanticTags: ['TWS', 'ANC', 'audio espacial', 'premium', 'LDAC'],
    ontologyClass: 'Audio > Earbuds > Premium',
    relations: [
      { type: 'equivalent', productId: 'audio-002', reason: 'Mismo segmento de auriculares premium' },
      { type: 'compatible', productId: 'smartphone-001', reason: 'LDAC y Bluetooth 5.3 compatible' },
    ],
    seller: 'AudioPro Shop'
  },
  {
    id: 'audio-002',
    name: 'AirPods Pro 2',
    brand: 'Apple',
    category: 'audio',
    subcategory: 'Earbuds',
    price: 279.99,
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400',
    description: 'ANC de segunda generación con chip H2 y audio adaptativo',
    rating: 4.8,
    reviews: 3456,
    inStock: true,
    specifications: [
      { name: 'Tipo', value: 'True Wireless' },
      { name: 'ANC', value: 'Activo + Transparencia' },
      { name: 'Batería', value: '6h + 30h case' },
      { name: 'Códecs', value: 'AAC' },
      { name: 'Resistencia', value: 'IPX4' },
      { name: 'Chip', value: 'Apple H2' },
    ],
    semanticTags: ['TWS', 'ANC', 'iOS', 'premium', 'audio espacial'],
    ontologyClass: 'Audio > Earbuds > iOS',
    relations: [
      { type: 'equivalent', productId: 'audio-001', reason: 'Competidor directo en earbuds premium' },
      { type: 'compatible', productId: 'smartphone-002', reason: 'Optimizado para ecosistema Apple' },
      { type: 'incompatible', productId: 'laptop-003', reason: 'Sin soporte LDAC para gaming' },
    ],
    seller: 'iStore Premium'
  },
  {
    id: 'monitor-001',
    name: 'UltraView 4K Pro',
    brand: 'ViewMax',
    category: 'monitors',
    subcategory: 'Professional',
    price: 699.99,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    description: 'Monitor 4K IPS con calibración de fábrica para diseño',
    rating: 4.7,
    reviews: 234,
    inStock: true,
    specifications: [
      { name: 'Resolución', value: '3840x2160 4K' },
      { name: 'Panel', value: 'IPS' },
      { name: 'Tamaño', value: '27"' },
      { name: 'Refresh Rate', value: '60Hz' },
      { name: 'Color', value: '100% sRGB, 95% DCI-P3' },
      { name: 'Conectividad', value: 'USB-C PD 90W, HDMI, DP' },
    ],
    semanticTags: ['4K', 'profesional', 'diseño', 'USB-C', 'calibrado'],
    ontologyClass: 'Monitor > Professional > 4K',
    relations: [
      { type: 'compatible', productId: 'laptop-001', reason: 'USB-C con Power Delivery' },
      { type: 'compatible', productId: 'laptop-002', reason: 'USB-C DisplayPort Alt Mode' },
    ],
    seller: 'DisplayPro'
  },
  {
    id: 'monitor-002',
    name: 'GameView 240Hz',
    brand: 'GamerX',
    category: 'monitors',
    subcategory: 'Gaming',
    price: 549.99,
    originalPrice: 649.99,
    image: 'https://images.unsplash.com/photo-1616763355603-9755a640a287?w=400',
    description: 'Monitor gaming QHD 240Hz con G-Sync y tiempo de respuesta 1ms',
    rating: 4.8,
    reviews: 567,
    inStock: true,
    specifications: [
      { name: 'Resolución', value: '2560x1440 QHD' },
      { name: 'Panel', value: 'IPS' },
      { name: 'Tamaño', value: '27"' },
      { name: 'Refresh Rate', value: '240Hz' },
      { name: 'Response Time', value: '1ms GtG' },
      { name: 'Sync', value: 'G-Sync Compatible' },
    ],
    semanticTags: ['gaming', '240Hz', 'G-Sync', 'competitivo', 'QHD'],
    ontologyClass: 'Monitor > Gaming > High-Refresh',
    relations: [
      { type: 'compatible', productId: 'laptop-003', reason: 'G-Sync y alto refresh rate' },
      { type: 'incompatible', productId: 'laptop-001', reason: 'Sin GPU dedicada para 240Hz' },
    ],
    seller: 'GameZone',
    isPremium: true
  },
  {
    id: 'storage-001',
    name: 'SpeedDrive NVMe Pro',
    brand: 'DataMax',
    category: 'storage',
    subcategory: 'NVMe',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
    description: 'SSD NVMe Gen4 con velocidades de hasta 7000MB/s',
    rating: 4.9,
    reviews: 890,
    inStock: true,
    specifications: [
      { name: 'Capacidad', value: '1', unit: 'TB' },
      { name: 'Interfaz', value: 'NVMe PCIe 4.0 x4' },
      { name: 'Lectura', value: '7000', unit: 'MB/s' },
      { name: 'Escritura', value: '5500', unit: 'MB/s' },
      { name: 'TBW', value: '700', unit: 'TB' },
      { name: 'DRAM', value: 'Sí' },
    ],
    semanticTags: ['NVMe', 'Gen4', 'alta velocidad', 'gaming', 'profesional'],
    ontologyClass: 'Storage > SSD > NVMe > Gen4',
    relations: [
      { type: 'equivalent', productId: 'storage-002', reason: 'Rendimiento similar en benchmarks' },
      { type: 'compatible', productId: 'laptop-003', reason: 'Slot NVMe Gen4 disponible' },
    ],
    seller: 'StorageMaster'
  },
  {
    id: 'storage-002',
    name: 'FireCuda 530',
    brand: 'Seagate',
    category: 'storage',
    subcategory: 'NVMe',
    price: 159.99,
    originalPrice: 189.99,
    image: 'https://images.unsplash.com/photo-1628557044797-f21d1d6e1d9d?w=400',
    description: 'SSD NVMe diseñado para gaming y cargas de trabajo intensivas',
    rating: 4.8,
    reviews: 456,
    inStock: true,
    specifications: [
      { name: 'Capacidad', value: '1', unit: 'TB' },
      { name: 'Interfaz', value: 'NVMe PCIe 4.0 x4' },
      { name: 'Lectura', value: '7300', unit: 'MB/s' },
      { name: 'Escritura', value: '6000', unit: 'MB/s' },
      { name: 'TBW', value: '1275', unit: 'TB' },
      { name: 'Heatsink', value: 'Incluido' },
    ],
    semanticTags: ['NVMe', 'Gen4', 'gaming', 'heatsink', 'alta durabilidad'],
    ontologyClass: 'Storage > SSD > NVMe > Gen4',
    relations: [
      { type: 'equivalent', productId: 'storage-001', reason: 'Competidor directo en segmento Gen4' },
      { type: 'compatible', productId: 'laptop-003', reason: 'Ideal para gaming con heatsink' },
    ],
    seller: 'TechStore Pro'
  }
];

export const priceRanges = [
  { label: 'Menos de $200', min: 0, max: 200 },
  { label: '$200 - $500', min: 200, max: 500 },
  { label: '$500 - $1000', min: 500, max: 1000 },
  { label: '$1000 - $1500', min: 1000, max: 1500 },
  { label: 'Más de $1500', min: 1500, max: Infinity },
];

export const brands = [...new Set(products.map(p => p.brand))];

export const semanticFilters = [
  { id: 'premium', label: 'Premium', color: 'premium' },
  { id: 'gaming', label: 'Gaming', color: 'info' },
  { id: 'profesional', label: 'Profesional', color: 'primary' },
  { id: 'portátil', label: 'Portátil', color: 'secondary' },
  { id: 'alta velocidad', label: 'Alta Velocidad', color: 'success' },
];
