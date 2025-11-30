import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, CheckCircle, XCircle, Info, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Product } from '@/types/marketplace';
import { cn } from '@/lib/utils';
import { useProductSearch } from '@/hooks/useProducts';
import { transformProductList } from '@/lib/transformers';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate: (product: Product, allProducts: Product[]) => { valid: boolean; message?: string };
}

interface ValidationResult {
  productId: string;
  productName: string;
  issues: { rule: ValidationRule; message: string }[];
  score: number;
}

const validationRules: ValidationRule[] = [
  {
    id: 'price-positive',
    name: 'Precio positivo',
    description: 'El precio debe ser mayor que cero',
    severity: 'error',
    validate: (p) => ({
      valid: p.price > 0,
      message: p.price <= 0 ? 'Precio inválido o negativo' : undefined
    })
  },
  {
    id: 'original-price-higher',
    name: 'Precio original mayor',
    description: 'El precio original debe ser mayor que el precio actual',
    severity: 'warning',
    validate: (p) => ({
      valid: !p.originalPrice || p.originalPrice > p.price,
      message: p.originalPrice && p.originalPrice <= p.price
        ? 'El precio original no es mayor que el actual' : undefined
    })
  },
  {
    id: 'has-specifications',
    name: 'Especificaciones requeridas',
    description: 'El producto debe tener al menos 3 especificaciones',
    severity: 'warning',
    validate: (p) => ({
      valid: p.specifications.length >= 3,
      message: p.specifications.length < 3
        ? `Solo tiene ${p.specifications.length} especificaciones` : undefined
    })
  },
  {
    id: 'semantic-tags',
    name: 'Tags semánticos',
    description: 'El producto debe tener al menos 2 tags semánticos',
    severity: 'info',
    validate: (p) => ({
      valid: (p.semanticTags?.length || 0) >= 2,
      message: (p.semanticTags?.length || 0) < 2
        ? `Solo tiene ${p.semanticTags?.length || 0} tags semánticos` : undefined
    })
  },
  {
    id: 'rating-valid',
    name: 'Rating válido',
    description: 'El rating debe estar entre 0 y 5',
    severity: 'error',
    validate: (p) => ({
      valid: p.rating >= 0 && p.rating <= 5,
      message: p.rating < 0 || p.rating > 5
        ? `Rating fuera de rango: ${p.rating}` : undefined
    })
  },
  {
    id: 'ontology-class',
    name: 'Clase ontológica válida',
    description: 'Debe tener una jerarquía de clase OWL válida',
    severity: 'error',
    validate: (p) => ({
      valid: !!p.ontologyClass && p.ontologyClass.includes(' > ') && p.ontologyClass.split(' > ').length >= 2,
      message: !p.ontologyClass || !p.ontologyClass.includes(' > ')
        ? 'Jerarquía ontológica incompleta' : undefined
    })
  },
  {
    id: 'relations-consistency',
    name: 'Consistencia de relaciones',
    description: 'Las relaciones deben apuntar a productos existentes',
    severity: 'warning',
    validate: (p, allProducts) => {
      if (!p.relations) return { valid: true };

      const invalidRelations = p.relations.filter(
        r => !allProducts.find(pr => pr.id === r.productId)
      );
      return {
        valid: invalidRelations.length === 0,
        message: invalidRelations.length > 0
          ? `${invalidRelations.length} relaciones apuntan a productos inexistentes` : undefined
      };
    }
  },
  {
    id: 'image-url',
    name: 'URL de imagen válida',
    description: 'El producto debe tener una URL de imagen válida',
    severity: 'warning',
    validate: (p) => ({
      valid: p.image.startsWith('http') && (p.image.includes('.jpg') || p.image.includes('.png') || p.image.includes('unsplash')),
      message: !p.image.startsWith('http') ? 'URL de imagen inválida' : undefined
    })
  }
];

