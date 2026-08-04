import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

const UpdateContext = createContext();

// Flat `updates` rows (item_id + parent_id adjacency, same pattern as
// ItemsContext) -> the nested {replies: [...]} shape UpdatePanel.jsx
// already expects. Deleted rows (soft-delete via `deleted_at`, chosen so
// deleting a parent mid-reply-in-flight can't orphan/cascade away
// someone's reply) are pruned unless they still have live children, in
// which case they're kept with blank text/files — `renderTextWithMentions`
// in UpdatePanel already shows its "empty update" placeholder for blank
// text, so no UpdatePanel changes were needed to support this.
function buildReplyTree(rows, authorsById) {
  const byParent = new Map();
  for (const row of rows) {
    const key = row.parent_id || "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(row);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  function build(parentKey) {
    return (byParent.get(parentKey) || [])
      .map((row) => {
        const replies = build(row.id);
        if (row.deleted_at && replies.length === 0) return null;
        const author = authorsById[row.author_id];
        return {
          id: row.id,
          itemId: row.item_id,
          parentReplyId: row.parent_id,
          text: row.deleted_at ? "" : row.text,
          files: row.deleted_at ? [] : row.files || [],
          author: author?.displayName || author?.email || "",
          timestamp: row.created_at,
          replies,
        };
      })
      .filter(Boolean);
  }

  return build("__root__");
}

export function UpdateProvider({ children, boardId }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [authorsById, setAuthorsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // `profiles` is readable by any authenticated user (low-sensitivity:
  // display name/avatar only), so authors of updates from people this
  // client hasn't otherwise seen (e.g. workspace members list never
  // fetched) are resolved lazily here, one batch fetch per newly-seen set
  // of author ids.
  const ensureAuthorsLoaded = async (authorIds, currentAuthorsById) => {
    const missing = [...new Set(authorIds)].filter((id) => id && !currentAuthorsById[id]);
    if (missing.length === 0) return;
    const { data, error } = await supabase.from("profiles").select("id, display_name, email").in("id", missing);
    if (error) {
      console.error("Error loading update authors:", error);
      return;
    }
    setAuthorsById((prev) => {
      const next = { ...prev };
      for (const p of data || []) next[p.id] = { displayName: p.display_name, email: p.email };
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from("updates").select("*").eq("board_id", boardId);
      if (cancelled) return;
      if (error) {
        console.error("Error loading updates:", error);
        setLoading(false);
        return;
      }
      setRows(data || []);
      await ensureAuthorsLoaded((data || []).map((r) => r.author_id), {});
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;
    const channel = supabase
      .channel(`updates:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "updates", filter: `board_id=eq.${boardId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setRows((prev) => prev.filter((r) => r.id !== payload.old.id));
            return;
          }
          const incoming = payload.new;
          setAuthorsById((current) => {
            ensureAuthorsLoaded([incoming.author_id], current);
            return current;
          });
          setRows((prev) => {
            const exists = prev.some((r) => r.id === incoming.id);
            return exists ? prev.map((r) => (r.id === incoming.id ? incoming : r)) : [...prev, incoming];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const tree = useMemo(() => buildReplyTree(rows, authorsById), [rows, authorsById]);

  const addUpdate = async (itemId, text, files = []) => {
    if (!text && files.length === 0) return null;
    const { data, error } = await supabase
      .from("updates")
      .insert({ item_id: itemId, board_id: boardId, parent_id: null, author_id: user.id, text: text || "", files })
      .select()
      .single();
    if (error) {
      console.error("Error adding update:", error);
      return null;
    }
    setRows((prev) => [...prev, data]);
    return data;
  };

  // `updateId` is always the top-level update's id (UpdatePanel passes it
  // through even for nested replies); `parentReplyId` is the specific
  // reply being replied to, if any deeper than the top level.
  const addReply = async (updateId, replyData, parentReplyId = null) => {
    if (!replyData || (!replyData.text && !(replyData.files && replyData.files.length > 0))) return null;
    const rootUpdate = rows.find((r) => r.id === updateId);
    if (!rootUpdate) return null;
    const { data, error } = await supabase
      .from("updates")
      .insert({
        item_id: rootUpdate.item_id,
        board_id: boardId,
        parent_id: parentReplyId || updateId,
        author_id: user.id,
        text: replyData.text || "",
        files: replyData.files || [],
      })
      .select()
      .single();
    if (error) {
      console.error("Error adding reply:", error);
      return null;
    }
    setRows((prev) => [...prev, data]);
    return data;
  };

  const editUpdate = async (updateId, newText, files = null) => {
    if (!newText) return;
    const patch = { text: newText };
    if (files !== null) patch.files = files;
    setRows((prev) => prev.map((r) => (r.id === updateId ? { ...r, ...patch } : r)));
    const { error } = await supabase.from("updates").update(patch).eq("id", updateId);
    if (error) console.error("Error editing update:", error);
  };

  // Replies are just `updates` rows with parent_id set — same operation
  // as editUpdate, kept as a separate name so UpdatePanel's existing
  // call sites (editReply(updateId, replyId, ...)) don't need to change.
  const editReply = (_updateId, replyId, newText, files = null) => editUpdate(replyId, newText, files);

  const deleteUpdate = async (updateId) => {
    const deletedAt = new Date().toISOString();
    setRows((prev) => prev.map((r) => (r.id === updateId ? { ...r, deleted_at: deletedAt } : r)));
    const { error } = await supabase.from("updates").update({ deleted_at: deletedAt }).eq("id", updateId);
    if (error) console.error("Error deleting update:", error);
  };

  const deleteReply = (_updateId, replyId) => deleteUpdate(replyId);

  const openPanel = (itemId) => {
    setSelectedItem(itemId);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedItem(null);
  };

  const getItemUpdates = (itemId) => tree.filter((u) => u.itemId === itemId);

  const value = {
    loading,
    selectedItem,
    isPanelOpen,
    addUpdate,
    addReply,
    editUpdate,
    deleteUpdate,
    editReply,
    deleteReply,
    openPanel,
    closePanel,
    getItemUpdates,
  };

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdates() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error("useUpdates must be used within an UpdateProvider");
  }
  return context;
}
