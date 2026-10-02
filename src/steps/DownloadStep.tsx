import React, { useState } from 'react';
import { Download, ChevronDown, Check, Copy, Settings } from 'lucide-react';
import { WidgetConfig } from '../types';
import { generatePowerShellScript } from '../utils/powerShellGenerator';
import { downloadAllInOneBat, downloadPS1, copyScriptToClipboard } from '../utils/download';
import { cardCls, btnPrimary, btnSecondary, sectionTitle, mutedText } from '../components/ui';

interface StepProps {
  config: WidgetConfig;
  onUpdateConfig: (newConfig: WidgetConfig) => void;
}

const INSTALL_STEPS = [
  { title: '위젯 받기', body: '아래 파란 버튼을 눌러 파일을 내려받아요.' },
  { title: '파일 더블클릭', body: "내려받은 'NEWSchoolWidget_원클릭_실행' 파일을 두 번 클릭하면 위젯이 바로 떠요." },
  { title: '끝!', body: '바탕화면에 "학교 생활 위젯" 바로가기도 자동으로 만들어져요. 다음부터는 그걸로 켜세요. 설정을 바꾸고 싶을 땐 위젯의 ⚙ 버튼이면 돼요.' },
];

const FAQS = [
  {
    q: '"Windows의 PC 보호" 또는 "실행할 수 없는 앱"이라고 떠요',
    a: '처음 한 번만 나오는 Windows 안내예요. 창에서 "추가 정보"를 누르면 "실행" 버튼이 나타나는데, 그걸 누르시면 돼요. 이 파일은 직접 만든 개인용 프로그램이라 Windows가 처음 보는 파일로 취급해서 그래요.',
  },
  {
    q: '급식 칸에 "등록된 급식 정보가 없습니다"라고 나와요',
    a: '그날 급식이 없는 날(주말·방학·행사일 등)이거나 학교가 나이스에 아직 식단을 올리지 않은 경우예요. 학교를 잘못 골랐다면 1단계에서 다시 선택해 주세요.',
  },
  {
    q: '위젯을 끄거나 다시 켜고 싶어요',
    a: '위젯 오른쪽 위의 ✕ 버튼을 누르면 꺼져요. 다시 켜려면 바탕화면의 "학교 생활 위젯" 바로가기를 더블클릭하세요.',
  },
];

export const DownloadStep: React.FC<StepProps> = ({ config, onUpdateConfig }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleDownload = () => {
    downloadAllInOneBat(config);
    setDownloaded(true);
  };

  const handleCopy = async () => {
    try {
      await copyScriptToClipboard(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className={cardCls}>
        <h2 className={sectionTitle}>다 됐어요! 위젯을 받아 보세요</h2>
        <p className={`${mutedText} mt-1`}>설치 프로그램이 따로 없어요. 파일 하나만 실행하면 끝나요.</p>

        <ol className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INSTALL_STEPS.map((s, i) => (
            <li key={s.title} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="text-base font-bold text-slate-900">{s.title}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{s.body}</p>
            </li>
          ))}
        </ol>

        <label className="mt-6 flex items-center gap-3 min-h-11 cursor-pointer text-base text-slate-800">
          <input
            type="checkbox"
            checked={config.autoStartOnLogin}
            onChange={(e) => onUpdateConfig({ ...config, autoStartOnLogin: e.target.checked })}
            className="w-5 h-5 rounded accent-blue-600"
          />
          <span>컴퓨터를 켤 때마다 위젯이 자동으로 뜨게 하기</span>
        </label>

        <button type="button" onClick={handleDownload} className={`${btnPrimary} mt-4 w-full sm:w-auto text-lg py-3`}>
          <Download className="w-6 h-6" aria-hidden="true" />
          <span>위젯 받기</span>
        </button>

        {downloaded && (
          <p role="status" className="mt-3 flex items-start gap-2 text-base text-emerald-700">
            <Check className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              파일을 내려받았어요. 다운로드 폴더의 'NEWSchoolWidget_원클릭_실행' 파일을 더블클릭하세요.
            </span>
          </p>
        )}

        <div
          role="note"
          className="mt-6 flex items-start gap-4 p-5 rounded-2xl border-2 border-amber-400 bg-amber-50"
        >
          <span
            className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400 text-slate-900 shrink-0"
            aria-hidden="true"
          >
            <Settings className="w-8 h-8" />
          </span>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-extrabold text-slate-900">
              나중에 바꾸고 싶을 땐, 이 사이트에 다시 올 필요가 없어요!
            </p>
            <p className="mt-1 text-base sm:text-lg font-semibold text-slate-800">
              학교·시간표·색은 위젯 위쪽의{' '}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-amber-400 text-slate-900 font-bold whitespace-nowrap">
                <Settings className="w-4 h-4" aria-hidden="true" /> 설정(⚙)
              </span>{' '}
              버튼에서 바로 바꿀 수 있어요.
            </p>
          </div>
        </div>
      </section>

      <section className={cardCls}>
        <h3 className={sectionTitle}>혹시 이런 일이 생기면</h3>
        <div className="mt-3 divide-y divide-slate-200">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-3">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-base font-semibold text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                {f.q}
                <ChevronDown className="w-5 h-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-2 text-base text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <details className="group px-1">
        <summary className="cursor-pointer list-none text-sm text-slate-500 hover:text-slate-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 inline-flex items-center gap-1">
          고급 (프로그래밍을 아시는 분용)
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <p className={mutedText}>위젯은 PowerShell 스크립트로 만들어져요. 직접 확인하거나 다른 방식으로 실행하고 싶을 때 쓰세요.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => downloadPS1(config)} className={btnSecondary}>
              스크립트 파일(.ps1) 받기
            </button>
            <button type="button" onClick={handleCopy} className={btnSecondary}>
              <Copy className="w-4 h-4" aria-hidden="true" />
              {copied ? '복사됨!' : '스크립트 복사'}
            </button>
            <button type="button" onClick={() => setShowCode((v) => !v)} aria-expanded={showCode} className={btnSecondary}>
              {showCode ? '코드 숨기기' : '코드 보기'}
            </button>
          </div>
          {showCode && (
            <pre className="max-h-96 overflow-auto p-4 rounded-xl bg-slate-900 text-slate-100 text-xs leading-relaxed">
              <code>{generatePowerShellScript(config)}</code>
            </pre>
          )}
        </div>
      </details>
    </div>
  );
};
