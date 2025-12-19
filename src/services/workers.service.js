import { supabase } from "./supabase";

export const workersService = {
  /**
   * Generate a unique 6-character invite code
   */
  async generateInviteCode(ownerId) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
    let code = "";

    // Generate unique code
    let attempts = 0;
    let isUnique = false;

    while (!isUnique && attempts < 10) {
      code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const { data } = await supabase
        .from("invite_codes")
        .select("code")
        .eq("code", code)
        .single();

      if (!data) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error("Failed to generate unique code. Please try again.");
    }

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert invite code
    const { data, error } = await supabase
      .from("invite_codes")
      .insert({
        code,
        owner_id: ownerId,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Validate an invite code
   */
  async validateInviteCode(code) {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("*, owner:user_profiles!owner_id(id, business_name)")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      return { valid: false, error: "Invalid invite code" };
    }

    if (data.used) {
      return { valid: false, error: "This invite code has already been used" };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, error: "This invite code has expired" };
    }

    return { valid: true, data };
  },

  /**
   * Accept an invitation (link worker to owner)
   */
  async acceptInvitation(workerId, code) {
    // Validate code
    const validation = await this.validateInviteCode(code);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const inviteData = validation.data;

    // Check if already linked
    const { data: existing } = await supabase
      .from("business_workers")
      .select("id")
      .eq("business_owner_id", inviteData.owner_id)
      .eq("worker_id", workerId)
      .single();

    if (existing) {
      throw new Error("You are already linked to this business");
    }

    // Link worker to owner
    const { error: linkError } = await supabase
      .from("business_workers")
      .insert({
        owner_id: inviteData.owner_id, // Keep for backward compatibility
        business_owner_id: inviteData.owner_id, // Multi-tenant field
        worker_id: workerId,
      });

    if (linkError) throw linkError;

    // Mark invite code as used
    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({ used: true })
      .eq("code", code.toUpperCase());

    if (updateError) throw updateError;

    return { success: true };
  },

  /**
   * Fetch all workers for a business owner (multi-tenant)
   */
  async fetchWorkers(ownerId) {
    // Fetch workers from user_profiles filtered by business_owner_id
    const { data: workers, error } = await supabase
      .from("user_profiles")
      .select(
        `
        id,
        username,
        business_name,
        phone_number,
        created_at
      `
      )
      .eq("business_owner_id", ownerId)
      .in("role", ["worker", "manager"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching workers:", error);
      throw error;
    }

    if (!workers || workers.length === 0) {
      return [];
    }

    // Get sales stats for each worker
    const workersWithStats = await Promise.all(
      workers.map(async (worker) => {
        if (!worker || !worker.id) {
          console.warn("Invalid worker data:", worker);
          return null;
        }

        // Get today's sales count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { count: salesToday } = await supabase
          .from("sales")
          .select("*", { count: "exact", head: true })
          .eq("worker_id", worker.id)
          .gte("sale_date", today.toISOString())
          .lt("sale_date", tomorrow.toISOString());

        // Get total sales and revenue from sales_items
        const { data: allSales, error: salesError } = await supabase
          .from("sales")
          .select(
            `
            *,
            items:sales_items(quantity_sold, line_total)
            `
          )
          .eq("worker_id", worker.id)
          .eq("business_owner_id", ownerId); // Multi-tenant filter

        if (salesError) {
          console.warn(
            "Error fetching sales for worker:",
            worker.id,
            salesError
          );
        }

        // Calculate totals from sales items
        let totalSales = 0;
        let totalRevenue = 0;

        allSales?.forEach((sale) => {
          const itemQuantities = (sale.items || []).reduce(
            (sum, item) => sum + parseInt(item.quantity_sold || 0),
            0
          );
          const itemRevenue = (sale.items || []).reduce(
            (sum, item) => sum + parseFloat(item.line_total || 0),
            0
          );

          totalSales += itemQuantities;
          totalRevenue += parseFloat(sale.final_total || itemRevenue);
        });

        return {
          id: worker.id, // Use worker id as the entry id
          worker: {
            ...worker,
            stats: {
              salesToday: salesToday || 0,
              totalSales,
              totalRevenue,
            },
          },
        };
      })
    );

    // Filter out any null entries
    return workersWithStats.filter(Boolean);
  },

  /**
   * Remove a worker from the business
   */
  async removeWorker(ownerId, workerId) {
    const { error } = await supabase
      .from("business_workers")
      .delete()
      .eq("business_owner_id", ownerId)
      .eq("worker_id", workerId);

    if (error) throw error;
    return { success: true };
  },

  /**
   * Get worker performance data
   */
  async getWorkerPerformance(ownerId, workerId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from("sales")
      .select(
        `
        *,
        items:sales_items(
          quantity_sold,
          line_total,
          product:products(name, image_url, category)
        )
      `
      )
      .eq("business_owner_id", ownerId)
      .eq("worker_id", workerId)
      .order("sale_date", { ascending: false });

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

    // Calculate stats from multi-item sales
    const totalSales = data?.length || 0;
    const totalRevenue =
      data?.reduce((sum, s) => sum + parseFloat(s.final_total || 0), 0) || 0;

    // Calculate total quantity from all items in all sales
    const totalQuantity =
      data?.reduce((sum, sale) => {
        const itemQuantities = (sale.items || []).reduce(
          (itemSum, item) => itemSum + parseInt(item.quantity_sold || 0),
          0
        );
        return sum + itemQuantities;
      }, 0) || 0;

    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Group by date for chart
    const salesByDate = {};
    data?.forEach((sale) => {
      const date = new Date(sale.sale_date).toISOString().split("T")[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, count: 0 };
      }
      salesByDate[date].revenue += parseFloat(sale.final_total || 0);
      salesByDate[date].count += 1;
    });

    const chartData = Object.values(salesByDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => ({
        date: item.date,
        revenue: item.revenue,
        sales: item.count,
      }));

    // Prepare recent sales for display (flatten items from sales)
    const recentSales = [];
    data?.slice(0, 10).forEach((sale) => {
      // If sale has items, create an entry for each item
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item) => {
          recentSales.push({
            id: `${sale.id}-${item.product?.id || "unknown"}`,
            sale_id: sale.id,
            sale_date: sale.sale_date,
            quantity_sold: item.quantity_sold,
            line_total: item.line_total,
            product: item.product,
          });
        });
      } else {
        // Fallback for sales without items (shouldn't happen, but handle it)
        recentSales.push({
          id: sale.id,
          sale_id: sale.id,
          sale_date: sale.sale_date,
          quantity_sold: 0,
          line_total: sale.final_total || 0,
          product: null,
        });
      }
    });

    return {
      stats: {
        totalSales,
        totalRevenue,
        totalQuantity,
        averageSale,
        successRate: 100, // Placeholder
      },
      chartData,
      recentSales: recentSales.slice(0, 10), // Limit to 10 items
    };
  },
};
