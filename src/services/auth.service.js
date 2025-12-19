import { supabase } from "./supabase";

export const authService = {
  // Sign in with username and password
  async signIn(username, password, businessName = null) {
    try {
      // Build query - filter by username and optionally by business name
      // Note: Username matching is case-sensitive in the database
      // Make sure usernames are stored in lowercase for consistency
      let query = supabase
        .from("user_profiles")
        .select("*")
        .eq("username", username.trim().toLowerCase());

      // If business name provided (for workers/managers), filter by it (case-sensitive)
      if (businessName) {
        query = query.eq("business_name", businessName.trim());
      }

      const { data: user, error: userError } = await query.single();

      if (userError) {
        console.error("User query error:", userError);
        // Provide more specific error message
        if (userError.code === "PGRST116") {
          throw new Error(
            "User not found. Please check your username and company name."
          );
        }
        throw new Error(
          "Invalid username or password. Please check your credentials and company name."
        );
      }

      if (!user) {
        console.error(
          "No user found for username:",
          username,
          "businessName:",
          businessName
        );
        throw new Error(
          "User not found. Please check your username and company name."
        );
      }

      // Verify the user's role matches what they're trying to log in as
      // (This is a soft check - we don't enforce it strictly, but log it)
      if (businessName && user.role === "owner") {
        console.warn("Owner trying to login with business name filter");
      }

      // Verify password using PostgreSQL function (use normalized username)
      const normalizedUsername = username.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.rpc(
        "verify_password",
        {
          p_username: normalizedUsername,
          p_password: password,
        }
      );

      if (authError) {
        console.error("Password verification error:", authError);
        throw new Error("Authentication failed");
      }

      // Check if password is valid
      const validResult = Array.isArray(authData) ? authData[0] : authData;
      if (!validResult || !validResult.valid) {
        throw new Error("Invalid username or password");
      }

      // Store session in localStorage
      const session = {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          business_name: user.business_name,
          business_owner_id: user.business_owner_id || user.id, // Use self for owners
          business_category: user.business_category,
          profile_picture_url: user.profile_picture_url,
          phone_number: user.phone_number,
        },
        token: btoa(JSON.stringify({ id: user.id, timestamp: Date.now() })),
      };

      localStorage.setItem("stockguard_session", JSON.stringify(session));

      return { user: session.user, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        user: null,
        error: error.message || "Invalid username or password",
      };
    }
  },

  // Sign up (only owner can create accounts)
  async signUp(userData, creatorRole) {
    try {
      // Check if creator has permission
      if (creatorRole === "worker") {
        throw new Error("Workers cannot create accounts");
      }

      if (creatorRole === "manager" && userData.role === "manager") {
        throw new Error("Managers cannot create other managers");
      }

      // Check manager limit if creating manager
      if (userData.role === "manager") {
        // Get owner settings to check manager limit
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
          throw new Error("You must be logged in to create users");
        }

        // Get owner ID (if creator is owner, use their ID; if manager, need to get owner_id)
        const ownerId = currentUser.role === "owner" ? currentUser.id : null;

        if (ownerId) {
          const { data: settings } = await supabase
            .from("owner_settings")
            .select("max_managers")
            .eq("owner_id", ownerId)
            .single();

          if (settings) {
            const { count } = await supabase
              .from("user_profiles")
              .select("*", { count: "exact", head: true })
              .eq("role", "manager");

            if (count >= settings.max_managers) {
              throw new Error(
                `Maximum ${settings.max_managers} managers allowed`
              );
            }
          }
        }
      }

      // Check if profile picture is mandatory
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const ownerId = currentUser.role === "owner" ? currentUser.id : null;

        if (ownerId) {
          const { data: settings } = await supabase
            .from("owner_settings")
            .select("profile_pictures_mandatory")
            .eq("owner_id", ownerId)
            .single();

          if (
            settings?.profile_pictures_mandatory &&
            !userData.profile_picture_url
          ) {
            throw new Error("Profile picture is required");
          }
        }
      }

      // Use create_user_with_business for:
      // 1. Owners (they need business_category)
      // 2. Workers/Managers (they need business_name to link to owner)
      // Only use create_user for backward compatibility if neither is provided
      const shouldUseCreateUserWithBusiness =
        userData.business_category ||
        (userData.business_name &&
          (userData.role === "worker" || userData.role === "manager")) ||
        userData.role === "owner";

      const rpcFunction = shouldUseCreateUserWithBusiness
        ? "create_user_with_business"
        : "create_user";

      // Ensure username is lowercase for consistency
      const normalizedUsername = userData.username.trim().toLowerCase();

      const rpcParams = shouldUseCreateUserWithBusiness
        ? {
            p_username: normalizedUsername,
            p_password: userData.password,
            p_role: userData.role,
            p_business_name: userData.business_name || null,
            p_business_category: userData.business_category || null,
            p_phone_number: userData.phone_number || null,
            p_profile_picture_url: userData.profile_picture_url || null,
          }
        : {
            p_username: normalizedUsername,
            p_password: userData.password,
            p_role: userData.role,
            p_business_name: userData.business_name || null,
            p_phone_number: userData.phone_number || null,
            p_profile_picture_url: userData.profile_picture_url || null,
          };

      const { data, error } = await supabase.rpc(rpcFunction, rpcParams);

      if (error) {
        console.error("Create user error:", error);
        // Extract error message from different possible error formats
        let errorMessage = error.message;
        if (!errorMessage && error.details) {
          errorMessage = error.details;
        }
        if (!errorMessage && error.hint) {
          errorMessage = error.hint;
        }
        if (!errorMessage && typeof error === "string") {
          errorMessage = error;
        }
        if (!errorMessage) {
          errorMessage = "Failed to create user";
        }

        // Create a proper Error object with the message
        const userError = new Error(errorMessage);
        userError.code = error.code;
        userError.details = error.details;
        throw userError;
      }

      return { user: data, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      // Extract message from error object
      const errorMessage =
        error.message || error.details || error.hint || "Failed to create user";
      return { user: null, error: errorMessage };
    }
  },

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const session = localStorage.getItem("stockguard_session");
      if (!session) return null;

      const parsed = JSON.parse(session);
      return parsed.user || null;
    } catch (error) {
      console.error("Error parsing session:", error);
      return null;
    }
  },

  // Sign out
  signOut() {
    localStorage.removeItem("stockguard_session");
    return { error: null };
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  // Get session (for compatibility with existing code)
  async getSession() {
    const user = this.getCurrentUser();
    if (!user) {
      return { session: null, error: null };
    }
    return {
      session: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
      error: null,
    };
  },

  // Mock auth state change for compatibility (won't actually trigger)
  onAuthStateChange(callback) {
    // Return a mock subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },
};
