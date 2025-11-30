import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Link2, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product, products as allProducts } from '@/data/mockProducts';
import { SemanticBadge } from './SemanticBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onRemoveProduct: (productId: string) => void;
}

export function ComparisonTable({ isOpen, onClose, selectedProducts, onRemoveProduct }: ComparisonTableProps) {
  // Get all unique specs across selected products
  const allSpecs = [...new Set(selectedProducts.flatMap((p) => p.specifications.map((s) => s.name)))];

  // Find relations between selected products
  const getRelationBetween = (product1: Product, product2: Product) => {
    return product1.relations.find((r) => r.productId === product2.id);
  };

  // Get the best value for a spec (lowest price, highest rating, etc.)
  const getBestValueForSpec = (specName: string): string | null => {
    const values = selectedProducts.map((p) => {
      const spec = p.specifications.find((s) => s.name === specName);
      return spec ? parseFloat(spec.value) : null;
    }).filter((v) => v !== null);

    if (values.length === 0) return null;

    // For most specs, higher is better
    if (specName === 'Peso' || specName === 'Response Time') {
      return Math.min(...values as number[]).toString();
    }
    return Math.max(...values as number[]).toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Comparación Inteligente
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Análisis semántico de {selectedProducts.length} productos
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="p-6">
            {/* Products Row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedProducts.length}, 1fr)` }}>
              {/* Empty cell for labels */}
              <div className="sticky left-0 bg-card z-10" />

              {/* Product Cards */}
              {selectedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative bg-secondary/30 rounded-xl p-4 text-center"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => onRemoveProduct(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg mx-auto mb-3"
                  />
                  <p className="text-xs text-primary font-medium">{product.brand}</p>
                  <h4 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h4>
                  
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-premium text-premium" />
                    <span className="text-sm font-medium">{product.rating}</span>
                  </div>

                  <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
                  {product.originalPrice && (
                    <p className="text-xs text-muted-foreground line-through">
                      ${product.originalPrice.toFixed(2)}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Semantic Relations */}
            <div className="mt-6 p-4 bg-secondary/20 rounded-xl">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-equivalent" />
                Relaciones Semánticas Detectadas
              </h3>
              <div className="grid gap-3">
                {selectedProducts.map((product1, i) =>
                  selectedProducts.slice(i + 1).map((product2) => {
                    const relation = getRelationBetween(product1, product2);
                    const reverseRelation = getRelationBetween(product2, product1);
                    const foundRelation = relation || reverseRelation;

                    if (!foundRelation) return null;

                    return (
                      <motion.div
                        key={`${product1.id}-${product2.id}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-card rounded-lg"
                      >
                        <span className="text-sm font-medium">{product1.name}</span>
                        <SemanticBadge type={foundRelation.type} label={foundRelation.type} />
                        <span className="text-sm font-medium">{product2.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {foundRelation.reason}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Specs Comparison Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-sm sticky left-0 bg-card">
                      Especificación
                    </th>
                    {selectedProducts.map((product) => (
                      <th key={product.id} className="text-center py-3 px-4 font-semibold text-sm min-w-[150px]">
                        {product.brand}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSpecs.map((specName, index) => {
                    const bestValue = getBestValueForSpec(specName);

                    return (
                      <motion.tr
                        key={specName}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/50 hover:bg-secondary/20"
                      >
                        <td className="py-3 px-4 text-sm font-medium sticky left-0 bg-card">
                          {specName}
                        </td>
                        {selectedProducts.map((product) => {
                          const spec = product.specifications.find((s) => s.name === specName);
                          const isBest = spec && bestValue && parseFloat(spec.value).toString() === bestValue;

                          return (
                            <td
                              key={product.id}
                              className={cn(
                                "text-center py-3 px-4 text-sm",
                                isBest && "bg-compatible/10 font-semibold text-compatible"
                              )}
                            >
                              {spec ? (
                                <span>
                                  {spec.value}
                                  {spec.unit && <span className="text-muted-foreground ml-1">{spec.unit}</span>}
                                  {isBest && <Check className="inline-block h-4 w-4 ml-1" />}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ontology Classification */}
            <div className="mt-6 p-4 bg-secondary/20 rounded-xl">
              <h3 className="font-semibold mb-3">📊 Clasificación Ontológica</h3>
              <div className="grid gap-2">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium min-w-[150px]">{product.name}:</span>
                    <code className="text-xs bg-card px-2 py-1 rounded">{product.ontologyClass}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button variant="hero">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Añadir todos al carrito
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
