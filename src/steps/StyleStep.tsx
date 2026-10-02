import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { WidgetConfig, WidgetTheme } from '../types';
import { cardCls, sectionTitle, mutedText } from '../components/ui';

interface StepProps {
  config: WidgetConfig;
  onUpdateConfig: (newConfig: WidgetConfig) => void;
}

const THEMES: { id: WidgetTheme; name: string; bg: string; accent: string }[] = [
  { id: 'dark-acrylic', name: '모던 다크', bg: '#0F172A', accent: '#60A5FA' },
  { id: 'light-acrylic', name: '밝은 화이트', bg: '#F8FAFC', accent: '#2563EB' },
  { id: 'slate-glass', name: '차분한 회색', bg: '#334155', accent: '#38BDF8' },
  { id: 'emerald-glass', name: '편안한 초록', bg: '#022C22', accent: '#34D399' },
  { id: 'indigo-glass', name: '깊은 남색', bg: '#1E1B4B', accent: '#818CF8' },
  { id: 'sakura-glass', name: '벚꽃 분홍', bg: '#500724', accent: '#F472B6' },
  { id: 'amber-glass', name: '따뜻한 호박색', bg: '#451A03', accent: '#FBBF24' },
  { id: 'mono-glass', name: '흑백 선명', bg: '#0A0A0A', accent: '#FACC15' },
];

interface SliderProps {
  id: string;
  label: string;
  hint?: string;
  valueText: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}

const SliderField: React.FC<SliderProps> = ({ id, label, hint, valueText, min, max, step, value, onChange }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={id} className="text-base font-semibold text-slate-800">{label}</label>
      <span className="text-base font-bold text-blue-700">{valueText}</span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="mt-2 w-full h-6 accent-blue-600 cursor-pointer"
    />
    {hint && <p className={`${mutedText} mt-1`}>{hint}</p>}
  </div>
);

export const StyleStep: React.FC<StepProps> = ({ config, onUpdateConfig }) => {
  const set = (patch: Partial<WidgetConfig>) => onUpdateConfig({ ...config, ...patch });
  const snapSide = config.snapSide || 'right';

  return (
    <div className="space-y-5">
      <section className={cardCls}>
        <h2 className={sectionTitle}>마음에 드는 색을 골라보세요</h2>
        <p className={`${mutedText} mt-1`}>오른쪽 미리보기에 바로 반영돼요. 나중에 언제든 바꿀 수 있어요.</p>

        <div role="group" aria-label="위젯 색상 테마" className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEMES.map((t) => {
            const selected = config.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => set({ theme: t.id })}
                aria-pressed={selected}
                className={`relative text-left p-3 rounded-xl border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span
                  className="block h-12 rounded-lg border border-slate-200"
                  style={{ background: t.bg }}
                  aria-hidden="true"
                >
                  <span className="block w-8 h-2 rounded-full mt-3 ml-3" style={{ background: t.accent }} />
                  <span className="block w-14 h-2 rounded-full mt-1.5 ml-3 opacity-40" style={{ background: t.accent }} />
                </span>
                <span className="mt-2 flex items-center justify-between gap-1 text-sm font-bold text-slate-900">
                  {t.name}
                  {selected && <Check className="w-4 h-4 text-blue-600" aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${cardCls} space-y-6`}>
        <SliderField
          id="font-scale"
          label="글씨 크기"
          valueText={`${Math.round((config.fontScale ?? 1) * 100)}%`}
          hint="위젯 전체 글씨와 칸 크기가 함께 커지거나 작아져요."
          min={0.85}
          max={1.3}
          step={0.05}
          value={config.fontScale ?? 1}
          onChange={(v) => set({ fontScale: v })}
        />
        <SliderField
          id="opacity"
          label="투명도"
          valueText={`${Math.round(config.opacity * 100)}%`}
          hint="낮출수록 뒤의 바탕화면이 비쳐 보여요."
          min={0.6}
          max={1}
          step={0.05}
          value={config.opacity}
          onChange={(v) => set({ opacity: v })}
        />
      </section>

      <details className={`${cardCls} group`}>
        <summary className="flex items-center justify-between cursor-pointer list-none text-lg font-bold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
          더 꾸미기 (선택)
          <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="mt-5 space-y-6">
          <SliderField
            id="corner-radius"
            label="모서리 둥근 정도"
            valueText={`${config.cornerRadius ?? 18}px`}
            min={4}
            max={28}
            step={1}
            value={config.cornerRadius ?? 18}
            onChange={(v) => set({ cornerRadius: v })}
          />

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="accent-color" className="text-base font-semibold text-slate-800">
                포인트 색 직접 고르기
              </label>
              {config.customAccentColor && (
                <button
                  type="button"
                  onClick={() => set({ customAccentColor: undefined })}
                  className="text-sm text-blue-700 underline underline-offset-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  테마 기본색으로
                </button>
              )}
            </div>
            <input
              id="accent-color"
              type="color"
              value={config.customAccentColor || '#3B82F6'}
              onChange={(e) => set({ customAccentColor: e.target.value })}
              className="mt-2 w-14 h-11 rounded-lg border border-slate-300 bg-white cursor-pointer"
            />
          </div>

          <div role="group" aria-labelledby="snap-side-label">
            <div id="snap-side-label" className="text-base font-semibold text-slate-800 mb-2">
              화면 어느 쪽에 붙일까요?
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['left', '왼쪽 위'],
                ['right', '오른쪽 위'],
              ] as const).map(([side, label]) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => set({ snapSide: side })}
                  aria-pressed={snapSide === side}
                  className={`min-h-11 rounded-xl border-2 text-base font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    snapSide === side
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className={`${mutedText} mt-1`}>위젯을 끌었다 놓으면 이쪽 모서리로 자동으로 붙어요.</p>
          </div>

          <SliderField
            id="snap-margin"
            label="화면 가장자리와의 간격"
            valueText={`${config.snapMargin}px`}
            min={0}
            max={60}
            step={5}
            value={config.snapMargin}
            onChange={(v) => set({ snapMargin: v })}
          />

          <label className="flex items-center gap-3 min-h-11 cursor-pointer text-base text-slate-800">
            <input
              type="checkbox"
              checked={config.alwaysOnTop}
              onChange={(e) => set({ alwaysOnTop: e.target.checked })}
              className="w-5 h-5 rounded accent-blue-600"
            />
            <span>다른 창 위에 항상 보이게 하기</span>
          </label>
        </div>
      </details>
    </div>
  );
};
