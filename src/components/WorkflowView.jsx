import { useCallback, useEffect, useState } from "react";
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

// A single flowchart box — colored rounded rect, double-click to rename
// inline, small swatch/delete buttons that only reveal on hover so they
// don't visually compete with the label at a glance.
function WorkflowNode({ id, data }) {
  const { updateNodeLabel, updateNodeColor, deleteNode } = useWorkflow();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.label);
  const [showColors, setShowColors] = useState(false);
  const [hovering, setHovering] = useState(false);

  const commitLabel = () => {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== data.label) updateNodeLabel(id, trimmed);
    else setText(data.label);
  };

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setShowColors(false);
      }}
      style={{
        background: data.color,
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 8,
        minWidth: 150,
        textAlign: "center",
        fontWeight: 600,
        fontSize: 13,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#fff", width: 8, height: 8 }} />
      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setText(data.label);
              setEditing(false);
            }
          }}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.25)",
            border: "none",
            borderRadius: 4,
            color: "#fff",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
            outline: "none",
            padding: "2px 4px",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <span onDoubleClick={() => setEditing(true)}>{data.label}</span>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: "#fff", width: 8, height: 8 }} />

      {hovering && (
        <div style={{ position: "absolute", top: -10, right: -8, display: "flex", gap: 3 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColors((p) => !p);
            }}
            style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #fff", background: data.color, cursor: "pointer", padding: 0 }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "#333", color: "#fff", fontSize: 10, cursor: "pointer", padding: 0, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      )}

      {showColors && (
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -8,
            display: "flex",
            gap: 4,
            background: "#fff",
            padding: 5,
            borderRadius: 6,
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              onClick={(e) => {
                e.stopPropagation();
                updateNodeColor(id, c);
                setShowColors(false);
              }}
              style={{ width: 16, height: 16, borderRadius: "50%", background: c, border: "none", cursor: "pointer", padding: 0 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNode };

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
        data: { label: n.label, color: n.color },
      }))
    );
  }, [workflowNodes]);

  useEffect(() => {
    setEdges(
      workflowEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#8a94a6", strokeWidth: 1.5 },
      }))
    );
  }, [workflowEdges]);

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
