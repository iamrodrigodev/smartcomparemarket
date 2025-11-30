import { useState, useMemo } from 'react';
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
import { products, categories, Product } from '@/data/mockProducts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.semanticTags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Price filter
    if (selectedPriceRange) {
      result = result.filter(
        (p) => p.price >= selectedPriceRange.min && p.price <= selectedPriceRange.max
      );
    }

    // Semantic tags filter
    if (selectedSemanticTags.length > 0) {
      result = result.filter((p) =>
        selectedSemanticTags.some((tag) => p.semanticTags.includes(tag))
      );
    }

    // Sorting
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
  }, [searchQuery, selectedCategory, selectedBrands, selectedPriceRange, selectedSemanticTags, sortBy]);

  // Get selected products for comparison
  const selectedProducts = useMemo(
    () => products.filter((p) => compareIds.includes(p.id)),
    [compareIds]
  );

  // Recommendations (products with high ratings and relations)
  const recommendations = useMemo(
    () => products.filter((p) => p.rating >= 4.7 && p.relations.length > 0).slice(0, 5),
    []
  );

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
    const product = products.find((p) => p.id === productId);
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
                  {selectedCategory
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
            {filteredProducts.length > 0 ? (
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
