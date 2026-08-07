import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
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

// Pictogram badge options — covers the kind of process-flow steps seen in
// reference workflow diagrams (inquiry call, quotation, design, approval,
// material, fabrication, testing, shipping, report, …) without needing
// any custom illustration assets.
const ICONS = [
  { emoji: "🧑‍💻", label: "Kerja/Desain" },
  { emoji: "📞", label: "Inquiry" },
  { emoji: "💰", label: "Quotation" },
  { emoji: "📐", label: "Engineering" },
  { emoji: "✅", label: "Approval" },
  { emoji: "📦", label: "Material" },
  { emoji: "🔧", label: "Fabrication" },
  { emoji: "🔩", label: "Assembly" },
  { emoji: "🧪", label: "Testing" },
  { emoji: "📋", label: "Packing" },
  { emoji: "🚚", label: "Shipping" },
  { emoji: "🏭", label: "Commissioning" },
  { emoji: "📊", label: "Report" },
  { emoji: "📄", label: "Dokumen" },
  { emoji: "📁", label: "Folder" },
  { emoji: "🗂️", label: "Multi Folder" },
  { emoji: "📑", label: "Multi Dokumen" },
  { emoji: "⚠️", label: "Hold/Issue" },
  { emoji: "🎯", label: "Target" },
];

