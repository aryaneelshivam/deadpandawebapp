import { Edge, Node } from 'reactflow';

export type NodeType = 'process' | 'resource';

export interface ProcessData {
  label: string;
  pid: string;
  isDeadlocked?: boolean;
}

export interface ResourceData {
  label: string;
  rid: string;
  instances: number;
  available?: number; // Calculated during simulation
  isDeadlocked?: boolean;
}

export interface SimulationStep {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: number;
}

export interface DeadlockReport {
  isDeadlocked: boolean;
  deadlockedProcessIds: string[];
  deadlockedResourceIds: string[];
  cycles: string[][]; // Array of cycles, each cycle is an array of node IDs
  log: SimulationStep[];
}

// React Flow Types
export type AppNode = Node<ProcessData | ResourceData>;
export type AppEdge = Edge;
