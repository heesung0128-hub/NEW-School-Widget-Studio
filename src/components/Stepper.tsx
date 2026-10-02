import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  current: number;
  onSelect: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, current, onSelect }) => (
  <nav aria-label="진행 단계">
    <ol className="flex items-center gap-1 sm:gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? 'step' : undefined}
              className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-h-14 px-1 sm:px-3 py-2 rounded-xl border-2 text-sm sm:text-base font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : done
                    ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs shrink-0 ${
                  active ? 'bg-white text-blue-700' : done ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
                aria-hidden="true"
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);
