import { create } from "zustand";
import { salesService } from "../services/sales.service";
import { notificationsService } from "../services/notifications.service";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

export const useSalesStore = create((set, get) => ({
  // State
  sales: [],
  todayStats: {
    revenue: 0,
    count: 0,
    yesterdayRevenue: 0,
  },
  recentSales: [],
  loading: false,
  error: null,
  realtimeSubscription: null,

  // Actions
  loadSales: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await salesService.fetchSales(filters);
      set({ sales: result.data, loading: false });
      return result;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error("Failed to load sales: " + error.message);
      throw error;
    }
  },

  loadTodayStats: async (ownerId) => {
    try {
      const [count, revenue, yesterdayRevenue] = await Promise.all([
        salesService.getSalesToday(ownerId),
        salesService.getTodayRevenue(ownerId),
        salesService.getYesterdayRevenue(ownerId),
      ]);

      set({
        todayStats: {
          count,
          revenue,
          yesterdayRevenue,
        },
      });
    } catch (error) {
      console.error("Error loading today stats:", error);
      set({ error: error.message });
    }
  },

  loadRecentSales: async (ownerId, limit = 10) => {
    try {
      const result = await salesService.fetchSales({
        ownerId,
        limit,
        offset: 0,
      });
      set({ recentSales: result.data || [] });
    } catch (error) {
      console.error("Error loading recent sales:", error);
    }
  },

  addSale: (sale) => {
    set((state) => {
      // Check if sale already exists to avoid duplicates
      const saleExists = state.sales.some((s) => s.id === sale.id);
      if (saleExists) {
        return state; // Don't add duplicate
      }
      return {
        sales: [sale, ...state.sales],
        recentSales: [sale, ...state.recentSales].slice(0, 10),
      };
    });
  },

  // Real-time subscription
  subscribeToSales: (ownerId) => {
    // Unsubscribe from existing subscription if any
    const existingSub = get().realtimeSubscription;
    if (existingSub) {
      supabase.removeChannel(existingSub);
    }

    // Subscribe to new sales
    const channel = supabase
      .channel("sales-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sales",
          filter: `owner_id=eq.${ownerId}`,
        },
        async (payload) => {
          console.log("New sale detected:", payload.new);

          // Fetch the complete sale record with items and worker details
          try {
            const { data: sale, error } = await supabase
              .from("sales")
              .select(
                `
                *,
                items:sales_items(
                  *,
                  product:products(*)
                ),
                worker:user_profiles!sales_worker_id_fkey(id, username, business_name, phone_number)
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (error) throw error;

            // Add to store
            get().addSale(sale);

            // Update today's stats
            get().loadTodayStats(ownerId);

            // Show browser notification (checks user preferences)
            notificationsService.showBrowserNotification(sale, ownerId).catch(
              (error) => {
                console.error("Error showing browser notification:", error);
              }
            );
          } catch (error) {
            console.error("Error fetching new sale:", error);
          }
        }
      )
      .subscribe();

    set({ realtimeSubscription: channel });
  },

  unsubscribeFromSales: () => {
    const subscription = get().realtimeSubscription;
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ realtimeSubscription: null });
    }
  },

  reset: () => {
    get().unsubscribeFromSales();
    set({
      sales: [],
      todayStats: {
        revenue: 0,
        count: 0,
        yesterdayRevenue: 0,
      },
      recentSales: [],
      loading: false,
      error: null,
    });
  },
}));
