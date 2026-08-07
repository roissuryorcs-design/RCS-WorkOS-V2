import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const WorkflowContext = createContext();

function mapNode(row) {
  return {
    id: row.id,
    label: row.label,
    color: row.color,
    shape: row.shape,
    icon: row.icon,
    description: row.description,
    x: row.pos_x,
    y: row.pos_y,
  };
}

function mapEdge(row) {
  return {
    id: row.id,
    source: row.source_id,
    target: row.target_id,
    color: row.color,
    sourceHandle: row.source_handle,
    targetHandle: row.target_handle,
    dashed: row.dashed,
    bendX: row.bend_x,
    bendY: row.bend_y,
  };
}

// Freeform flowchart view, per board — separate from the Status column's
// fixed states, this is a blank canvas of draggable/connectable nodes for
// sketching an actual process flow. Same load-once-then-Realtime pattern
// as every other per-board context in this app (GroupContext, ItemsContext).
export function WorkflowProvider({ children, boardId }) {
  const [nodeRows, setNodeRows] = useState([]);
  const [edgeRows, setEdgeRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.from("workflow_nodes").select("*").eq("board_id", boardId),
      supabase.from("workflow_edges").select("*").eq("board_id", boardId),
    ]).then(([nodesRes, edgesRes]) => {
      if (cancelled) return;
      if (nodesRes.error) console.error("Error loading workflow nodes:", nodesRes.error);
      if (edgesRes.error) console.error("Error loading workflow edges:", edgesRes.error);
      setNodeRows((nodesRes.data || []).map(mapNode));
      setEdgeRows((edgesRes.data || []).map(mapEdge));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;
    const channel = supabase
      .channel(`workflow:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workflow_nodes", filter: `board_id=eq.${boardId}` },
        (payload) => {
          setNodeRows((prev) => {
            if (payload.eventType === "DELETE") return prev.filter((n) => n.id !== payload.old.id);
            const mapped = mapNode(payload.new);
            return prev.some((n) => n.id === mapped.id) ? prev.map((n) => (n.id === mapped.id ? mapped : n)) : [...prev, mapped];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workflow_edges", filter: `board_id=eq.${boardId}` },
        (payload) => {
          setEdgeRows((prev) => {
            if (payload.eventType === "DELETE") return prev.filter((e) => e.id !== payload.old.id);
            const mapped = mapEdge(payload.new);
            return prev.some((e) => e.id === mapped.id) ? prev : [...prev, mapped];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const addNode = async (label, color, x, y) => {
    const { data, error } = await supabase
      .from("workflow_nodes")
      .insert({ board_id: boardId, label, color, pos_x: x, pos_y: y })
      .select()
      .single();
    if (error) {
      console.error("Error adding workflow node:", error);
      return null;
    }
    const mapped = mapNode(data);
    setNodeRows((prev) => (prev.some((n) => n.id === mapped.id) ? prev : [...prev, mapped]));
    return mapped.id;
  };

  const updateNodePosition = (id, x, y) => {
    setNodeRows((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    supabase.from("workflow_nodes").update({ pos_x: x, pos_y: y }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error moving workflow node:", error);
    });
  };

  const updateNodeLabel = (id, label) => {
    setNodeRows((prev) => prev.map((n) => (n.id === id ? { ...n, label } : n)));
    supabase.from("workflow_nodes").update({ label }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error renaming workflow node:", error);
    });
  };

  const updateNodeColor = (id, color) => {
    setNodeRows((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)));
    supabase.from("workflow_nodes").update({ color }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error recoloring workflow node:", error);
    });
  };

  const updateNodeShape = (id, shape) => {
    setNodeRows((prev) => prev.map((n) => (n.id === id ? { ...n, shape } : n)));
    supabase.from("workflow_nodes").update({ shape }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error changing workflow node shape:", error);
    });
  };

  const updateNodeIcon = (id, icon) => {
    setNodeRows((prev) => prev.map((n) => (n.id === id ? { ...n, icon } : n)));
    supabase.from("workflow_nodes").update({ icon }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error changing workflow node icon:", error);
    });
  };

  const updateNodeDescription = (id, description) => {
    setNodeRows((prev) => prev.map((n) => (n.id === id ? { ...n, description } : n)));
    supabase.from("workflow_nodes").update({ description }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error updating workflow node description:", error);
    });
  };

  const deleteNode = async (id) => {
    setNodeRows((prev) => prev.filter((n) => n.id !== id));
    setEdgeRows((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    const { error } = await supabase.from("workflow_nodes").delete().eq("id", id);
    if (error) console.error("Error deleting workflow node:", error);
  };

  // sourceHandle/targetHandle are whichever handle the user actually
  // dragged from/to (which side of each node) — persisted as-is, not
  // recomputed later, so the connection stays exactly where it was
  // manually drawn even as nodes get moved around.
  const addEdge = async (sourceId, targetId, sourceHandle, targetHandle) => {
    if (sourceId === targetId) return;
    if (edgeRows.some((e) => e.source === sourceId && e.target === targetId)) return;
    const { data, error } = await supabase
      .from("workflow_edges")
      .insert({ board_id: boardId, source_id: sourceId, target_id: targetId, source_handle: sourceHandle, target_handle: targetHandle })
      .select()
      .single();
    if (error) {
      console.error("Error connecting workflow nodes:", error);
      return;
    }
    const mapped = mapEdge(data);
    setEdgeRows((prev) => (prev.some((e) => e.id === mapped.id) ? prev : [...prev, mapped]));
  };

  const deleteEdge = async (id) => {
    setEdgeRows((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("workflow_edges").delete().eq("id", id);
    if (error) console.error("Error disconnecting workflow nodes:", error);
  };

  const updateEdgeColor = (id, color) => {
    setEdgeRows((prev) => prev.map((e) => (e.id === id ? { ...e, color } : e)));
    supabase.from("workflow_edges").update({ color }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error recoloring workflow edge:", error);
    });
  };

  const updateEdgeDashed = (id, dashed) => {
    setEdgeRows((prev) => prev.map((e) => (e.id === id ? { ...e, dashed } : e)));
    supabase.from("workflow_edges").update({ dashed }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error changing workflow edge line style:", error);
    });
  };

  // Persists the dragged bend point (the "yellow dot" on a step path) —
  // local-only updates happen live during drag via WorkflowView's own
  // edge state, this only needs to fire once on drop.
  const updateEdgeBend = (id, x, y) => {
    setEdgeRows((prev) => prev.map((e) => (e.id === id ? { ...e, bendX: x, bendY: y } : e)));
    supabase.from("workflow_edges").update({ bend_x: x, bend_y: y }).eq("id", id).then(({ error }) => {
      if (error) console.error("Error moving workflow edge bend point:", error);
    });
  };

  const value = {
    loading,
    workflowNodes: nodeRows,
    workflowEdges: edgeRows,
    addNode,
    updateNodePosition,
    updateNodeLabel,
    updateNodeColor,
    updateNodeShape,
    updateNodeIcon,
    updateNodeDescription,
    deleteNode,
    addEdge,
    deleteEdge,
    updateEdgeColor,
    updateEdgeDashed,
    updateEdgeBend,
  };

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}
