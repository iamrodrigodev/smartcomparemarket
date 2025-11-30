import { Search, ShoppingCart, User, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  cartCount: number;
  compareCount: number;
  onSearchChange: (query: string) => void;
  onCompareClick: () => void;
}

export function Header({ cartCount, compareCount, onSearchChange, onCompareClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-md">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">SmartCompare</h1>
              <p className="text-[10px] text-muted-foreground -mt-1">Marketplace Semántico</p>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div 
            className="flex-1 max-w-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar productos, marcas, especificaciones..."
                className="w-full pl-10 pr-4 h-10 bg-secondary/50 border-transparent focus:border-primary focus:bg-card"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Compare Button */}
            <Button
              variant="compare"
              size="sm"
              className="relative hidden sm:flex"
              onClick={onCompareClick}
              disabled={compareCount < 2}
            >
              Comparar
              {compareCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs"
                >
                  {compareCount}
                </Badge>
              )}
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* User */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <User className="h-5 w-5" />
            </Button>

            {/* Mobile Menu */}
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
