import { supabase } from "./supabase";

/**
 * Notification Service
 * Handles browser notifications, SMS notifications, and email notifications
 */
export const notificationsService = {
  /**
   * Show browser notification for a new sale
   * Checks user preferences before showing
   */
  async showBrowserNotification(sale, userId) {
    try {
      // Check if browser notifications are enabled for this user
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("browser_notifications")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking notification preferences:", error);
        return;
      }

      // Check if browser notifications are enabled in user preferences
      if (!profile?.browser_notifications) {
        return; // User has disabled browser notifications
      }

      // Check if browser supports notifications
      if (!("Notification" in window)) {
        console.warn("Browser does not support notifications");
        return;
      }

      // Check permission
      if (Notification.permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }

      // Prepare notification content
      const firstItem = sale.items?.[0];
      const productName = firstItem?.product?.name || "Products";
      const itemCount = sale.items?.length || 1;
      const amount = parseFloat(sale.final_total || 0).toLocaleString();
      const workerName =
        sale.worker?.business_name || sale.worker?.username || "Worker";

      // Create notification
      const notification = new Notification("New Sale! 💰", {
        body: `${itemCount} item(s) - UGX ${amount} by ${workerName}`,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `sale-${sale.id}`,
        requireInteraction: false,
        silent: false,
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error("Error showing browser notification:", error);
    }
  },

  /**
   * Request browser notification permission
   */
  async requestBrowserNotificationPermission() {
    if (!("Notification" in window)) {
      throw new Error("Browser does not support notifications");
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      throw new Error("Notification permission was denied");
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  },

  /**
   * Check if browser notifications are enabled for a user
   */
  async isBrowserNotificationsEnabled(userId) {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("browser_notifications")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking notification preferences:", error);
        return false;
      }

      return (
        profile?.browser_notifications === true &&
        Notification.permission === "granted"
      );
    } catch (error) {
      console.error("Error checking browser notifications:", error);
      return false;
    }
  },

  /**
   * Check if SMS notifications should be sent for a sale
   */
  async shouldSendSMSNotification(sale, userId) {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("sms_notifications, sms_threshold, phone_number")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking SMS notification preferences:", error);
        return false;
      }

      // Check if SMS notifications are enabled
      if (!profile?.sms_notifications) {
        return false;
      }

      // Check if phone number is provided
      if (!profile?.phone_number) {
        return false;
      }

      // Check threshold
      const saleAmount = parseFloat(sale.final_total || 0);
      const threshold = parseFloat(profile?.sms_threshold || 0);

      if (threshold > 0 && saleAmount < threshold) {
        return false; // Sale amount below threshold
      }

      return true;
    } catch (error) {
      console.error("Error checking SMS notification:", error);
      return false;
    }
  },

  /**
   * Check if email notifications should be sent for a sale
   */
  async shouldSendEmailNotification(sale, userId) {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("email_notifications, email_threshold, email")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking email notification preferences:", error);
        return false;
      }

      // Check if email notifications are enabled
      if (!profile?.email_notifications) {
        return false;
      }

      // Check if email is provided
      if (!profile?.email) {
        return false;
      }

      // Check threshold
      const saleAmount = parseFloat(sale.final_total || 0);
      const threshold = parseFloat(profile?.email_threshold || 0);

      if (threshold > 0 && saleAmount < threshold) {
        return false; // Sale amount below threshold
      }

      return true;
    } catch (error) {
      console.error("Error checking email notification:", error);
      return false;
    }
  },
};
