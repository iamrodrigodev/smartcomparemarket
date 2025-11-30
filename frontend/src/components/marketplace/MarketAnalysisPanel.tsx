import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, TrendingUp, BarChart3, PieChart, Search, Play, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePriceRanges, useVendorStats, useBrandStats, useMarketOverview } from '@/hooks/useAnalysis';

interface QueryResult {
  query: string;
  description: string;
  data: any[];
}

const predefinedQueries: { id: string; name: string; sparql: string; description: string }[] = [
  {
    id: 'price-by-category',
    name: 'Precio promedio por categoría',
    sparql: `SELECT ?category (AVG(?price) AS ?avgPrice)
WHERE {
  ?product rdf:type :Product .
  ?product :hasCategory ?category .
  ?product :hasPrice ?price .
}
GROUP BY ?category
ORDER BY DESC(?avgPrice)`,
    description: 'Análisis de precios promedio agrupados por categoría de producto'
  },
  {
    id: 'brand-distribution',
    name: 'Distribución por marca',
    sparql: `SELECT ?brand (COUNT(?product) AS ?count)
WHERE {
  ?product rdf:type :Product .
  ?product :hasBrand ?brand .
}
GROUP BY ?brand
ORDER BY DESC(?count)`,
    description: 'Cantidad de productos por marca en el marketplace'
  },
  {
    id: 'price-range',
    name: 'Análisis de rangos de precio',
    sparql: `SELECT ?range (COUNT(?product) AS ?count)
WHERE {
  ?product rdf:type :Product .
  ?product :hasPrice ?price .
  BIND(
    IF(?price < 200, "Económico",
    IF(?price < 500, "Medio-bajo",
    IF(?price < 1000, "Medio",
    IF(?price < 1500, "Premium", "Luxury")))) AS ?range
  )
}
GROUP BY ?range`,
    description: 'Segmentación de productos por rango de precio'
  }
];

export function MarketAnalysisPanel() {
  const [selectedQuery, setSelectedQuery] = useState<string>('price-by-category');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);

  // Consultar datos del backend
  const { data: priceRangesData } = usePriceRanges();
  const { data: brandStatsData } = useBrandStats();
  const { data: marketOverviewData } = useMarketOverview();

  const executeQuery = () => {
    setIsExecuting(true);

    // Ejecutar consulta con datos reales del backend
    setTimeout(() => {
      const query = predefinedQueries.find(q => q.id === selectedQuery);
      if (!query) {
        setIsExecuting(false);
        return;
      }

      let data: any[] = [];

      switch (selectedQuery) {
        case 'price-by-category':
          if (priceRangesData) {
            data = priceRangesData.map(stat => ({
              category: stat.categoria,
              avgPrice: stat.precio_promedio.toFixed(2),
              minPrice: stat.precio_minimo.toFixed(2),
              maxPrice: stat.precio_maximo.toFixed(2),
              productCount: stat.total_productos
            }));
          }
          break;

        case 'brand-distribution':
          if (brandStatsData) {
            const total = brandStatsData.reduce((sum, b) => sum + b.total_productos, 0);
            data = brandStatsData.map(brand => ({
              brand: brand.marca,
              count: brand.total_productos,
              avgPrice: brand.precio_promedio.toFixed(2),
              percentage: total > 0 ? ((brand.total_productos / total) * 100).toFixed(1) : '0'
            }));
          }
          break;

        case 'price-range':
          if (priceRangesData) {
            const ranges = [
              { label: 'Económico', min: 0, max: 200 },
              { label: 'Medio-bajo', min: 200, max: 500 },
              { label: 'Medio', min: 500, max: 1000 },
              { label: 'Premium', min: 1000, max: 1500 },
              { label: 'Luxury', min: 1500, max: Infinity }
            ];

            const totalProducts = priceRangesData.reduce((sum, s) => sum + s.total_productos, 0);

            data = ranges.map(range => {
              const count = priceRangesData.filter(
                stat => stat.precio_promedio >= range.min && stat.precio_promedio < range.max
              ).reduce((sum, stat) => sum + stat.total_productos, 0);

              return {
                range: range.label,
                count,
                percentage: totalProducts > 0 ? ((count / totalProducts) * 100).toFixed(1) : '0'
              };
            }).filter(r => r.count > 0);
          }
          break;
      }

      setResults({
        query: query.sparql,
        description: query.description,
        data
      });
      setIsExecuting(false);
    }, 300);
  };

  const currentQuery = predefinedQueries.find(q => q.id === selectedQuery);

  return (
    <section className="py-8 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
            <Database className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Análisis de Mercado SPARQL</h2>
            <p className="text-sm text-muted-foreground">Consultas semánticas sobre el grafo de productos</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Query Panel */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Consulta SPARQL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedQuery} onValueChange={setSelectedQuery}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar consulta" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedQueries.map(q => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={executeQuery} disabled={isExecuting}>
                  <Play className="h-4 w-4 mr-1" />
                  {isExecuting ? 'Ejecutando...' : 'Ejecutar'}
                </Button>
              </div>

              {currentQuery && (
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                  <pre className="text-muted-foreground whitespace-pre-wrap">{currentQuery.sparql}</pre>
                </div>
              )}

              {currentQuery && (
                <p className="text-sm text-muted-foreground">{currentQuery.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Resultados
                {results && (
                  <Badge variant="secondary" className="ml-2">
                    {results.data.length} registros
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isExecuting ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : results ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 max-h-[300px] overflow-y-auto"
                >
                  {results.data.map((row, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-secondary/30 rounded-lg p-3 text-sm"
                    >
                      {Object.entries(row).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-1">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <span className="font-medium text-foreground">
                            {key.includes('Price') || key.includes('price')
                              ? `$${value}`
                              : key.includes('percentage')
                                ? `${value}%`
                                : String(value)}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ejecuta una consulta para ver resultados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-compatible" />
              <p className="text-2xl font-bold text-foreground">
                {priceRangesData?.reduce((sum, s) => sum + s.total_productos, 0) || 0}
              </p>
              <p className="text-xs text-muted-foreground">Productos en Ontología</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <PieChart className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {priceRangesData?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Categorías</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-equivalent" />
              <p className="text-2xl font-bold text-foreground">
                {brandStatsData?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Marcas</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Database className="h-6 w-6 mx-auto mb-2 text-info" />
              <p className="text-2xl font-bold text-foreground">
                ${marketOverviewData?.precio_promedio_global.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground">Precio Promedio</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
