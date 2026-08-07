import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflow } from "../context/WorkflowContext";
import { useLanguage } from "../context/LanguageContext";

const COLOR_PALETTE = ["#fdab3d", "#e2445c", "#00c875", "#c4c4c4", "#579bfc", "#a25ddc", "#333333"];
const SHAPES = [
  { id: "rectangle", icon: "▭", label: "Kotak" },
  { id: "diamond", icon: "◇", label: "Diamond" },
  { id: "circle", icon: "○", label: "Lingkaran" },
  { id: "parallelogram", icon: "▱", label: "Jajar genjang" },
];

// Outer box always keeps a plain rect footprint (so Handle position math
// and ReactFlow's own hit-testing stay simple) — the *visual* shape is a
// clip-path/border-radius on top of that box, not an actual resize, so
// diamond/parallelogram need extra padding to keep the label clear of the
// corners getting clipped away.
function shapeStyle(shape) {
  switch (shape) {
    case "diamond":
      return { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", padding: "30px 38px", minWidth: 190 };
    case "circle":
      return { borderRadius: "50%", padding: 26, minWidth: 130, minHeight: 130, display: "flex", alignItems: "center", justifyContent: "center" };
    case "parallelogram":
      return { clipPath: "polygon(16% 0%, 100% 0%, 84% 100%, 0% 100%)", padding: "12px 34px", minWidth: 170 };
    default:
      return { borderRadius: 8, padding: "10px 18px", minWidth: 150 };
  }
}

// A single flowchart box. A small "⋮" button is always visible (not just
// on hover — hover-only controls turned out not to be discoverable) and
// opens a menu with rename/color/shape/delete, all in one place instead
// of scattered hover targets.
function WorkflowNode({ id, data }) {
  const { updateNodeLabel, updateNodeColor, updateNodeShape, deleteNode } = useWorkflow();
  const [menuOpen, setMenuOpen] = useState(false);
  const [text, setText] = useState(data.label);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  const commitLabel = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== data.label) updateNodeLabel(id, trimmed);
    else setText(data.label);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div
        style={{
          background: data.color,
          color: "#fff",
          textAlign: "center",
          fontWeight: 600,
          fontSize: 13,
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          boxSizing: "border-box",
          ...shapeStyle(data.shape),
        }}
      >
        {/* One source + one target handle stacked at each of the 4 sides —
            lets a connection start or land on whichever side keeps the
            diagram tidiest, instead of always routing top-to-bottom. */}
        <Handle type="target" id="top-t" position={Position.Top} style={{ background: "#fff", width: 8, height: 8 }} />
        <Handle type="source" id="top-s" position={Position.Top} style={{ background: "#fff", width: 8, height: 8 }} />
        <Handle type="target" id="bottom-t" position={Position.Bottom} style={{ background: "#fff", width: 8, height: 8 }} />
        <Handle type="source" id="bottom-s" position={Position.Bottom} style={{ background: "#fff", width: 8, height: 8 }} />
        <Handle type="target" id="left-t" position={Position.Left} style={{ background: "#fff", width: 8, height: 8 }} />
        <Handle type="source" id="left-s" position={Position.Left} style={{ background: "#fff", width: 8, height: 8 }} />
        <Handle type="target" id="right-t" position={Position.Right} style={{ background: "#fff", width: 8, height: 8 }} />
        <Handle type="source" id="right-s" position={Position.Right} style={{ background: "#fff", width: 8, height: 8 }} />
        <span style={{ display: "inline-block", maxWidth: "100%" }} onDoubleClick={() => setMenuOpen(true)}>
          {data.label}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((p) => !p);
        }}
        title="Menu"
        style={{
          position: "absolute",
          top: -8,
          right: -8,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid #fff",
          background: "#333",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      >
        ⋮
      </button>

      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            background: "#fff",
            borderRadius: 8,
            padding: 10,
            width: 200,
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
            zIndex: 20,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a94a6", marginBottom: 3 }}>Nama</div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            style={{ width: "100%", padding: "5px 7px", borderRadius: 4, border: "1px solid #ddd", fontSize: 12.5, boxSizing: "border-box", marginBottom: 10 }}
          />

          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a94a6", marginBottom: 4 }}>Warna</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => updateNodeColor(id, c)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: c,
                  border: data.color === c ? "2px solid #333" : "1px solid #ddd",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a94a6", marginBottom: 4 }}>Bentuk</div>
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            {SHAPES.map((s) => (
              <button
                key={s.id}
                title={s.label}
                onClick={() => updateNodeShape(id, s.id)}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: 15,
                  borderRadius: 4,
                  border: (data.shape || "rectangle") === s.id ? "2px solid #333" : "1px solid #ddd",
                  background: "#fafafa",
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                {s.icon}
              </button>
            ))}
          </div>

          <button
            onClick={() => deleteNode(id)}
            style={{
              width: "100%",
              padding: "6px 0",
              background: "#fdecea",
              color: "#e2445c",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            🗑 Hapus
          </button>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNode };

// Picks whichever side-pair points the two nodes most directly at each
// other, based on their current center offset — the practical fix for
// edges always defaulting to the first-declared handle (top) regardless
// of where the other node actually is. Re-run on every position change
// (including mid-drag), so routing keeps re-shortening itself live as
// nodes move, not just after a connection is first drawn.
function pickHandles(sourceNode, targetNode) {
  const dx = (targetNode.position.x + 75) - (sourceNode.position.x + 75);
  const dy = (targetNode.position.y + 20) - (sourceNode.position.y + 20);
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "right-s", targetHandle: "left-t" }
      : { sourceHandle: "left-s", targetHandle: "right-t" };
  }
  return dy >= 0
    ? { sourceHandle: "bottom-s", targetHandle: "top-t" }
    : { sourceHandle: "top-s", targetHandle: "bottom-t" };
}

function WorkflowCanvas() {
  const { t } = useLanguage();
  const { workflowNodes, workflowEdges, addNode, updateNodePosition, addEdge: addWorkflowEdge, deleteEdge, deleteNode } = useWorkflow();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Synced from context (initial load + Realtime updates from other
  // sessions) into ReactFlow's own node/edge shape. A node being actively
  // dragged keeps its own local position via onNodesChange in the
  // meantime; this effect re-running on every context update doesn't
  // fight that, since drag position only ever gets written back to
  // context on drop (onNodeDragStop), not continuously.
  useEffect(() => {
    setNodes(
      workflowNodes.map((n) => ({
        id: n.id,
        type: "workflow",
        position: { x: n.x, y: n.y },
        data: { label: n.label, color: n.color, shape: n.shape },
      }))
    );
  }, [workflowNodes]);

  // Depends on `nodes` (live positions, updated continuously while
  // dragging) as well as `workflowEdges`, so the source/target handle
  // choice below keeps re-shortening as nodes move, not just once when
  // the connection is first made.
  useEffect(() => {
    setEdges(
      workflowEdges.map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        const targetNode = nodes.find((n) => n.id === e.target);
        const handles = sourceNode && targetNode ? pickHandles(sourceNode, targetNode) : {};
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          ...handles,
          // "smoothstep" auto-routes with right-angle bends around the
          // straight line between two points, instead of cutting straight
          // through whatever sits between them — the closest built-in
          // equivalent to "find a clean path automatically" once the
          // diagram has more than a couple of nodes.
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#8a94a6", strokeWidth: 1.5 },
        };
      })
    );
  }, [workflowEdges, nodes]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onNodeDragStop = useCallback(
    (event, node) => updateNodePosition(node.id, node.position.x, node.position.y),
    [updateNodePosition]
  );

  const onConnect = useCallback((connection) => addWorkflowEdge(connection.source, connection.target), [addWorkflowEdge]);

  const onEdgesDelete = useCallback((deleted) => deleted.forEach((e) => deleteEdge(e.id)), [deleteEdge]);
  const onNodesDelete = useCallback((deleted) => deleted.forEach((n) => deleteNode(n.id)), [deleteNode]);

  const handleAddNode = () => {
    const x = 80 + Math.random() * 240;
    const y = 80 + Math.random() * 200;
    addNode(t("workflowView.newNodeLabel"), "#579bfc", x, y);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <div style={{ position: "absolute", top: 14, left: 14, zIndex: 5 }}>
        <button
          onClick={handleAddNode}
          style={{
            padding: "8px 16px",
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          + {t("workflowView.newNodeBtn")}
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={onNodesDelete}
        deleteKeyCode={["Backspace", "Delete"]}
        connectionMode="loose"
        fitView
      >
        <Background variant="dots" gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable style={{ background: "var(--bg-secondary)" }} />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowView() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
