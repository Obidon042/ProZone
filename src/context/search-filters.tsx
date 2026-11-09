import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PropertyTypeFilter = "All" | "House" | "Apartment" | "Villa";
export type ListingTypeFilter = "All" | "For Rent" | "For Sale";

export type SearchFilters = {
  propertyType: PropertyTypeFilter;
  listingType: ListingTypeFilter;
  minimumPrice: string;
  maximumPrice: string;
  location: string;
  bedrooms: number | null;
};

const initialFilters: SearchFilters = {
  propertyType: "All",
  listingType: "All",
  minimumPrice: "",
  maximumPrice: "",
  location: "All locations",
  bedrooms: null,
};

type SearchFiltersContextValue = {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
};

const SearchFiltersContext =
  createContext<SearchFiltersContextValue | null>(null);

export function SearchFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState(initialFilters);
  const value = useMemo(
    () => ({
      filters,
      setFilters,
      clearFilters: () => setFilters(initialFilters),
    }),
    [filters],
  );

  return (
    <SearchFiltersContext.Provider value={value}>
      {children}
    </SearchFiltersContext.Provider>
  );
}

export function useSearchFilters() {
  const context = useContext(SearchFiltersContext);
  if (!context) {
    throw new Error(
      "useSearchFilters must be used within SearchFiltersProvider",
    );
  }
  return context;
}
