import { motion } from 'framer-motion';
import { Category } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export function CategoryNav({ categories, selectedCategory, onCategorySelect }: CategoryNavProps) {
  return (
    <nav className="border-b border-border/50 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategorySelect(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              selectedCategory === null
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
            )}
          >
            <span>🏠</span>
            <span>Todos</span>
          </motion.button>

          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategorySelect(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
              )}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span className="text-xs opacity-70">({category.productCount})</span>
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
}
