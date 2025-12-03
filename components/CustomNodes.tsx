import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ProcessData, ResourceData } from '../types';
import { Box, Layers, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export const ProcessNode = memo(({ data, selected }: NodeProps<ProcessData>) => {
  return (
    <div
      className={clsx(
        "relative min-w-[140px] px-3 py-2 bg-white rounded-md shadow-sm border transition-all duration-200 group",
        data.isDeadlocked ? "border-red-400 ring-2 ring-red-100" : "border-gray-200",
        selected && !data.isDeadlocked ? "ring-2 ring-blue-100 border-blue-400" : "",
        "hover:shadow-md"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={clsx(
          "p-1 rounded text-white",
          data.isDeadlocked ? "bg-red-500" : "bg-purple-600"
        )}>
           {data.isDeadlocked ? <AlertCircle size={14} /> : <Box size={14} />}
        </div>
        <span className="text-sm font-semibold text-gray-800">{data.label}</span>
      </div>
      <div className="text-xs text-gray-500 font-mono">
        PID: {data.pid}
      </div>
      
      {/* Notion-like 'property' hint */}
      <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider flex justify-between">
        <span>Process</span>
        {data.isDeadlocked && <span className="text-red-500 font-bold">STUCK</span>}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-2 !h-2 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-2 !h-2 !border-2 !border-white"
      />
    </div>
  );
});

export const ResourceNode = memo(({ data, selected }: NodeProps<ResourceData>) => {
  return (
    <div
      className={clsx(
        "relative min-w-[140px] px-3 py-2 bg-white rounded-md shadow-sm border transition-all duration-200",
        data.isDeadlocked ? "border-red-400 ring-2 ring-red-100" : "border-gray-200",
        selected && !data.isDeadlocked ? "ring-2 ring-blue-100 border-blue-400" : "",
        "hover:shadow-md"
      )}
    >
       <div className="flex items-center gap-2 mb-1">
        <div className="p-1 rounded bg-gray-100 text-gray-600">
          <Layers size={14} />
        </div>
        <span className="text-sm font-semibold text-gray-800">{data.label}</span>
      </div>
      
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
           {data.instances} units
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider flex justify-between">
        <span>Resource</span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-2 !h-2 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-2 !h-2 !border-2 !border-white"
      />
    </div>
  );
});