// Outer box always keeps a plain rect footprint (so Handle position math
// and ReactFlow's own hit-testing stay simple) — the *visual* shape is a
// clip-path/border-radius on top of that box, not an actual resize, so
// diamond/parallelogram need extra padding to keep the label clear of the
// corners getting clipped away.
function shapeStyle(shape) {
  switch (shape) {
    case "diamond":
      return { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", padding: "30px 38px", width: 190 };
    case "circle":
      return { borderRadius: "50%", padding: 26, width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center" };
    case "parallelogram":
      return { clipPath: "polygon(16% 0%, 100% 0%, 84% 100%, 0% 100%)", padding: "12px 34px", width: 170 };
    default:
      return { borderRadius: 8, padding: "10px 18px", width: 150 };
  }
}

// A single flowchart box. Editing (rename/color/shape/icon/delete) is
// handled by ONE fixed panel owned by the parent canvas (see
// EditNodePanel below) rather than a per-node popup — a per-node popup
// either scaled with canvas zoom or jumped around depending on which node
// was clicked; a single fixed panel sidesteps both. Clicking "⋮" just
// tells the parent which node to edit. Being the currently-edited node
// gets a brightness bump + raised shadow so it's obvious which one the
// panel refers to.
function WorkflowNode({ id, data }) {
  return (
    <div style={{ position: "relative", marginTop: data.icon ? 16 : 0 }}>
      {data.icon && (
        <div
          style={{
            position: "absolute",
            top: -22,
            left: "50%",
            transform: "translateX(-50%)",
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#fff",
            border: `2px solid ${data.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            zIndex: 2,
          }}
        >
          {data.icon}
        </div>
      )}
      <div
        title={data.description || undefined}
        style={{
          background: data.color,
          color: "#fff",
          textAlign: "center",
          fontWeight: 600,
          fontSize: 13,
          boxSizing: "border-box",
          transition: "filter 0.15s, box-shadow 0.15s, transform 0.15s",
          filter: data.isEditing ? "brightness(1.2)" : "none",
          boxShadow: data.isEditing ? "0 8px 18px rgba(0,0,0,0.45)" : "0 2px 6px rgba(0,0,0,0.3)",
          transform: data.isEditing ? "translateY(-2px)" : "none",
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
        <span style={{ display: "block", width: "100%", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "break-word" }}>{data.label}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onOpenMenu(id);
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
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNode };

// A step-path edge with a draggable "bend" handle (the yellow dot),
// visible only while the edge is selected. The path is built by hand
// (not getSmoothStepPath's centerX/centerY, which turned out not to
// reliably pin the route to that point) as a Z-shaped 3-segment path that
// always passes exactly through (bendX, bendY) — guaranteeing the line
// and the dot never disagree about where the bend is. EdgeLabelRenderer
// is what lets the drag handle be plain HTML positioned in flow space
// (handles pan/zoom for us) instead of raw SVG.
function WorkflowEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, selected, data }) {
  const { screenToFlowPosition } = useReactFlow();

  const bendX = data?.bendX ?? (sourceX + targetX) / 2;
  const bendY = data?.bendY ?? (sourceY + targetY) / 2;
  const path = `M ${sourceX},${sourceY} L ${sourceX},${bendY} L ${bendX},${bendY} L ${bendX},${targetY} L ${targetX},${targetY}`;

  const onPointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const onMove = (ev) => {
      const pos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      data.onDragBend(id, pos.x, pos.y);
    };
    const onUp = (ev) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      const pos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      data.onCommitBend(id, pos.x, pos.y);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {selected && (
        <EdgeLabelRenderer>
          <div
            onPointerDown={onPointerDown}
            title="Geser untuk atur jalur"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${bendX}px, ${bendY}px)`,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#fbbf24",
              border: "2px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
              cursor: "grab",
              pointerEvents: "all",
            }}
          />
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { workflow: WorkflowEdge };

// Fixed top-right panel (screen pixels, not part of ReactFlow's zoomed/
// panned canvas — so it never scales or drifts) for editing whichever
// node is currently selected. Mirrors EdgePanel below so both controls
// live in the same predictable spot instead of following the mouse.
function EditNodePanel({ node, onClose }) {
  const { updateNodeLabel, updateNodeColor, updateNodeShape, updateNodeIcon, updateNodeDescription, deleteNode } = useWorkflow();
  const [text, setText] = useState(node.label);
  const [description, setDescription] = useState(node.description || "");

  useEffect(() => {
    setText(node.label);
    setDescription(node.description || "");
  }, [node.id, node.label, node.description]);

  const commitLabel = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== node.label) updateNodeLabel(node.id, trimmed);
    else setText(node.label);
  };

  const commitDescription = () => {
    if (description !== (node.description || "")) updateNodeDescription(node.id, description || null);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        zIndex: 6,
        background: "#fff",
        borderRadius: 8,
        padding: 10,
        width: 200,
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#333" }}>Edit node</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a94a6", fontSize: 14, padding: 0 }}>
          ✕
        </button>
      </div>

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

      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a94a6", marginBottom: 3 }}>Deskripsi</div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={commitDescription}
        placeholder="Keterangan untuk node ini..."
        rows={3}
        style={{
          width: "100%",
          padding: "5px 7px",
          borderRadius: 4,
          border: "1px solid #ddd",
          fontSize: 12.5,
          fontFamily: "inherit",
          boxSizing: "border-box",
          resize: "vertical",
          marginBottom: 10,
        }}
      />

      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a94a6", marginBottom: 4 }}>Warna</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => updateNodeColor(node.id, c)}
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: c,
              border: node.color === c ? "2px solid #333" : "1px solid #ddd",
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
            onClick={() => updateNodeShape(node.id, s.id)}
            style={{
              flex: 1,
              padding: "5px 0",
              fontSize: 15,
              borderRadius: 4,
              border: (node.shape || "rectangle") === s.id ? "2px solid #333" : "1px solid #ddd",
              background: "#fafafa",
              cursor: "pointer",
              color: "#333",
            }}
          >
            {s.icon}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a94a6", marginBottom: 4 }}>Ikon</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10, maxHeight: 90, overflowY: "auto" }}>
        <button
          title="Tanpa ikon"
          onClick={() => updateNodeIcon(node.id, null)}
          style={{
            width: 24,
            height: 24,
            fontSize: 11,
            borderRadius: 4,
            border: !node.icon ? "2px solid #333" : "1px solid #ddd",
            background: "#fafafa",
            cursor: "pointer",
            color: "#999",
          }}
        >
          ✕
        </button>
        {ICONS.map((ic) => (
          <button
            key={ic.emoji}
            title={ic.label}
            onClick={() => updateNodeIcon(node.id, ic.emoji)}
            style={{
              width: 24,
              height: 24,
              fontSize: 13,
              borderRadius: 4,
              border: node.icon === ic.emoji ? "2px solid #333" : "1px solid #ddd",
              background: "#fafafa",
              cursor: "pointer",
            }}
          >
            {ic.emoji}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          deleteNode(node.id);
          onClose();
        }}
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
  );
}

// Same fixed-panel idea as EditNodePanel, for whichever edge is selected.
function EditEdgePanel({ edge, onClose }) {
  const { updateEdgeColor, updateEdgeDashed } = useWorkflow();
  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        zIndex: 6,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        padding: "7px 9px",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}
    >
      <span style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600, marginRight: 2 }}>Panah</span>
      {COLOR_PALETTE.concat("#8a94a6").map((c) => (
        <button
          key={c}
          onClick={() => updateEdgeColor(edge.id, c)}
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: c,
            border: (edge.color || "#8a94a6") === c ? "2px solid #333" : "1px solid #ddd",
            cursor: "pointer",
            padding: 0,
          }}
        />
      ))}
      <button
        onClick={() => updateEdgeDashed(edge.id, !edge.dashed)}
        title={edge.dashed ? "Jadikan garis penuh" : "Jadikan garis putus-putus"}
        style={{
          padding: "3px 8px",
          fontSize: 11,
          borderRadius: 5,
          border: "1px solid #ddd",
          background: edge.dashed ? "#eef2ff" : "#fafafa",
          color: "#333",
          cursor: "pointer",
          marginLeft: 4,
        }}
      >
        {edge.dashed ? "┅┅" : "───"}
      </button>
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#8a94a6", fontSize: 13, padding: "0 2px", marginLeft: 2 }}
      >
        ✕
      </button>
    </div>
  );
}

