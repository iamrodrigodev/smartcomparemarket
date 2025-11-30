import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Header } from '@/components/marketplace/Header';
import { CategoryNav } from '@/components/marketplace/CategoryNav';
import { HeroSection } from '@/components/marketplace/HeroSection';
import { FilterSidebar } from '@/components/marketplace/FilterSidebar';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ComparisonTable } from '@/components/marketplace/ComparisonTable';
import { RecommendationSection } from '@/components/marketplace/RecommendationSection';
import { MarketAnalysisPanel } from '@/components/marketplace/MarketAnalysisPanel';
import { OWLClassificationPanel } from '@/components/marketplace/OWLClassificationPanel';
import { ConsistencyValidator } from '@/components/marketplace/ConsistencyValidator';
import { Category, Product, PriceRange } from '@/types/marketplace';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductSearch } from '@/hooks/useProducts';
import { useRecommendations } from '@/hooks/useRecommendations';
import { usePriceRanges, useBrandStats } from '@/hooks/useAnalysis';
import { transformProductList } from '@/lib/transformers';
import type { ProductSearchParams } from '@/types/api';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedSemanticTags, setSelectedSemanticTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // --- DATA FETCHING FROM BACKEND ---

  // 1. Obtener estadísticas de categorías para el nav
  const { data: categoryStats } = usePriceRanges();

  // 2. Obtener estadísticas de marcas para el sidebar
  const { data: brandStats } = useBrandStats();

  // 3. Construir lista de categorías dinámica
  const categories: Category[] = useMemo(() => {
    if (!categoryStats) return [];

    // Agregar categoría "Todos"
    const allCategory: Category = {
      id: 'all',
      name: 'Todos',
      icon: 'Grid',
      count: categoryStats.reduce((acc, curr) => acc + curr.total_productos, 0)
    };

    const dynamicCategories = categoryStats.map(stat => ({
      id: stat.categoria,
      name: stat.categoria, // Podríamos mapear nombres si fuera necesario
      icon: 'Tag', // Icono por defecto, idealmente vendría del backend o un mapa
      count: stat.total_productos
    }));

    return [allCategory, ...dynamicCategories];
  }, [categoryStats]);

  // 4. Construir lista de marcas dinámica
  const availableBrands = useMemo(() => {
    if (!brandStats) return [];
    return brandStats.map(b => b.marca);
  }, [brandStats]);

  // 5. Construir rangos de precios dinámicos basados en estadísticas
  const dynamicPriceRanges: PriceRange[] = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) return [];

    // Encontrar min y max global
    let min = Infinity;
    let max = 0;

    categoryStats.forEach(stat => {
      if (stat.precio_minimo < min) min = stat.precio_minimo;
      if (stat.precio_maximo > max) max = stat.precio_maximo;
    });

    if (min === Infinity) return [];

    // Si min y max son iguales o muy cercanos, devolver un solo rango
    if (max - min < 5) {
      return [
        { id: 'all', label: 'Todos los precios', min: 0, max: Infinity },
        { id: 'unique', label: `$${Math.round(min)} - $${Math.round(max)}`, min: min, max: max }
      ];
    }

    // Crear 4 rangos distribuidos
    const range = (max - min) / 4;

    const r1 = Math.round(min + range);
    const r2 = Math.round(min + range * 2);
    const r3 = Math.round(min + range * 3);

    // Evitar duplicados en labels si los redondeos coinciden
    if (r1 === r2 || r2 === r3) {
      return [
        { id: 'all', label: 'Todos los precios', min: 0, max: Infinity },
        { id: 'low', label: `Menos de $${Math.round((min + max) / 2)}`, min: 0, max: Math.round((min + max) / 2) },
        { id: 'high', label: `Más de $${Math.round((min + max) / 2)}`, min: Math.round((min + max) / 2), max: Infinity },
      ];
    }

    return [
      { id: 'all', label: 'Todos los precios', min: 0, max: Infinity },
      { id: 'range1', label: `Menos de $${r1}`, min: 0, max: r1 },
      { id: 'range2', label: `$${r1} - $${r2}`, min: r1, max: r2 },
      { id: 'range3', label: `$${r2} - $${r3}`, min: r2, max: r3 },
      { id: 'range4', label: `Más de $${r3}`, min: r3, max: Infinity },
    ];
  }, [categoryStats]);


  // Construir parámetros de búsqueda para el backend
  const searchParams: ProductSearchParams = useMemo(() => {
    const params: ProductSearchParams = {
      page: 1,
      page_size: 50,
    };

    if (selectedCategory && selectedCategory !== 'all') {
      params.categoria = selectedCategory;
    }

    if (selectedPriceRange) {
      params.min_precio = selectedPriceRange.min;
      params.max_precio = selectedPriceRange.max === Infinity ? undefined : selectedPriceRange.max;
    }

    if (selectedBrands.length > 0) {
      params.marca = selectedBrands[0]; // Backend soporta una marca a la vez
    }

    if (searchQuery) {
      params.keyword = searchQuery;
    }

    return params;
  }, [searchQuery, selectedCategory, selectedBrands, selectedPriceRange]);

  // Consultar productos del backend
  const { data: productsData, isLoading, error } = useProductSearch(searchParams);

  // Transformar productos del backend al formato del frontend
  const backendProducts = useMemo(() => {
    if (!productsData?.items) return [];
    const products = transformProductList(productsData.items);
    // Deduplicar productos por ID para evitar errores de keys duplicadas
    const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());
    return uniqueProducts;
  }, [productsData]);

  // Aplicar filtros locales que el backend no soporta (tags semánticos)
  const filteredProducts = useMemo(() => {
    let result = [...backendProducts];

    // Filtro de tags semánticos (local)
    if (selectedSemanticTags.length > 0) {
      result = result.filter((p) =>
        selectedSemanticTags.some((tag) => p.semanticTags?.includes(tag))
      );
    }

    // Filtro de marcas múltiples (local, ya que backend solo soporta una)
    if (selectedBrands.length > 1) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Ordenamiento local
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        // Relevance - keep original order with premium first
        result.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
    }

    return result;
  }, [backendProducts, selectedSemanticTags, selectedBrands, sortBy]);

  // Obtener productos seleccionados para comparación
  const selectedProducts = useMemo(
    () => filteredProducts.filter((p) => compareIds.includes(p.id)),
    [filteredProducts, compareIds]
  );

  // Recomendaciones del backend (usando usuario de ejemplo)
  const { data: recommendationsData } = useRecommendations('Comprador_Juan', 5);

  // Transformar recomendaciones
  const recommendations = useMemo(() => {
    if (!recommendationsData?.items) {
      // Fallback: productos con alto rating si no hay recomendaciones
      const fallback = filteredProducts.filter((p) => p.rating >= 4.7).slice(0, 5);
      return Array.from(new Map(fallback.map(p => [p.id, p])).values());
    }
    const recs = transformProductList(recommendationsData.items.map(r => r.producto));
    return Array.from(new Map(recs.map(p => [p.id, p])).values());
  }, [recommendationsData, filteredProducts]);

  const handleToggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        toast.error('Máximo 4 productos para comparar');
        return prev;
      }
      return [...prev, productId];
    });
  };

  const handleAddToCart = (productId: string) => {
    setCartCount((prev) => prev + 1);
    const product = filteredProducts.find((p) => p.id === productId);
    toast.success(`${product?.name} añadido al carrito`);
  };

  const handleClearFilters = () => {
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setSelectedSemanticTags([]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartCount={cartCount}
        compareCount={compareIds.length}
        onSearchChange={setSearchQuery}
        onCompareClick={() => setIsCompareOpen(true)}
      />

      <CategoryNav
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <HeroSection />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <FilterSidebar
            selectedBrands={selectedBrands}
            selectedPriceRange={selectedPriceRange}
            selectedSemanticTags={selectedSemanticTags}
            availableBrands={availableBrands}
            priceRanges={dynamicPriceRanges}
            onBrandChange={setSelectedBrands}
            onPriceRangeChange={setSelectedPriceRange}
            onSemanticTagChange={setSelectedSemanticTags}
            onClearFilters={handleClearFilters}
          />

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedCategory && selectedCategory !== 'all'
                    ? categories.find((c) => c.id === selectedCategory)?.name
                    : 'Todos los Productos'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length} productos encontrados
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevancia</SelectItem>
                    <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                    <SelectItem value="rating">Mejor valorados</SelectItem>
                    <SelectItem value="reviews">Más reseñas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Cargando productos desde el backend...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="text-center">
                  <p className="text-destructive font-semibold mb-2">Error al cargar productos</p>
                  <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Error desconocido'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Asegúrate de que el backend esté corriendo en http://localhost:8000
                  </p>
                </div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <motion.div
                layout
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'flex flex-col gap-4'
                }
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={compareIds.includes(product.id)}
                    onToggleCompare={handleToggleCompare}
                    onAddToCart={handleAddToCart}
                    index={index}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Recommendation Section - Req 6 */}
      <RecommendationSection recommendations={recommendations} onAddToCart={handleAddToCart} />

      {/* Market Analysis SPARQL - Req 7 */}
      <MarketAnalysisPanel />

      {/* OWL Classification - Req 8 */}
      <OWLClassificationPanel />

      {/* Consistency Validator - Req 9 */}
      <ConsistencyValidator />

      {/* Comparison Table Modal */}
      <ComparisonTable
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        selectedProducts={selectedProducts}
        onRemoveProduct={handleToggleCompare}
      />

      {/* Floating Compare Button */}
      {compareIds.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            variant="hero"
            size="lg"
            onClick={() => setIsCompareOpen(true)}
            className="shadow-lg animate-pulse-glow"
          >
            Comparar {compareIds.length} productos
          </Button>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-primary-foreground font-bold text-sm">SC</span>
              </div>
              <span className="font-semibold text-foreground">SmartCompareMarket</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SmartCompareMarket. Marketplace Semántico con Razonamiento OWL.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
