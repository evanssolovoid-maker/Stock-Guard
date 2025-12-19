import { supabase } from "./supabase";
import { getBusinessOwnerId } from "../utils/business";

export const salesService = {
  /**
   * Log a multi-item sale using the database function
   */
  async logMultiItemSale(saleData) {
    const { ownerId, workerId, items } = saleData;

    // Format items for PostgreSQL function
    // Ensure product_id is a string (UUID) and quantity is a number
    const itemsArray = items.map((item) => ({
      product_id: String(item.productId), // Ensure it's a string UUID
      quantity: Number(item.quantity), // Ensure it's a number
    }));

    // Call the database function
    // Pass array directly - Supabase will automatically convert JavaScript arrays to JSONB
    const { data, error } = await supabase.rpc("log_multi_item_sale", {
      p_worker_id: workerId,
      p_owner_id: ownerId,
      p_items: itemsArray, // Pass array directly, Supabase handles JSONB conversion
    });

    if (error) {
      console.error("Multi-item sale error:", error);
      throw error;
    }

    // Extract sale_id from result
    const result = Array.isArray(data) ? data[0] : data;
    const saleId = result?.sale_id;

    if (!saleId) {
      throw new Error("Sale ID not returned from database function");
    }

    // Fetch the complete sale record with items
    const { data: sale, error: fetchError } = await supabase
      .from("sales")
      .select(
        `
        *,
        worker:user_profiles!sales_worker_id_fkey(id, username, business_name, phone_number)
      `
      )
      .eq("id", saleId)
      .single();

    if (fetchError) throw fetchError;

    // Fetch sale items with product details
    const { data: saleItems, error: itemsError } = await supabase
      .from("sales_items")
      .select(
        `
        *,
        product:products(*)
      `
      )
      .eq("sale_id", saleId);

    if (itemsError) throw itemsError;

    return {
      ...sale,
      items: saleItems || [],
    };
  },

  /**
   * Log a sale using the database function for atomic transaction (legacy single-item)
   */
  async logSale(saleData) {
    const { ownerId, workerId, productId, quantitySold, unitPrice, notes } =
      saleData;

    // Call the database function
    const { data, error } = await supabase.rpc("log_sale_transaction", {
      p_owner_id: ownerId,
      p_worker_id: workerId,
      p_product_id: productId,
      p_quantity_sold: quantitySold,
      p_unit_price: unitPrice,
      p_notes: notes || null,
    });

    if (error) throw error;

    // Fetch the complete sale record with product and worker details
    const { data: sale, error: fetchError } = await supabase
      .from("sales")
      .select(
        `
        *,
        product:products(*),
        worker:user_profiles!sales_worker_id_fkey(id, business_name, email, phone_number)
      `
      )
      .eq("id", data)
      .single();

    if (fetchError) throw fetchError;
    return sale;
  },

  /**
   * Get owner settings for discount calculation
   */
  async getOwnerSettings(ownerId) {
    const { data, error } = await supabase
      .from("owner_settings")
      .select("*")
      .eq("owner_id", ownerId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching owner settings:", error);
      throw error;
    }

    return (
      data || {
        discount_enabled: false,
        discount_threshold: 0,
        discount_percentage: 0,
      }
    );
  },

  /**
   * Fetch sales with filters (multi-item sales)
   */
  async fetchSales(filters = {}) {
    const {
      ownerId,
      workerId,
      productId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = filters;

    let query = supabase
      .from("sales")
      .select(
        `
        *,
        items:sales_items(
          *,
          product:products(*)
        ),
        worker:user_profiles!sales_worker_id_fkey(id, username, business_name, phone_number)
      `,
        { count: "exact" }
      )
      .order("sale_date", { ascending: false });

    if (ownerId) {
      // Use business_owner_id for multi-tenant filtering
      query = query.eq("business_owner_id", ownerId);
    }

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    if (startDate) {
      // Convert date string to start of day timestamp for proper filtering
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte("sale_date", start.toISOString());
    }

    if (endDate) {
      // Convert date string to end of day timestamp for proper filtering
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("sale_date", end.toISOString());
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Filter by productId if specified (filter in memory after fetching)
    let filteredData = data || [];
    if (productId && filteredData.length > 0) {
      filteredData = filteredData.filter((sale) =>
        sale.items?.some((item) => item.product_id === productId)
      );
    }

    return { data: filteredData, count: count || 0 };
  },

  /**
   * Get sales count for today
   */
  async getSalesToday(ownerId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count, error } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("business_owner_id", ownerId)
      .gte("sale_date", today.toISOString())
      .lt("sale_date", tomorrow.toISOString());

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get today's revenue
   */
  async getTodayRevenue(ownerId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("sales")
      .select("final_total")
      .eq("business_owner_id", ownerId)
      .gte("sale_date", today.toISOString())
      .lt("sale_date", tomorrow.toISOString());

    if (error) throw error;

    const revenue =
      data?.reduce((sum, sale) => sum + parseFloat(sale.final_total || 0), 0) ||
      0;
    return revenue;
  },

  /**
   * Get yesterday's revenue for comparison
   */
  async getYesterdayRevenue(ownerId) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from("sales")
      .select("final_total")
      .eq("business_owner_id", ownerId)
      .gte("sale_date", yesterday.toISOString())
      .lt("sale_date", today.toISOString());

    if (error) throw error;

    const revenue =
      data?.reduce((sum, sale) => sum + parseFloat(sale.final_total || 0), 0) ||
      0;
    return revenue;
  },

  /**
   * Get worker performance data
   */
  async getWorkerPerformance(ownerId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from("sales")
      .select(
        `
        *,
        items:sales_items(quantity_sold, line_total),
        worker:user_profiles!sales_worker_id_fkey(id, username, business_name, phone_number)
      `
      )
      .eq("business_owner_id", ownerId);

    if (startDate) {
      // Convert date string to start of day timestamp for proper filtering
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte("sale_date", start.toISOString());
    }

    if (endDate) {
      // Convert date string to end of day timestamp for proper filtering
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("sale_date", end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by worker
    const performance = {};
    data?.forEach((sale) => {
      const workerId = sale.worker?.id;
      if (!workerId) return;

      if (!performance[workerId]) {
        performance[workerId] = {
          worker: sale.worker,
          totalSales: 0,
          totalRevenue: 0,
        };
      }

      // Sum up quantities and revenue from all items in this sale
      const itemQuantities = (sale.items || []).reduce(
        (sum, item) => sum + parseInt(item.quantity_sold || 0),
        0
      );
      const itemRevenue = (sale.items || []).reduce(
        (sum, item) => sum + parseFloat(item.line_total || 0),
        0
      );

      performance[workerId].totalSales += itemQuantities;
      performance[workerId].totalRevenue += parseFloat(
        sale.final_total || itemRevenue
      );
    });

    return Object.values(performance);
  },

  /**
   * Get top selling products
   */
  async getTopSellingProducts(ownerId, dateRange = {}, limit = 10) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from("sales")
      .select(
        `
        *,
        items:sales_items(
          quantity_sold,
          line_total,
          product:products(*)
        )
      `
      )
      .eq("business_owner_id", ownerId);

    if (startDate) {
      // Convert date string to start of day timestamp for proper filtering
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte("sale_date", start.toISOString());
    }

    if (endDate) {
      // Convert date string to end of day timestamp for proper filtering
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("sale_date", end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by product from sales_items
    const productSales = {};
    data?.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const productId = item.product?.id;
        if (!productId) return;

        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            quantitySold: 0,
            revenue: 0,
          };
        }

        productSales[productId].quantitySold += parseInt(
          item.quantity_sold || 0
        );
        productSales[productId].revenue += parseFloat(item.line_total || 0);
      });
    });

    // Sort by revenue and return top N
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  /**
   * Export sales to CSV
   */
  exportSalesToCSV(sales) {
    if (!sales || sales.length === 0) {
      return "";
    }

    const headers = [
      "Date",
      "Product",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Worker",
      "Notes",
    ];

    const rows = sales.map((sale) => [
      new Date(sale.sale_date).toLocaleString(),
      sale.product?.name || "N/A",
      sale.quantity_sold,
      sale.unit_price,
      sale.total_amount,
      sale.worker?.business_name || sale.worker?.email || "N/A",
      sale.notes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    return csvContent;
  },

  /**
   * Get business owner ID for a worker/manager (multi-tenant helper function)
   */
  async getOwnerIdForWorker(workerId) {
    // Get the worker's profile to find their business_owner_id
    const { data, error } = await supabase
      .from("user_profiles")
      .select("business_owner_id, role, id")
      .eq("id", workerId)
      .single();

    // Handle errors
    if (error) {
      console.error("Error fetching owner ID for worker:", error);
      throw error;
    }

    // If worker has business_owner_id, return it
    if (data?.business_owner_id) {
      return data.business_owner_id;
    }

    // If user is an owner, return their own ID
    if (data?.role === "owner") {
      return data.id;
    }

    // Fallback: try to find owner by business_name (for backward compatibility)
    if (data?.business_name) {
      const { data: ownerData } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("business_name", data.business_name)
        .eq("role", "owner")
        .maybeSingle();

      if (ownerData?.id) {
        return ownerData.id;
      }
    }

    throw new Error(
      "No business owner found. Please contact your system administrator."
    );
  },

  /**
   * Get revenue by date for a date range
   */
  async getRevenueByDate(ownerId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from("sales")
      .select("sale_date, final_total")
      .eq("business_owner_id", ownerId);

    if (startDate) {
      // For date strings, ensure we start from the beginning of the day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte("sale_date", start.toISOString());
    }

    if (endDate) {
      // For date strings, ensure we include the full day (end of day)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("sale_date", end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by date
    const revenueByDate = {};
    data?.forEach((sale) => {
      const date = new Date(sale.sale_date).toISOString().split("T")[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      revenueByDate[date] += parseFloat(sale.final_total || 0);
    });

    // Convert to array and sort
    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  /**
   * Get sales by hour of day
   */
  async getSalesByHour(ownerId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from("sales")
      .select("sale_date, final_total")
      .eq("business_owner_id", ownerId);

    if (startDate) {
      // Convert date string to start of day timestamp for proper filtering
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte("sale_date", start.toISOString());
    }

    if (endDate) {
      // Convert date string to end of day timestamp for proper filtering
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("sale_date", end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by hour
    const salesByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sales: 0,
      revenue: 0,
    }));

    data?.forEach((sale) => {
      const hour = new Date(sale.sale_date).getHours();
      salesByHour[hour].sales += 1;
      salesByHour[hour].revenue += parseFloat(sale.final_total || 0);
    });

    return salesByHour;
  },

  /**
   * Get sales by day of week
   */
  async getSalesByDayOfWeek(ownerId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from("sales")
      .select("sale_date, final_total")
      .eq("business_owner_id", ownerId);

    if (startDate) {
      // Convert date string to start of day timestamp for proper filtering
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte("sale_date", start.toISOString());
    }

    if (endDate) {
      // Convert date string to end of day timestamp for proper filtering
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("sale_date", end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const salesByDay = days.map((day, index) => ({
      day,
      dayIndex: index,
      sales: 0,
      revenue: 0,
    }));

    data?.forEach((sale) => {
      const dayIndex = new Date(sale.sale_date).getDay();
      salesByDay[dayIndex].sales += 1;
      salesByDay[dayIndex].revenue += parseFloat(sale.final_total || 0);
    });

    return salesByDay;
  },

  /**
   * Get sales by category
   */
  async getSalesByCategory(ownerId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from("sales")
      .select(
        `
        *,
        items:sales_items(
          line_total,
          product:products(category)
        )
      `
      )
      .eq("business_owner_id", ownerId);

    if (startDate) {
      // Convert date string to start of day timestamp for proper filtering
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte("sale_date", start.toISOString());
    }

    if (endDate) {
      // Convert date string to end of day timestamp for proper filtering
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("sale_date", end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by category from sales_items
    const categorySales = {};
    data?.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const category = item.product?.category || "Other";
        if (!categorySales[category]) {
          categorySales[category] = { category, revenue: 0, count: 0 };
        }
        categorySales[category].revenue += parseFloat(item.line_total || 0);
        categorySales[category].count += 1;
      });
    });

    return Object.values(categorySales);
  },
};
