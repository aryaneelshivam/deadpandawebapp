import { Edge, Node } from 'reactflow';
import { DeadlockReport, ProcessData, ResourceData } from '../types';

/**
 * Parses the React Flow graph into a more usable structure for algorithms.
 */
const parseGraph = (nodes: Node[], edges: Edge[]) => {
  const processes = nodes.filter((n) => n.type === 'process');
  const resources = nodes.filter((n) => n.type === 'resource');
  
  // Map of Resource ID -> Total Instances
  const totalResources: Record<string, number> = {};
  resources.forEach((r) => {
    totalResources[r.id] = (r.data as ResourceData).instances || 1;
  });

  // Map of Resource ID -> Current Allocation Count
  const allocatedResources: Record<string, number> = {};
  resources.forEach(r => allocatedResources[r.id] = 0);

  // Adjacency for cycle detection later
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => adj[n.id] = []);

  // Allocation Matrix: Allocation[PID][RID] = count
  const allocationMatrix: Record<string, Record<string, number>> = {};
  
  // Request Matrix: Request[PID][RID] = count
  const requestMatrix: Record<string, Record<string, number>> = {};

  // Initialize matrices
  processes.forEach(p => {
    allocationMatrix[p.id] = {};
    requestMatrix[p.id] = {};
    resources.forEach(r => {
      allocationMatrix[p.id][r.id] = 0;
      requestMatrix[p.id][r.id] = 0;
    });
  });

  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    // Add to adjacency list for cycle detection
    adj[edge.source].push(edge.target);

    // Allocation Edge: Resource -> Process
    if (sourceNode.type === 'resource' && targetNode.type === 'process') {
      const rid = sourceNode.id;
      const pid = targetNode.id;
      // Assume weight 1 for simple edges, could be enhanced with edge data
      const count = 1; 
      allocationMatrix[pid][rid] = (allocationMatrix[pid][rid] || 0) + count;
      allocatedResources[rid] = (allocatedResources[rid] || 0) + count;
    }

    // Request Edge: Process -> Resource
    if (sourceNode.type === 'process' && targetNode.type === 'resource') {
      const pid = sourceNode.id;
      const rid = targetNode.id;
      const count = 1;
      requestMatrix[pid][rid] = (requestMatrix[pid][rid] || 0) + count;
    }
  });

  // Calculate Available Vector
  const availableResources: Record<string, number> = {};
  resources.forEach(r => {
    availableResources[r.id] = totalResources[r.id] - (allocatedResources[r.id] || 0);
  });

  return {
    processes,
    resources,
    allocationMatrix,
    requestMatrix,
    availableResources,
    adj,
  };
};

/**
 * Detects deadlocks using Graph Reduction (finding a safe sequence).
 * Then uses DFS to find cycles among the deadlocked nodes for visualization.
 */
export const detectDeadlock = (nodes: Node[], edges: Edge[]): DeadlockReport => {
  const {
    processes,
    allocationMatrix,
    requestMatrix,
    availableResources,
    adj
  } = parseGraph(nodes, edges);

  const log: any[] = [];
  const finish: Record<string, boolean> = {};
  processes.forEach(p => finish[p.id] = false);

  let progress = true;
  const safeSequence: string[] = [];

  // 1. Graph Reduction Loop
  while (progress) {
    progress = false;
    
    for (const p of processes) {
      if (!finish[p.id]) {
        let canAllocate = true;
        // Check if all requests can be satisfied
        for (const rid in requestMatrix[p.id]) {
          if (requestMatrix[p.id][rid] > (availableResources[rid] || 0)) {
            canAllocate = false;
            break;
          }
        }

        if (canAllocate) {
          // Process can finish
          finish[p.id] = true;
          safeSequence.push(p.id);
          progress = true;
          
          // Release resources
          for (const rid in allocationMatrix[p.id]) {
            availableResources[rid] += allocationMatrix[p.id][rid];
          }
        }
      }
    }
  }

  // 2. Identify Deadlocked Nodes
  const deadlockedProcessIds = processes.filter(p => !finish[p.id]).map(p => p.id);
  const isDeadlocked = deadlockedProcessIds.length > 0;
  
  // Identify resources held or requested by deadlocked processes
  const deadlockedResourceIds = new Set<string>();
  if (isDeadlocked) {
    deadlockedProcessIds.forEach(pid => {
      // Add resources this process is holding
      for (const rid in allocationMatrix[pid]) {
        if (allocationMatrix[pid][rid] > 0) deadlockedResourceIds.add(rid);
      }
      // Add resources this process is requesting
      for (const rid in requestMatrix[pid]) {
        if (requestMatrix[pid][rid] > 0) deadlockedResourceIds.add(rid);
      }
    });
  }

  // 3. Find Cycles (DFS) within the deadlocked subgraph to explain WHY
  const cycles: string[][] = [];
  if (isDeadlocked) {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    // Only search within the deadlocked set
    const interestingNodes = new Set([...deadlockedProcessIds, ...deadlockedResourceIds]);

    const findCycle = (curr: string) => {
      visited.add(curr);
      recursionStack.add(curr);
      path.push(curr);

      const neighbors = adj[curr] || [];
      for (const neighbor of neighbors) {
        if (!interestingNodes.has(neighbor)) continue;

        if (!visited.has(neighbor)) {
          if (findCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          // Cycle detected!
          // Extract the cycle from the path
          const cycleStartIndex = path.indexOf(neighbor);
          const cycle = path.slice(cycleStartIndex);
          // Normalize cycle (rotate to start with smallest ID for deduping if needed)
          // For now, just push it.
          cycles.push([...cycle]);
          // Don't stop, find all? For now, let's just return true to unwind this path
          // but we might want multiple cycles. DFS usually finds one per connected comp entry.
          // Let's just find one to start.
          // To find all, we shouldn't return true immediately, but simple DFS is tricky for all simple cycles.
          // We'll stick to finding at least one explanatory cycle per deadlock cluster.
        }
      }

      recursionStack.delete(curr);
      path.pop();
      return false;
    };

    for (const pid of deadlockedProcessIds) {
      if (!visited.has(pid)) {
        findCycle(pid);
      }
    }
  }

  // Generate Log
  if (isDeadlocked) {
    log.push({
      message: `Deadlock detected! Processes [${deadlockedProcessIds.join(', ')}] are stuck.`,
      type: 'error',
      timestamp: Date.now()
    });
    if (cycles.length > 0) {
      log.push({
        message: `Circular wait detected: ${cycles[0].map(id => nodes.find(n => n.id === id)?.data.label).join(' -> ')}`,
        type: 'info',
        timestamp: Date.now()
      });
    }
  } else {
    log.push({
      message: `System is safe. Safe sequence: ${safeSequence.length > 0 ? safeSequence.map(id => nodes.find(n => n.id === id)?.data.label).join(' -> ') : 'None needed (empty)'}`,
      type: 'success',
      timestamp: Date.now()
    });
  }

  return {
    isDeadlocked,
    deadlockedProcessIds,
    deadlockedResourceIds: Array.from(deadlockedResourceIds),
    cycles,
    log
  };
};
