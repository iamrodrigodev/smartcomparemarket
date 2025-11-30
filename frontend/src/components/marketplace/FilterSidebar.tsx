import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { categories, brands, priceRanges, semanticFilters } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  selectedBrands: string[];
  selectedPriceRange: { min: number; max: number } | null;
  selectedSemanticTags: string[];
  onBrandChange: (brands: string[]) => void;
  onPriceRangeChange: (range: { min: number; max: number } | null) => void;
  onSemanticTagChange: (tags: string[]) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({
  selectedBrands,
  selectedPriceRange,
  selectedSemanticTags,
  onBrandChange,
  onPriceRangeChange,
  onSemanticTagChange,
  onClearFilters,
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState({
    brands: true,
    price: true,
    semantic: true,
  });

  const [priceValue, setPriceValue] = useState([0, 2500]);

  const activeFiltersCount = selectedBrands.length + (selectedPriceRange ? 1 : 0) + selectedSemanticTags.length;

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandChange(selectedBrands.filter((b) => b !== brand));
    } else {
      onBrandChange([...selectedBrands, brand]);
    }
  };

  const toggleSemanticTag = (tag: string) => {
    if (selectedSemanticTags.includes(tag)) {
      onSemanticTagChange(selectedSemanticTags.filter((t) => t !== tag));
    } else {
      onSemanticTagChange([...selectedSemanticTags, tag]);
    }
  };

  const handlePriceChange = (value: number[]) => {
    setPriceValue(value);
    onPriceRangeChange({ min: value[0], max: value[1] });
  };

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="sticky top-20 bg-card rounded-2xl border border-border/50 p-4 shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Filtros</h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs h-8">
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Semantic Tags */}
        <Collapsible
          open={openSections.semantic}
          onOpenChange={(open) => setOpenSections({ ...openSections, semantic: open })}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-t border-border/50">
            <span className="font-medium text-sm">Filtros Semánticos</span>
            {openSections.semantic ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-2 pb-3"
            >
              {semanticFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => toggleSemanticTag(filter.id)}
                  className={cn(
                    "filter-chip",
                    selectedSemanticTags.includes(filter.id) && "filter-chip-active"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* Brands */}
        <Collapsible
          open={openSections.brands}
          onOpenChange={(open) => setOpenSections({ ...openSections, brands: open })}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-t border-border/50">
            <span className="font-medium text-sm">Marcas</span>
            {openSections.brands ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 pb-3"
            >
              {brands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <Checkbox
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={() => toggleBrand(brand)}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {brand}
                  </span>
                </label>
              ))}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* Price Range */}
        <Collapsible
          open={openSections.price}
          onOpenChange={(open) => setOpenSections({ ...openSections, price: open })}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-t border-border/50">
            <span className="font-medium text-sm">Rango de Precio</span>
            {openSections.price ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pb-3"
            >
              <div className="px-2 mb-4">
                <Slider
                  value={priceValue}
                  onValueChange={handlePriceChange}
                  max={2500}
                  min={0}
                  step={50}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">${priceValue[0]}</span>
                <span className="text-muted-foreground">${priceValue[1]}</span>
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* Quick Price Filters */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Filtros rápidos:</p>
          <div className="flex flex-wrap gap-1">
            {priceRanges.slice(0, 4).map((range) => (
              <button
                key={range.label}
                onClick={() => {
                  setPriceValue([range.min, range.max === Infinity ? 2500 : range.max]);
                  onPriceRangeChange({ min: range.min, max: range.max });
                }}
                className="text-xs px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
