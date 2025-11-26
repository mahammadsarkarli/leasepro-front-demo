import { useMemo, useCallback } from 'react';

interface SearchableItem {
  [key: string]: any;
}

interface SearchOptions<T> {
  searchTerm: string;
  items: T[];
  searchFields: (keyof T)[];
  additionalFilters?: Record<string, any>;
}

interface UseOptimizedSearchReturn<T> {
  filteredItems: T[];
  search: (options: SearchOptions<T>) => T[];
}