function WorkflowCanvas() {
  const { t } = useLanguage();
  const {
    workflowNodes,
    workflowEdges,
    addNode,
    updateNodePosition,
    addEdge: addWorkflowEdge,
    deleteEdge,
    updateEdgeBend,
    deleteNode,
  } = useWorkflow();
  const { screenToFlowPosition } = useReactFlow();
  const addButtonRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);

  // Live drag feedback for the bend-point handle updates local edge state
  // directly (bypassing context/DB on every pointermove); only the drop
  // persists via updateEdgeBend.
  const handleDragBend = useCallback((edgeId, x, y) => {
    setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, bendX: x, bendY: y } } : e)));
  }, []);
  const handleCommitBend = useCallback(
    (edgeId, x, y) => updateEdgeBend(edgeId, x, y),
    [updateEdgeBend]
  );

  const handleOpenNodeMenu = useCallback((id) => {
    setEditingNodeId(id);
    setSelectedEdgeId(null);
  }, []);

  // Synced from context (initial load + Realtime updates from other
  // sessions) into ReactFlow's own node shape. A node being actively
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
        data: { label: n.label, color: n.color, shape: n.shape, icon: n.icon, description: n.description, isEditing: n.id === editingNodeId, onOpenMenu: handleOpenNodeMenu },
      }))
    );
  }, [workflowNodes, editingNodeId, handleOpenNodeMenu]);

  useEffect(() => {
    setEdges(
      workflowEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        // Whichever handle was actually dragged from/to when the
        // connection was made — manual, not auto-recomputed as nodes
        // move (see addEdge in WorkflowContext).
        sourceHandle: e.sourceHandle || "bottom-s",
        targetHandle: e.targetHandle || "top-t",
        type: "workflow",
        selected: e.id === selectedEdgeId,
        markerEnd: { type: MarkerType.ArrowClosed, color: e.color || "#8a94a6" },
        style: {
          stroke: e.color || "#8a94a6",
          strokeWidth: e.id === selectedEdgeId ? 2.5 : 1.5,
          strokeDasharray: e.dashed ? "6 4" : undefined,
        },
        data: { bendX: e.bendX, bendY: e.bendY, onDragBend: handleDragBend, onCommitBend: handleCommitBend },
      }))
    );
  }, [workflowEdges, selectedEdgeId, handleDragBend, handleCommitBend]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onNodeDragStop = useCallback(
    (event, node) => updateNodePosition(node.id, node.position.x, node.position.y),
    [updateNodePosition]
  );

  // Persists exactly the handle the user dragged from/to — manual, per
  // the earlier auto-shortest-path attempt turning out less predictable
  // than just respecting what was actually drawn.
  const onConnect = useCallback(
    (connection) => addWorkflowEdge(connection.source, connection.target, connection.sourceHandle, connection.targetHandle),
    [addWorkflowEdge]
  );

  const onEdgesDelete = useCallback(
    (deleted) => {
      deleted.forEach((e) => deleteEdge(e.id));
      setSelectedEdgeId((prev) => (deleted.some((e) => e.id === prev) ? null : prev));
    },
    [deleteEdge]
  );
  const onNodesDelete = useCallback(
    (deleted) => {
      deleted.forEach((n) => deleteNode(n.id));
      setEditingNodeId((prev) => (deleted.some((n) => n.id === prev) ? null : prev));
    },
    [deleteNode]
  );
  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdgeId(edge.id);
    setEditingNodeId(null);
  }, []);
  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null);
    setEditingNodeId(null);
  }, []);

  // Lands predictably below the "+ Tugas baru" button instead of at a
  // random spot that could land anywhere on the canvas. A fixed flow-space
  // coordinate isn't enough on its own — once the user has panned/zoomed,
  // a flow-space point no longer lines up with the button's actual screen
  // position, so the button's real on-screen rect is converted through
  // screenToFlowPosition (accounts for current pan/zoom) each time.
  // Stacks downward as more nodes get added so repeated clicks don't pile
  // new nodes exactly on top of each other.
  const handleAddNode = () => {
    const rect = addButtonRef.current?.getBoundingClientRect();
    const basePos = rect ? screenToFlowPosition({ x: rect.left, y: rect.bottom + 20 }) : { x: 40, y: 70 };
    addNode(t("workflowView.newNodeLabel"), "#579bfc", basePos.x, basePos.y + workflowNodes.length * 80);
  };

  const editingNode = editingNodeId ? workflowNodes.find((n) => n.id === editingNodeId) : null;
  const selectedEdge = selectedEdgeId ? workflowEdges.find((e) => e.id === selectedEdgeId) : null;

  return (
    <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <div style={{ position: "absolute", top: 14, left: 14, zIndex: 5 }}>
        <button
          ref={addButtonRef}
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

      {editingNode && <EditNodePanel node={editingNode} onClose={() => setEditingNodeId(null)} />}
      {!editingNode && selectedEdge && <EditEdgePanel edge={selectedEdge} onClose={() => setSelectedEdgeId(null)} />}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={onNodesDelete}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        deleteKeyCode={["Backspace", "Delete"]}
        connectionMode="loose"
        fitView
      >
        <Background variant="dots" gap={16} size={1} />
        <Controls />
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
