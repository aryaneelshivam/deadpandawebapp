import React from 'react';
import { Box, Layers, GripVertical, PlayCircle, CheckCircle } from 'lucide-react';

interface SidebarProps {
  onLoadSample: () => void;
  onLoadSafeCase: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLoadSample, onLoadSafeCase }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest">Library</h2>

        <div className="space-y-2">
          <div
            className="group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded cursor-move hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all"
            onDragStart={(event) => onDragStart(event, 'process')}
            draggable
          >
            <GripVertical size={16} className="text-gray-300 group-hover:text-gray-400" />
            <div className="p-1.5 bg-purple-100 rounded text-purple-600">
              <Box size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Process</p>
              <p className="text-[10px] text-gray-400">Active entity</p>
            </div>
          </div>

          <div
            className="group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded cursor-move hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all"
            onDragStart={(event) => onDragStart(event, 'resource')}
            draggable
          >
            <GripVertical size={16} className="text-gray-300 group-hover:text-gray-400" />
            <div className="p-1.5 bg-gray-100 rounded text-gray-600">
              <Layers size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Resource</p>
              <p className="text-[10px] text-gray-400">Allocatable item</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-widest">Scenarios</h2>
          <div className="space-y-2">
            <button
              onClick={onLoadSample}
              className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all text-left"
            >
              <PlayCircle size={16} className="text-red-500" />
              <span>Load Sample Deadlock</span>
            </button>
            <button
              onClick={onLoadSafeCase}
              className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all text-left"
            >
              <CheckCircle size={16} className="text-green-500" />
              <span>Load Safe Case (No Deadlock)</span>
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-widest">Instructions</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            1. Drag items to canvas.<br />
            2. Connect handles to create edges.<br />
            3. <strong>Process → Resource</strong> = Request.<br />
            4. <strong>Resource → Process</strong> = Allocation.<br />
            5. Use Inspector to change instances.
          </p>
        </div>
      </div>
    </aside>
  );
};