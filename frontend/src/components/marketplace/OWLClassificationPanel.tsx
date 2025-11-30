import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, ChevronRight, ChevronDown, Layers, GitBranch, Tag, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { products, categories, Product } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

interface OntologyNode {
  id: string;
  name: string;
  children: OntologyNode[];
  products: Product[];
  level: number;
}

// Build ontology tree from products
function buildOntologyTree(): OntologyNode[] {
  const tree: OntologyNode[] = [];
  
  // Group products by their ontology class hierarchy
  const ontologyMap = new Map<string, Product[]>();
  
  products.forEach(product => {
    const path = product.ontologyClass;
    if (!ontologyMap.has(path)) {
      ontologyMap.set(path, []);
    }
    ontologyMap.get(path)!.push(product);
  });

  // Build tree structure
  const rootNodes = new Map<string, OntologyNode>();

  ontologyMap.forEach((prods, path) => {
    const parts = path.split(' > ');
    let currentLevel = rootNodes;
    let parent: OntologyNode | null = null;

    parts.forEach((part, index) => {
      const nodeId = parts.slice(0, index + 1).join(' > ');
      
      if (!currentLevel.has(part)) {
        const newNode: OntologyNode = {
          id: nodeId,
          name: part,
          children: [],
          products: index === parts.length - 1 ? prods : [],
          level: index
        };
        
        if (parent) {
          parent.children.push(newNode);
        } else {
          tree.push(newNode);
        }
        
        currentLevel.set(part, newNode);
      }
      
      parent = currentLevel.get(part)!;
      const childMap = new Map<string, OntologyNode>();
      parent.children.forEach(child => childMap.set(child.name, child));
      currentLevel = childMap;
    });
  });

  return tree;
}

interface TreeNodeProps {
  node: OntologyNode;
  onSelectProduct: (product: Product) => void;
}

function TreeNode({ node, onSelectProduct }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(node.level < 1);
  const hasChildren = node.children.length > 0 || node.products.length > 0;
  const totalProducts = node.products.length + node.children.reduce((sum, child) => sum + countProducts(child), 0);

  return (
    <div className="ml-2">
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors",
          "hover:bg-secondary/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}
        
        <Layers className={cn(
          "h-4 w-4",
          node.level === 0 ? "text-primary" : 
          node.level === 1 ? "text-equivalent" : "text-compatible"
        )} />
        
        <span className="font-medium text-sm text-foreground">{node.name}</span>
        
        <Badge variant="secondary" className="text-xs ml-auto">
          {totalProducts}
        </Badge>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-4 border-l border-border/50"
          >
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} onSelectProduct={onSelectProduct} />
            ))}
            
            {node.products.length > 0 && (
              <div className="ml-4 space-y-1 py-2">
                {node.products.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 py-1 px-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer hover:bg-secondary/30 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(product);
                    }}
                  >
                    <Tag className="h-3 w-3" />
                    <span className="truncate">{product.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">${product.price}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function countProducts(node: OntologyNode): number {
  return node.products.length + node.children.reduce((sum, child) => sum + countProducts(child), 0);
}

interface OWLClassificationPanelProps {
  onProductSelect?: (product: Product) => void;
}

export function OWLClassificationPanel({ onProductSelect }: OWLClassificationPanelProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const ontologyTree = buildOntologyTree();

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    onProductSelect?.(product);
  };

  // Calculate subsumption statistics
  const subsumptionStats = {
    totalClasses: new Set(products.map(p => p.ontologyClass)).size,
    rootClasses: ontologyTree.length,
    maxDepth: Math.max(...products.map(p => p.ontologyClass.split(' > ').length)),
    avgDepth: (products.reduce((sum, p) => sum + p.ontologyClass.split(' > ').length, 0) / products.length).toFixed(1)
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent">
            <Network className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Clasificación OWL - Subsunción</h2>
            <p className="text-sm text-muted-foreground">Jerarquía ontológica de productos mediante razonamiento OWL</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ontology Tree */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                Árbol de Subsunción OWL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {ontologyTree.map(node => (
                  <TreeNode key={node.id} node={node} onSelectProduct={handleSelectProduct} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats and Selected Product */}
          <div className="space-y-4">
            {/* Subsumption Stats */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estadísticas de Subsunción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Clases totales:</span>
                  <Badge variant="secondary">{subsumptionStats.totalClasses}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Clases raíz:</span>
                  <Badge variant="secondary">{subsumptionStats.rootClasses}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Profundidad máx:</span>
                  <Badge variant="secondary">{subsumptionStats.maxDepth}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Profundidad prom:</span>
                  <Badge variant="secondary">{subsumptionStats.avgDepth}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Selected Product Classification */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-compatible" />
                      Clasificación Automática
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedProduct.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProduct.brand}</p>
                    </div>
                    
                    <div className="bg-card rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Clase OWL inferida:</p>
                      <code className="text-xs text-primary font-mono">
                        {selectedProduct.ontologyClass}
                      </code>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Tags semánticos:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProduct.semanticTags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>✓ Clasificado mediante subsunción OWL</p>
                      <p>✓ Razonador: Pellet</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
