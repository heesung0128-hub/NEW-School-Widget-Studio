import React, { useState, useEffect, useRef } from 'react';
import { School, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { WidgetConfig } from './types';
import { DEFAULT_SCHOOL } from './utils/neisApi';
import { PreviewPanel } from './components/PreviewPanel';
import { Stepper } from './components/Stepper';
import { SchoolStep } from './steps/SchoolStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { StyleStep } from './steps/StyleStep';
import { DownloadStep } from './steps/DownloadStep';
import { btnPrimary, btnSecondary } from './components/ui';

const STORAGE_KEY = 'school_widget_config_evolved_v1';

const DEFAULT_CONFIG: WidgetConfig = {
  school: DEFAULT_SCHOOL,
  ddays: [
    { id: '1', title: '1학기 중간고사', targetDate: '2026-09-30' },
    { id: '2', title: '대학수학능력시험', targetDate: '2026-11-19' },
    { id: '3', title: '겨울방학식', targetDate: '2026-12-30' },
  ],
  timetable: [
    { day: '월', periods: ['문학 (3-1)', '문학 (3-2)', '상담', '수업준비', '진로지도', '동아리', '종례'] },
    { day: '화', periods: ['문학 (3-3)', '문학 (3-1)', '교직회의', '문학 (3-2)', '수업준비', '보충학습', '-'] },
    { day: '수', periods: ['수업준비', '문학 (3-3)', '문학 (3-1)', '전문학습', '자율학습', '-', '-'] },
    { day: '목', periods: ['문학 (3-2)', '문학 (3-3)', '문학 (3-1)', '학생상담', '수업준비', '진로활동', '-'] },
    { day: '금', periods: ['문학 (3-2)', '수업준비', '문학 (3-3)', '학년회의', '학급자치', '클럽활동', '-'] },
  ],
  periodTimes: [
    { period: 1, startTime: '09:00', endTime: '09:50' },
    { period: 2, startTime: '10:00', endTime: '10:50' },
    { period: 3, startTime: '11:00', endTime: '11:50' },
    { period: 4, startTime: '12:00', endTime: '12:50' },
    { period: 5, startTime: '13:50', endTime: '14:40' },
    { period: 6, startTime: '14:50', endTime: '15:40' },
    { period: 7, startTime: '15:50', endTime: '16:40' },
  ],
  todos: [
    { id: '1', text: '3학년 2반 수행평가 채점 완료하기', completed: false, createdAt: Date.now() },
    { id: '2', text: '나이스 출결 마감 및 확인', completed: true, createdAt: Date.now() - 3600000 },
    { id: '3', text: '학부모 상담 일지 작성', completed: false, createdAt: Date.now() - 7200000 },
  ],
  theme: 'dark-acrylic',
  opacity: 1.0,
  alwaysOnTop: true,
  snapSide: 'right',
  snapMargin: 0,
  mealSwitchTime: '13:30',
  showAllergies: true,
  showCalories: true,
  widgetWidth: 330,
  fontScale: 1.0,
  autoStartOnLogin: false,
  cornerRadius: 18,
};

const STEP_LABELS = ['학교', '시간표·일정', '꾸미기', '받기'];

export default function App() {
  const [config, setConfig] = useState<WidgetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // 예전 버전에서 저장된 설정에는 나중에 추가된 필드가 없을 수 있으므로 기본값과 병합
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load local config', e);
    }
    return DEFAULT_CONFIG;
  });

  const [step, setStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save local config', e);
    }
  }, [config]);

  // 단계가 바뀌면 맨 위로 올리고, 스크린리더/키보드 사용자가 새 단계 내용부터 읽도록 포커스를 옮김
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    contentRef.current?.focus({ preventScroll: true });
  }, [step]);

  const isLast = step === STEP_LABELS.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',system-ui,sans-serif" }}>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0">
            <School className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">학교 생활 위젯 만들기</h1>
            <p className="text-sm sm:text-base text-slate-600">시간표·급식·D-Day를 바탕화면에서 바로 보세요. 4단계면 끝나요.</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Stepper steps={STEP_LABELS} current={step} onSelect={setStep} />

        <button
          type="button"
          onClick={() => setPreviewOpen((v) => !v)}
          aria-expanded={previewOpen}
          className={`${btnSecondary} lg:hidden w-full`}
        >
          {previewOpen ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
          {previewOpen ? '미리보기 닫기' : '내 위젯 미리보기 보기'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-6 items-start">
          <div ref={contentRef} tabIndex={-1} className="space-y-5 focus:outline-none order-2 lg:order-1">
            {step === 0 && <SchoolStep config={config} onUpdateConfig={setConfig} />}
            {step === 1 && <ScheduleStep config={config} onUpdateConfig={setConfig} />}
            {step === 2 && <StyleStep config={config} onUpdateConfig={setConfig} />}
            {step === 3 && <DownloadStep config={config} onUpdateConfig={setConfig} />}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className={`${btnSecondary} disabled:opacity-40`}
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                이전
              </button>
              {!isLast && (
                <button type="button" onClick={() => setStep((s) => s + 1)} className={btnPrimary}>
                  다음: {STEP_LABELS[step + 1]}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <PreviewPanel
            config={config}
            onUpdateConfig={setConfig}
            open={previewOpen}
            className={`${previewOpen ? 'block' : 'hidden'} lg:block order-1 lg:order-2`}
          />
        </div>
      </main>
    </div>
  );
}
