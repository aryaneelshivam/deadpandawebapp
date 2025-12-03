import React from 'react';
import { Node, Edge } from 'reactflow';
import { Play, RotateCcw, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DeadlockReport } from '../types';

interface InspectorProps {
  selectedNode: Node | null;
  onUpdateNode: (id: string, data: any) => void;
  report: DeadlockReport | null;
  onRunSimulation: () => void;
  onReset: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({ 
  selectedNode, 
  onUpdateNode,
  report,
  onRunSimulation,
  onReset
}) => {
  return (
    <aside className="w-80 bg-white border-l border-[#E9E9E7] flex flex-col h-full overflow-y-auto shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
      
      {/* Simulation Control Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-widest">Simulation</h2>
        <div className="flex gap-2">
          <button 
            onClick={onRunSimulation}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2 px-3 rounded hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Play size={14} /> Run Check
          </button>
          <button 
            onClick={onReset}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-2 px-3 rounded hover:bg-gray-200 transition-colors"
            title="Reset Deadlock State"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Report Panel */}
      {report && (
        <div className="p-4 border-b border-gray-100 bg-[#FAFAFB]">
          <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Analysis Result</h3>
          {report.isDeadlocked ? (
            <div className="bg-red-50 border border-red-100 rounded-md p-3">
              <div className="flex items-start gap-2 text-red-700 font-medium text-sm">
                <AlertTriangle size={16} className="mt-0.5" />
                Deadlock Detected
              </div>
              <p className="text-xs text-red-600 mt-1">
                Cycle found involving: {report.deadlockedProcessIds.join(', ')}
              </p>
              {report.cycles.length > 0 && (
                 <div className="mt-2 text-[10px] font-mono bg-white/50 p-2 rounded">
                    Cycle: {report.cycles[0].join(' → ')}
                 </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-md p-3">
               <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                <CheckCircle2 size={16} />
                System Safe
              </div>
              <p className="text-xs text-green-600 mt-1">
                Safe sequence found.
              </p>
            </div>
          )}
          
          <div className="mt-3 space-y-1">
             {report.log.map((l, i) => (
               <div key={i} className="text-[10px] text-gray-500 font-mono border-l-2 border-gray-300 pl-2 py-0.5">
                 {l.message}
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Properties Editor */}
      <div className="p-4 flex-1">
        <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest">Properties</h2>
        
        {selectedNode ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
              <input 
                type="text" 
                value={selectedNode.data.label} 
                onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            
            {selectedNode.type === 'process' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Process ID (PID)</label>
                <input 
                  type="text" 
                  value={selectedNode.data.pid} 
                  onChange={(e) => onUpdateNode(selectedNode.id, { pid: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
            )}

            {selectedNode.type === 'resource' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Instances</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onUpdateNode(selectedNode.id, { instances: Math.max(1, selectedNode.data.instances - 1) })}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                  >-</button>
                  <span className="flex-1 text-center font-mono text-sm">{selectedNode.data.instances}</span>
                  <button 
                     onClick={() => onUpdateNode(selectedNode.id, { instances: selectedNode.data.instances + 1 })}
                     className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                  >+</button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
               <div className="text-[10px] text-gray-400">ID: {selectedNode.id}</div>
               <div className="text-[10px] text-gray-400">Pos: {Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
            <Activity size={32} className="mb-2 opacity-20" />
            <p className="text-sm">Select a node to edit properties</p>
          </div>
        )}
      </div>
    </aside>
  );
};