export function ConsistencyValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [showOnlyIssues, setShowOnlyIssues] = useState(true);

  // Obtener productos del backend
  const { data: productsData, isLoading } = useProductSearch({ page: 1, page_size: 100 });

  const products = useMemo(() => {
    if (!productsData?.items) return [];
    return transformProductList(productsData.items);
  }, [productsData]);

  const runValidation = useCallback(() => {
    if (products.length === 0) return;

    setIsValidating(true);
    setValidationProgress(0);
    setResults([]);

    let currentIndex = 0;
    const validationResults: ValidationResult[] = [];

    const validateNext = () => {
      if (currentIndex >= products.length) {
        setIsValidating(false);
        setResults(validationResults);
        return;
      }

      const product = products[currentIndex];
      const issues: { rule: ValidationRule; message: string }[] = [];

      validationRules.forEach(rule => {
        const result = rule.validate(product, products);
        if (!result.valid && result.message) {
          issues.push({ rule, message: result.message });
        }
      });

      const score = Math.round(((validationRules.length - issues.length) / validationRules.length) * 100);

      validationResults.push({
        productId: product.id,
        productName: product.name,
        issues,
        score
      });

      currentIndex++;
      setValidationProgress((currentIndex / products.length) * 100);

      setTimeout(validateNext, 50);
    };

    validateNext();
  }, [products]);

  // Ejecutar validación cuando los productos estén cargados
  useEffect(() => {
    if (products.length > 0 && !isValidating && results.length === 0) {
      runValidation();
    }
  }, [products, isValidating, results.length, runValidation]);

  const filteredResults = showOnlyIssues
    ? results.filter(r => r.issues.length > 0)
    : results;

  const overallScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const totalErrors = results.reduce(
    (sum, r) => sum + r.issues.filter(i => i.rule.severity === 'error').length, 0
  );
  const totalWarnings = results.reduce(
    (sum, r) => sum + r.issues.filter(i => i.rule.severity === 'warning').length, 0
  );
  const totalInfo = results.reduce(
    (sum, r) => sum + r.issues.filter(i => i.rule.severity === 'info').length, 0
  );

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-premium" />;
      case 'info': return <Info className="h-4 w-4 text-info" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-secondary/10">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-8 bg-secondary/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-compatible to-compatible/60">
              <ShieldCheck className="h-5 w-5 text-compatible-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Validación de Consistencia</h2>
              <p className="text-sm text-muted-foreground">Verificación semántica de especificaciones OWL</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={runValidation}
            disabled={isValidating}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isValidating && "animate-spin")} />
            Revalidar
          </Button>
        </div>

        {/* Progress Bar */}
        {isValidating && (
          <div className="mb-6">
            <Progress value={validationProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Validando productos... {Math.round(validationProgress)}%
            </p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              {overallScore >= 90 ? (
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-compatible" />
              ) : overallScore >= 70 ? (
                <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-premium" />
              ) : (
                <ShieldX className="h-8 w-8 mx-auto mb-2 text-destructive" />
              )}
              <p className="text-2xl font-bold text-foreground">{overallScore}%</p>
              <p className="text-xs text-muted-foreground">Score Global</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-compatible" />
              <p className="text-2xl font-bold text-foreground">
                {results.filter(r => r.issues.length === 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Válidos</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold text-foreground">{totalErrors}</p>
              <p className="text-xs text-muted-foreground">Errores</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-premium" />
              <p className="text-2xl font-bold text-foreground">{totalWarnings}</p>
              <p className="text-xs text-muted-foreground">Advertencias</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Info className="h-6 w-6 mx-auto mb-2 text-info" />
              <p className="text-2xl font-bold text-foreground">{totalInfo}</p>
              <p className="text-xs text-muted-foreground">Información</p>
            </CardContent>
          </Card>
        </div>

        {/* Validation Rules */}
        <Card className="border-border/50 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reglas de Validación OWL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {validationRules.map(rule => (
                <div
                  key={rule.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30"
                >
                  {getSeverityIcon(rule.severity)}
                  <div>
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Resultados de Validación
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOnlyIssues(!showOnlyIssues)}
              >
                {showOnlyIssues ? 'Mostrar todos' : 'Solo con problemas'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              <AnimatePresence>
                {filteredResults.map((result, index) => (
                  <motion.div
                    key={result.productId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      result.issues.length === 0
                        ? "bg-compatible/10"
                        : result.issues.some(i => i.rule.severity === 'error')
                          ? "bg-destructive/10"
                          : "bg-premium/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {result.issues.length === 0 ? (
                        <CheckCircle className="h-5 w-5 text-compatible" />
                      ) : result.issues.some(i => i.rule.severity === 'error') ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-premium" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{result.productName}</p>
                        {result.issues.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.issues.map((issue, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  issue.rule.severity === 'error' && "border-destructive text-destructive",
                                  issue.rule.severity === 'warning' && "border-premium text-premium",
                                  issue.rule.severity === 'info' && "border-info text-info"
                                )}
                              >
                                {issue.message}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={result.score >= 90 ? "default" : result.score >= 70 ? "secondary" : "destructive"}
                    >
                      {result.score}%
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
