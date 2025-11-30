import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/marketplace';

interface RecommendationSectionProps {
  recommendations: Product[];
  onAddToCart: (productId: string) => void;
}

export function RecommendationSection({ recommendations, onAddToCart }: RecommendationSectionProps) {
  if (recommendations.length === 0) return null;

  return (
    <section className="py-12 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Recomendados para ti</h2>
              <p className="text-sm text-muted-foreground">Basado en tu perfil semántico</p>
            </div>
          </div>
          <Button variant="ghost" className="hidden sm:flex">
            Ver más
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recommendations.slice(0, 5).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-card transition-all"
            >
              <div className="aspect-square bg-secondary/30">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-xs text-primary font-medium">{product.brand}</p>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3 w-3 fill-premium text-premium" />
                  <span className="text-xs">{product.rating}</span>
                </div>
                <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
