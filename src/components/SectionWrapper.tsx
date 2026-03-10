import React from 'react';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useVisualBuilder } from '../context/VisualBuilderContext';

interface SectionWrapperProps {
  id: string;
  label: string;
  children: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  label,
  children,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
}) => {
  const { isEditMode } = useVisualBuilder();

  if (!isEditMode) return <>{children}</>;

  return (
    <div className="group/section relative" data-section-id={id}>
      {/* Section Controls — visible on hover */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[90] opacity-0 group-hover/section:opacity-100 transition-all duration-200 -translate-x-2 group-hover/section:translate-x-0">
        <div className="flex flex-col items-center bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* Move Up */}
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={isFirst}
            className={`p-2 transition-all ${isFirst ? 'text-slate-600 cursor-not-allowed' : 'text-white hover:bg-blue-600'}`}
            title="Move Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          {/* Label */}
          <div className="px-2 py-1.5 border-y border-slate-700 flex items-center gap-1">
            <GripVertical className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</span>
          </div>

          {/* Move Down */}
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={isLast}
            className={`p-2 transition-all ${isLast ? 'text-slate-600 cursor-not-allowed' : 'text-white hover:bg-blue-600'}`}
            title="Move Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section highlight border on hover */}
      <div className="group-hover/section:ring-2 group-hover/section:ring-blue-400/30 group-hover/section:ring-offset-2 rounded-lg transition-all duration-200">
        {children}
      </div>
    </div>
  );
};

export default SectionWrapper;
