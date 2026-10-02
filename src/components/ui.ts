// 스튜디오 전체가 같은 모양을 쓰도록 모아둔 공통 클래스 (밝고 깔끔한 업무툴 톤)
const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

export const cardCls = 'bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6';

export const inputCls =
  `w-full min-h-11 px-3.5 py-2 text-base rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 ${focusRing} focus:border-blue-500`;

export const btnPrimary =
  `inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-base font-bold transition-colors ${focusRing}`;

export const btnSecondary =
  `inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-base font-semibold transition-colors ${focusRing}`;

export const iconBtn =
  `inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors ${focusRing}`;

export const sectionTitle = 'text-lg font-bold text-slate-900';
export const mutedText = 'text-sm text-slate-600';
