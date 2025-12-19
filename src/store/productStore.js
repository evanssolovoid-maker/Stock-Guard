import { create } from "zustand";
import { productsService } from "../services/products.service";
import { getBusinessOwnerId } from "../utils/business";

export const useProductStore = create((set, get) => ({
  // State
  products: [],
  loading: false,
  error: null,
  searchQuery: "",
  categoryFilter: "all",
  viewMode: "table", // 'table' or 'grid'

  // Actions
  loadProducts: async (user) => {
    set({ loading: true, error: null });
    try {
      const filters = {
        search: get().searchQuery,
        category: get().categoryFilter,
      };
      const products = await productsService.fetchProducts(user, filters);
      set({ products, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addProduct: async (productData, user) => {
    try {
      // Add business_owner_id to productData if user provided
      if (user) {
        productData.business_owner_id = getBusinessOwnerId(user);
        productData.owner_id = productData.business_owner_id; // Keep for backward compatibility
      }
      const newProduct = await productsService.createProduct(productData);
      set((state) => ({
        products: [newProduct, ...state.products],
      }));
      return newProduct;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const updatedProduct = await productsService.updateProduct(id, updates);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
      }));
      return updatedProduct;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  removeProduct: async (id) => {
    try {
      await productsService.deleteProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setCategoryFilter: (category) => {
    set({ categoryFilter: category });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  clearFilters: () => {
    set({ searchQuery: "", categoryFilter: "all" });
  },

  // Computed values
  getFilteredProducts: () => {
    const { products, searchQuery, categoryFilter } = get();
    let filtered = [...products];

    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    return filtered;
  },

  getLowStockProducts: (threshold = 10) => {
    return get().products.filter((p) => p.quantity <= threshold);
  },
}));
