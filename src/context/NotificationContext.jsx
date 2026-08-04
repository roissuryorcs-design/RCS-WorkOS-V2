import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

// Global (not board-scoped), same level as ProfileProvider/DMProvider.
// Loads recent notifications for the signed-in user once, then stays
// live via a user-filtered Realtime subscription.
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error loading notifications:", error);
        setNotifications(data || []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => (prev.some((n) => n.id === payload.new.id) ? prev : [payload.new, ...prev]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const markRead = async (notificationId) => {
    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read_at: readAt } : n)));
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", notificationId);
    if (error) console.error("Error marking notification read:", error);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read_at: readAt } : n)));
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).in("id", unreadIds);
    if (error) console.error("Error marking all notifications read:", error);
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const value = { loading, notifications, unreadCount, markRead, markAllRead };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
