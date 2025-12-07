import { supabase } from "./supabase";

export const productsService = {
  async fetchProducts(ownerId, filters = {}) {
    let query = supabase
      .from("products")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      query = query.ilike("name", `%${filters.search.trim()}%`);
    }

    // Apply category filter
    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createProduct(productData) {
    // Calculate prices based on product type
    let pricePerUnit = parseFloat(
      productData.price || productData.price_per_unit || 0
    );
    let pricePerItem = pricePerUnit;

    if (productData.product_type === "box") {
      const itemsPerUnit = parseInt(productData.items_per_unit || 1);
      pricePerUnit = parseFloat(
        productData.price || productData.price_per_unit || 0
      ); // Total box price
      pricePerItem =
        itemsPerUnit > 0 ? pricePerUnit / itemsPerUnit : pricePerUnit;
    } else if (productData.product_type === "pair") {
      pricePerUnit = parseFloat(
        productData.price || productData.price_per_unit || 0
      ); // Price for the pair
      pricePerItem = pricePerUnit / 2;
    } else {
      // Single item
      pricePerUnit = parseFloat(
        productData.price || productData.price_per_unit || 0
      );
      pricePerItem = pricePerUnit;
    }

    // Use price_per_unit and price_per_item if provided, otherwise calculate
    const finalPricePerUnit = productData.price_per_unit || pricePerUnit;
    const finalPricePerItem = productData.price_per_item || pricePerItem;

    const productToInsert = {
      owner_id: productData.owner_id,
      name: productData.name,
      category: productData.category,
      product_type: productData.product_type || "single",
      items_per_unit: productData.items_per_unit || 1,
      quantity: parseInt(productData.quantity || 0), // Number of boxes/pairs/singles
      price_per_unit: finalPricePerUnit,
      price_per_item: finalPricePerItem,
      price: finalPricePerUnit, // Keep for backward compatibility
      image_url: productData.image_url || null,
      description: productData.description || null,
    };

    const { data, error } = await supabase
      .from("products")
      .insert([productToInsert])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(id, updates) {
    // If price is updated, recalculate price_per_unit and price_per_item
    if (updates.price !== undefined || updates.price_per_unit !== undefined) {
      const { data: existingProduct } = await supabase
        .from("products")
        .select("product_type, items_per_unit")
        .eq("id", id)
        .single();

      if (existingProduct) {
        const newPrice =
          updates.price_per_unit ||
          updates.price ||
          existingProduct.price_per_unit;

        if (existingProduct.product_type === "box") {
          const itemsPerUnit = existingProduct.items_per_unit || 1;
          updates.price_per_unit = newPrice;
          updates.price_per_item =
            itemsPerUnit > 0 ? newPrice / itemsPerUnit : newPrice;
        } else if (existingProduct.product_type === "pair") {
          updates.price_per_unit = newPrice;
          updates.price_per_item = newPrice / 2;
        } else {
          updates.price_per_unit = newPrice;
          updates.price_per_item = newPrice;
        }
      }
    }

    // Keep price field for backward compatibility
    if (updates.price_per_unit && !updates.price) {
      updates.price = updates.price_per_unit;
    }

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;
  },

  async getLowStockProducts(ownerId, threshold = 10) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("owner_id", ownerId)
      .lte("quantity", threshold)
      .order("quantity", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async uploadProductImage(file, productId) {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    return publicUrl;
  },

  async deleteProductImage(imageUrl) {
    // Extract filename from URL
    const fileName = imageUrl.split("/").pop();
    if (!fileName) return;

    const { error } = await supabase.storage
      .from("product-images")
      .remove([fileName]);

    if (error) throw error;
  },
};
