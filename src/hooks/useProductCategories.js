import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "./useAuth";

export function useProductCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadCategories();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the owner ID - if user is owner, use their ID; otherwise get from business_owner_id
      let ownerId = user.id;

      // If user is worker/manager, we need to get their owner's ID
      if (user.role !== "owner") {
        // Try to get owner ID from user profile
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, business_name, role")
          .eq("id", user.id)
          .single();

        if (!profileError && userProfile) {
          // Find the owner by business_name
          const { data: ownerProfile } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("business_name", userProfile.business_name)
            .eq("role", "owner")
            .single();

          if (ownerProfile) {
            ownerId = ownerProfile.id;
          }
        }
      }

      // Check if owner has a business_category set
      const { data: ownerProfile } = await supabase
        .from("user_profiles")
        .select("business_category")
        .eq("id", ownerId)
        .single();

      // If no business_category, return default categories
      if (!ownerProfile?.business_category) {
        setCategories([
          { category: "Other", display_order: 0, is_default: true },
        ]);
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "get_business_categories",
        {
          p_owner_id: ownerId,
        }
      );

      if (rpcError) throw rpcError;

      setCategories(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading categories:", err);
      // Fallback to default categories if error
      setCategories([
        { category: "Other", display_order: 0, is_default: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCategory = () => {
    const defaultCat = categories.find((cat) => cat.is_default);
    return defaultCat?.category || categories[0]?.category || "Other";
  };

  return {
    categories: categories.map((cat) => cat.category),
    loading,
    error,
    getDefaultCategory,
  };
}
