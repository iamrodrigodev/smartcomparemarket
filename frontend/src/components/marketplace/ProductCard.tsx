import { motion } from 'framer-motion';
import { Star, ShoppingCart, GitCompare, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/data/mockProducts';
import { SemanticBadge } from './SemanticBadge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onToggleCompare: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  index: number;
}

export function ProductCard({ product, isSelected, onToggleCompare, onAddToCart, index }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative bg-card rounded-2xl border border-border/50 overflow-hidden shadow-card transition-all duration-300",
        isSelected && "ring-2 ring-equivalent shadow-lg"
      )}
    >
      {/* Premium Badge */}
      {product.isPremium && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-accent text-accent-foreground gap-1 font-semibold">
            <Sparkles className="h-3 w-3" />
            Premium
          </Badge>
        </div>
      )}

      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive" className="font-bold">
            -{discount}%
          </Badge>
        </div>
      )}

      {/* Compare Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        {!product.isPremium && (
          <div
            onClick={() => onToggleCompare(product.id)}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-md border-2 cursor-pointer transition-all",
              isSelected
                ? "bg-equivalent border-equivalent text-equivalent-foreground"
                : "bg-card/80 border-border hover:border-equivalent"
            )}
          >
            {isSelected && <Check className="h-4 w-4" />}
          </div>
        )}
        {product.isPremium && (
          <div className="mt-8">
            <div
              onClick={() => onToggleCompare(product.id)}
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-md border-2 cursor-pointer transition-all",
                isSelected
                  ? "bg-equivalent border-equivalent text-equivalent-foreground"
                  : "bg-card/80 border-border hover:border-equivalent"
              )}
            >
              {isSelected && <Check className="h-4 w-4" />}
            </div>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-secondary/30 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand & Category */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-primary">{product.brand}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{product.subcategory}</span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-premium text-premium" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews} reviews)</span>
        </div>

        {/* Semantic Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.semanticTags.slice(0, 3).map((tag) => (
            <SemanticBadge key={tag} type="tag" label={tag} showIcon={false} />
          ))}
        </div>

        {/* Relations indicators */}
        {product.relations.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.relations.filter(r => r.type === 'equivalent').length > 0 && (
              <SemanticBadge type="equivalent" label={`${product.relations.filter(r => r.type === 'equivalent').length} equiv.`} />
            )}
            {product.relations.filter(r => r.type === 'compatible').length > 0 && (
              <SemanticBadge type="compatible" label={`${product.relations.filter(r => r.type === 'compatible').length} comp.`} />
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-foreground">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onAddToCart(product.id)}
          >
            <ShoppingCart className="h-4 w-4" />
            Añadir
          </Button>
          <Button
            variant={isSelected ? "compare" : "outline"}
            size="sm"
            onClick={() => onToggleCompare(product.id)}
          >
            <GitCompare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ontology Class */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-muted-foreground truncate">
          📊 {product.ontologyClass}
        </p>
      </div>
    </motion.div>
  );
}
