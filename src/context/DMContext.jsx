import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

const DMContext = createContext();

// 1:1 direct messages, global (not board-scoped) — mounted once for the
// whole logged-in session, same level as ProfileProvider. Loads every
// direct_messages row where the user is sender or recipient once, then
// stays live via Realtime (recipient-side only; a sent message is already
// in local state optimistically, so no echo-back subscription is needed
// for it).
export function DMProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error loading direct messages:", error);
        setMessages(data || []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`direct_messages:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const sendMessage = async (recipientId, body) => {
    const trimmed = (body || "").trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: user.id, recipient_id: recipientId, body: trimmed })
      .select()
      .single();
    if (error) {
      console.error("Error sending message:", error);
      return { error };
    }
    setMessages((prev) => [...prev, data]);

    // Best-effort — a failed notification insert shouldn't block the
    // message itself from sending, so no error surfaced to the caller.
    supabase
      .from("notifications")
      .insert({
        user_id: recipientId,
        actor_id: user.id,
        type: "dm",
        source_type: "dm",
        source_id: data.id,
        preview: trimmed.slice(0, 120),
      })
      .then(({ error: notifError }) => {
        if (notifError) console.error("Error creating DM notification:", notifError);
      });

    return { error: null };
  };

  const messagesWith = (userId) =>
    messages.filter((m) => m.sender_id === userId || m.recipient_id === userId);

  const markConversationRead = async (userId) => {
    const unreadIds = messages
      .filter((m) => m.sender_id === userId && m.recipient_id === user.id && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    const readAt = new Date().toISOString();
    setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read_at: readAt } : m)));
    const { error } = await supabase.from("direct_messages").update({ read_at: readAt }).in("id", unreadIds);
    if (error) console.error("Error marking messages read:", error);
  };

  // One entry per person you've exchanged messages with, newest last
  // message first — the conversation list a DM inbox UI would show.
  const conversations = useMemo(() => {
    const byPartner = new Map();
    for (const m of messages) {
      const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const existing = byPartner.get(partnerId);
      if (!existing || new Date(m.created_at) > new Date(existing.lastMessage.created_at)) {
        byPartner.set(partnerId, { partnerId, lastMessage: m });
      }
    }
    return [...byPartner.values()]
      .map((c) => ({
        ...c,
        unreadCount: messages.filter((m) => m.sender_id === c.partnerId && m.recipient_id === user.id && !m.read_at).length,
      }))
      .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
  }, [messages, user.id]);

  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const value = {
    loading,
    conversations,
    totalUnreadCount,
    messagesWith,
    sendMessage,
    markConversationRead,
  };

  return <DMContext.Provider value={value}>{children}</DMContext.Provider>;
}

export function useDM() {
  const context = useContext(DMContext);
  if (!context) {
    throw new Error("useDM must be used within a DMProvider");
  }
  return context;
}
