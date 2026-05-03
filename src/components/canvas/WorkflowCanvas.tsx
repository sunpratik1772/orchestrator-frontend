import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./CustomNode";

const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  onConnect: (connection: Connection) => void;
  onNodeClick: (node: Node) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  selectedNodeId: string | null;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDrop,
  onDragOver,
  selectedNodeId,
}: WorkflowCanvasProps) {
  return (
    <div className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        defaultEdgeOptions={{
          style: { stroke: "#7c3aed", strokeWidth: 1.5 },
          animated: true,
          type: "smoothstep",
        }}
        connectionLineStyle={{ stroke: "#7c3aed", strokeWidth: 1.5 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--c-bg)" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--c-surface-2)"
        />
        <Controls
          style={{
            background: "var(--c-surface-3)",
            border: "1px solid var(--c-border)",
            borderRadius: "8px",
          }}
        />
        <MiniMap
          style={{
            background: "var(--c-bg)",
            border: "1px solid var(--c-border)",
            borderRadius: "8px",
          }}
          nodeColor="#7c3aed"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
