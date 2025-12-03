import React, { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  MarkerType,
} from 'reactflow';
import { Sidebar } from './components/Sidebar';
import { Inspector } from './components/Inspector';
import { ProcessNode, ResourceNode } from './components/CustomNodes';
import { detectDeadlock } from './services/deadlockEngine';
import { DeadlockReport } from './types';

// Initial state for onboarding
const initialNodes: Node[] = [
  { id: 'p1', type: 'process', position: { x: 250, y: 100 }, data: { label: 'Process 1', pid: 'P1' } },
  { id: 'r1', type: 'resource', position: { x: 250, y: 300 }, data: { label: 'Resource 1', rid: 'R1', instances: 1 } },
];
const initialEdges: Edge[] = [];

let id = 0;
const getId = () => `node_${id++}_${Date.now()}`;

const AppContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [report, setReport] = useState<DeadlockReport | null>(null);

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    process: ProcessNode,
    resource: ResourceNode,
  }), []);

  // Handle connection logic with validation
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // Prevent same type connection (no Process->Process or Resource->Resource)
      if (sourceNode.type === targetNode.type) {
        alert("You must connect a Process to a Resource (Request) or a Resource to a Process (Allocation).");
        return;
      }

      // If Resource -> Process, check if we exceed instances? 
      // For UX simplicity, we allow drawing the edge, but deadlock detector will validate logically.
      
      const isAllocation = sourceNode.type === 'resource';
      
      const newEdge: Edge = {
        ...params,
        id: `e_${params.source}_${params.target}_${Date.now()}`,
        type: 'default',
        animated: !isAllocation, // Dashed/Animated for Requests
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isAllocation ? '#000' : '#b1b1b7',
        },
        style: {
          stroke: isAllocation ? '#000' : '#b1b1b7',
          strokeWidth: 1.5,
          strokeDasharray: isAllocation ? '0' : '5 5',
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      // Reset report on graph change
      setReport(null);
    },
    [nodes, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { 
          label: type === 'process' ? `New Process` : `New Resource`,
          pid: type === 'process' ? `P${Math.floor(Math.random() * 1000)}` : undefined,
          rid: type === 'resource' ? `R${Math.floor(Math.random() * 1000)}` : undefined,
          instances: type === 'resource' ? 1 : undefined
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setReport(null);
    },
    [reactFlowInstance, setNodes]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    if (selectedNodes.length > 0) {
      setSelectedNodeId(selectedNodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  const onUpdateNode = (id: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    );
    setReport(null);
  };

  const handleRunSimulation = () => {
    const result = detectDeadlock(nodes, edges);
    setReport(result);

    // Update nodes visual state based on deadlock result
    setNodes((nds) => nds.map(node => {
      const isDeadlocked = 
        result.deadlockedProcessIds.includes(node.id) || 
        result.deadlockedResourceIds.includes(node.id);
      
      return {
        ...node,
        data: {
          ...node.data,
          isDeadlocked
        }
      };
    }));

    // Highlight edges involved in cycles
    if (result.isDeadlocked && result.cycles.length > 0) {
      const cycleNodes = new Set(result.cycles[0]);
      setEdges(eds => eds.map(edge => {
        const isCycleEdge = cycleNodes.has(edge.source) && cycleNodes.has(edge.target);
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isCycleEdge ? '#EF4444' : (edge.style?.stroke || '#b1b1b7'),
            strokeWidth: isCycleEdge ? 3 : 1.5
          },
          animated: isCycleEdge ? true : edge.animated
        }
      }));
    }
  };

  const handleReset = () => {
    setReport(null);
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isDeadlocked: false }
    })));
    setEdges(eds => eds.map(e => ({
      ...e,
      animated: e.source.startsWith('p') || (nodes.find(n=>n.id===e.source)?.type === 'process'), // simple heuristic to restore dashed
      style: {
        ...e.style,
        stroke: (nodes.find(n=>n.id===e.source)?.type === 'resource') ? '#000' : '#b1b1b7',
        strokeWidth: 1.5
      }
    })));
  };

  const handleLoadSample = () => {
    // Standard Circular Wait Deadlock
    // P1 holds R2, wants R1
    // P2 holds R1, wants R2
    
    // We will visualize it as:
    // P1 requests R1. R1 allocated to P2. P2 requests R2. R2 allocated to P1.
    // Cycle: P1 -> R1 -> P2 -> R2 -> P1
    
    const p1Id = 'p_sample_1';
    const p2Id = 'p_sample_2';
    const r1Id = 'r_sample_1';
    const r2Id = 'r_sample_2';

    const newNodes: Node[] = [
      { id: p1Id, type: 'process', position: { x: 100, y: 200 }, data: { label: 'Process A', pid: 'P1' } },
      { id: p2Id, type: 'process', position: { x: 400, y: 200 }, data: { label: 'Process B', pid: 'P2' } },
      { id: r1Id, type: 'resource', position: { x: 250, y: 50 }, data: { label: 'Resource X', rid: 'RX', instances: 1 } },
      { id: r2Id, type: 'resource', position: { x: 250, y: 350 }, data: { label: 'Resource Y', rid: 'RY', instances: 1 } },
    ];

    const newEdges: Edge[] = [
      // P1 requests R1 (Top)
      { 
        id: 'e_s1', source: p1Id, target: r1Id, 
        type: 'default', animated: true, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#b1b1b7' }, 
        style: { stroke: '#b1b1b7', strokeWidth: 1.5, strokeDasharray: '5 5' } 
      },
      // R1 allocated to P2 (Top -> Right)
      { 
        id: 'e_s2', source: r1Id, target: p2Id, 
        type: 'default', animated: false, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#000' }, 
        style: { stroke: '#000', strokeWidth: 1.5, strokeDasharray: '0' } 
      },
      // P2 requests R2 (Right -> Bottom)
      { 
        id: 'e_s3', source: p2Id, target: r2Id, 
        type: 'default', animated: true, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#b1b1b7' }, 
        style: { stroke: '#b1b1b7', strokeWidth: 1.5, strokeDasharray: '5 5' } 
      },
      // R2 allocated to P1 (Bottom -> Left)
      { 
        id: 'e_s4', source: r2Id, target: p1Id, 
        type: 'default', animated: false, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#000' }, 
        style: { stroke: '#000', strokeWidth: 1.5, strokeDasharray: '0' } 
      },
    ];

    setNodes(newNodes);
    setEdges(newEdges);
    setReport(null);
    setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 100);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex h-screen w-screen bg-white">
      <Sidebar onLoadSample={handleLoadSample} />
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur border border-gray-200 p-2 rounded shadow-sm text-xs text-gray-400">
           Deadpanda v1.0
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#FFFFFF]"
        >
          <Background color="#E5E7EB" gap={20} size={1} />
          <Controls className="!bg-white !border-gray-200 !shadow-sm [&>button]:!border-gray-100 [&>button:hover]:!bg-gray-50 [&>button]:!text-gray-600" />
        </ReactFlow>
      </div>
      <Inspector 
        selectedNode={selectedNode} 
        onUpdateNode={onUpdateNode}
        report={report}
        onRunSimulation={handleRunSimulation}
        onReset={handleReset}
      />
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}