import React, { useState, useEffect } from 'react';
import { WidgetConfig } from './types';
import { DEFAULT_SCHOOL } from './utils/neisApi';
import { DesktopSimulator, SchoolWidgetCard } from './components/Widget';
import { ConfigPanel } from './components/ConfigPanel';
import {
  Monitor,
  Sliders,
  Terminal,
  BookOpen,
  Download,
  Sparkles,
  School,
  Calendar,
  Clock,
  Utensils,
  CheckSquare,
  Copy,
  Check,
  Play,
  FileCode,
  ShieldCheck,
  FolderOpen,
  AlertTriangle,
  HelpCircle,
  X,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Zap,
  Power,
  MousePointerClick
} from 'lucide-react';
import { generatePowerShellScript, generateAllInOneBat } from './utils/powerShellGenerator';

const STORAGE_KEY = 'school_widget_config_v1';
const ONBOARDING_DISMISSED_KEY = 'school_widget_onboarding_dismissed_v1';

// ---------------------------------------------------------------------------
// 다운로드/복사 로직 — 헤더의 빠른 실행 버튼과 "코드" 탭의 CodeViewer가 동일하게 재사용.
// ---------------------------------------------------------------------------
function triggerFileDownload(content: string | (string | Uint8Array)[], filename: string) {
  const parts = Array.isArray(content) ? content : [content];
  const blob = new Blob(parts, { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPS1(config: WidgetConfig) {
  // UTF-8 with BOM to ensure Korean text doesn't break in legacy Windows PowerShell 5.1
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  triggerFileDownload([bom, generatePowerShellScript(config)], 'NEWSchoolWidget.ps1');
}

function downloadAllInOneBat(config: WidgetConfig) {
  // IMPORTANT: DO NOT add BOM to .bat files as cmd.exe cannot parse BOM!
  triggerFileDownload(generateAllInOneBat(config), 'NEWSchoolWidget_원클릭_실행.bat');
}

async function copyScriptToClipboard(config: WidgetConfig) {
  await navigator.clipboard.writeText(generatePowerShellScript(config));
}

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
  userRole: 'teacher',
  fontScale: 1.0,
  autoStartOnLogin: false,
  cornerRadius: 18,
};

// ---------------------------------------------------------------------------
// Guide tab content (초보자 실행 가이드) — static, single-consumer, so it lives
// inline here instead of its own file.
// ---------------------------------------------------------------------------
const GuideSection: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Intro Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-base mb-1">
          <Sparkles className="w-4 h-4" />
          <span>코딩을 몰라도 1분 만에 따라하는 윈도우 위젯 실행 가이드</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          별도의 프로그램 설치 없이, 윈도우에 기본 내장된 <strong>PowerShell</strong>을 이용하여 안전하고 깔끔하게 바탕화면 위젯을 띄울 수 있습니다.
        </p>
      </div>

      {/* 4 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                1
              </span>
              <h4 className="text-base font-bold text-white">위젯 바로 실행</h4>
            </div>
            <span className="text-[13px] text-emerald-400 font-medium">실행 방법</span>
          </div>

          <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">방법 A (추천).</span>
              <span><strong>[올인원 .bat 다운로드]</strong>로 받은 <code>NEWSchoolWidget_원클릭_실행.bat</code> 파일을 더블 클릭합니다. (.ps1 파일 없이 단독 실행 가능!)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">방법 B.</span>
              <span><strong>[.ps1 다운로드]</strong>로 받은 <code>NEWSchoolWidget.ps1</code> 파일을 <strong>마우스 우클릭</strong> ➔ <strong>[PowerShell에서 실행]</strong> 클릭!</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-[13px] text-amber-300 space-y-1">
            <div className="font-semibold flex items-center gap-1 text-amber-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>'Windows의 PC 보호' 또는 '실행할 수 없는 앱' 창이 뜨나요?</span>
            </div>
            <div>
              인터넷에서 다운받은 배치 파일에 대한 윈도우 보안 알림입니다. 파란 창에서 <strong>[추가 정보]</strong> 링크를 누른 후 <strong>[실행]</strong> 버튼을 누르시면 정상 실행됩니다.
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[13px] text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>실행 즉시 모니터 상단, 스튜디오에서 설정하신 좌/우 위치에 투명 아크릴 위젯이 깔끔하게 부착됩니다!</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                2
              </span>
              <h4 className="text-base font-bold text-white">스크립트 실행 권한 허용 (최초 1회)</h4>
            </div>
            <span className="text-[13px] text-amber-400 font-medium">필수 설정</span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            윈도우 기본 보안으로 인해 스크립트 실행이 차단되어 있을 수 있습니다. 아래 명령어로 본인 계정의 스크립트 실행을 1회 허용해 줍니다.
          </p>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[13px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold">💡 먼저 PowerShell 창부터 엽니다:</div>
            <div>1. 키보드에서 <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono">Win + R</kbd> 키를 누릅니다.</div>
            <div>2. 실행 창에 <code className="text-blue-400">powershell</code> 을 입력하고 Enter를 누르면 파란색 파워쉘 창이 열립니다.</div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px] text-slate-400">
              <span>열린 PowerShell 창에 붙여넣을 명령어:</span>
              <button
                type="button"
                onClick={() => copyText('Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force', 1)}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 1 ? '복사됨' : '명령어 복사'}</span>
              </button>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-[13px] text-emerald-400 border border-slate-800 select-all overflow-x-auto">
              Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                3
              </span>
              <h4 className="text-base font-bold text-white">스크립트 파일 다운로드</h4>
            </div>
            <span className="text-[13px] text-blue-400 font-medium">초간단</span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            상단의 <strong>[.ps1 다운로드]</strong> 버튼을 눌러 <code>NEWSchoolWidget.ps1</code> 파일을 원하는 폴더(예: 바탕화면이나 내 문서)에 저장합니다.
          </p>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[13px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold">💡 직접 복사해서 저장하는 경우:</div>
            <div>1. 메모장을 엽니다.</div>
            <div>2. [전체 코드 복사] 버튼을 눌러 붙여넣기합니다.</div>
            <div>3. 저장할 때 파일 형식을 <strong>'모든 파일(*.*)'</strong>, 파일 이름을 <strong>'NEWSchoolWidget.ps1'</strong>, 인코딩을 <strong>'UTF-8'</strong>로 저장하세요.</div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                4
              </span>
              <h4 className="text-base font-bold text-white">컴퓨터 켤 때 자동 실행 (시작프로그램)</h4>
            </div>
            <span className="text-[13px] text-purple-400 font-medium">편리한 팁</span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            컴퓨터를 켤 때마다 자동으로 위젯이 뜨게 하려면 윈도우 시작프로그램 폴더에 바로가기를 넣어두면 됩니다.
          </p>

          <ol className="text-[13px] text-slate-300 space-y-1 list-decimal list-inside bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <li>키보드에서 <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono">Win + R</kbd> 키를 누릅니다.</li>
            <li>실행 창에 <code className="text-blue-400">shell:startup</code> 입력 후 확인을 누릅니다.</li>
            <li>열린 폴더에 <code>NEWSchoolWidget_원클릭_실행.bat</code> 파일 또는 바로가기를 복사해 넣으면 끝!</li>
          </ol>
        </div>
      </div>

      {/* FAQ & Troubleshooting Accordion */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>자주 묻는 질문 & 문제 해결 (FAQ)</span>
        </h4>

        <div className="space-y-3 text-sm text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-amber-500/30">
            <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5 text-base">
              <span>⚠️ Q. .ps1 파일을 마우스 우클릭해서 실행했는데 아무것도 안 뜨거나 깜빡이고 닫혀요.</span>
            </div>
            <div className="text-slate-300 leading-relaxed space-y-2 text-sm">
              <p>
                윈도우의 기본 보안 정책(<code>ExecutionPolicy Restricted</code>) 때문에 파워쉘 스크립트 실행이 차단되어 창이 0.1초 만에 닫히는 현상입니다.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-700/60 space-y-2 text-[13px]">
                <div>
                  <strong className="text-emerald-300">방법 1 (가장 추천): [올인원 .bat 다운로드]</strong><br />
                  상단의 <strong>[올인원 .bat 다운로드]</strong> 버튼으로 <code>NEWSchoolWidget_원클릭_실행.bat</code>을 받아 더블 클릭하세요. 윈도우 보안 정책을 자동으로 우회(Bypass)하여 즉시 위젯이 실행됩니다.
                </div>
                <div>
                  <strong className="text-blue-300">방법 2: PowerShell 창에서 1줄 명령어로 실행</strong><br />
                  키보드 <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono">Win + R</kbd> ➔ <code className="text-blue-300">powershell</code> 입력 후 아래 명령어를 복사해 붙여넣고 엔터를 치면 즉시 켜집니다:
                  <div className="mt-1 p-2 rounded bg-slate-900 font-mono text-[12px] text-blue-200 border border-slate-800 select-all break-all">
                    powershell -ExecutionPolicy Bypass -Sta -WindowStyle Hidden -File "$HOME\Downloads\NEWSchoolWidget.ps1"
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <span>⚠️ Q. .bat 파일 실행 시 '실행할 수 없는 앱' 또는 'Windows의 PC 보호'라고 떠요.</span>
            </div>
            <div className="text-slate-300 leading-relaxed space-y-1.5">
              <p>
                웹 브라우저에서 다운로드한 <code>.bat</code> 파일에 대해 윈도우 SmartScreen이 띄우는 기본 안내입니다:
              </p>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-700/60 space-y-1 text-[13px]">
                <div><strong>1. 파란색 경고 창에서:</strong> [추가 정보] 텍스트를 클릭한 뒤, 활성화되는 <strong>[실행]</strong> 버튼을 누릅니다.</div>
                <div><strong>2. 파일 속성에서 영구 차단 해제:</strong> <code>NEWSchoolWidget_원클릭_실행.bat</code> 파일 마우스 우클릭 ➔ <strong>[속성]</strong> ➔ 맨 아래 <strong>[차단 해제(Unblock)]</strong> 체크박스 체크 후 <strong>[확인]</strong> 클릭!</div>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-blue-300 mb-1">Q. 한글(학교명, 급식 메뉴 등)이 깨져서 나와요.</div>
            <p className="text-slate-400 leading-relaxed">
              본 사이트에서 <strong>[.ps1 다운로드]</strong>를 이용하시면 UTF-8 with BOM 형식으로 자동 저장되므로 한글 깨짐이 완벽히 방지됩니다. 직접 메모장으로 저장하실 때도 인코딩 형식을 꼭 <strong>UTF-8</strong>로 지정해 주세요.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-blue-300 mb-1">Q. 급식 정보가 "등록된 급식 정보가 없습니다"로 나와요.</div>
            <p className="text-slate-400 leading-relaxed">
              주말, 공휴일, 방학 기간이거나 학교에서 아직 나이스에 식단을 등록하지 않은 경우입니다. 평일 학기 중에는 정상적으로 식단과 영양/칼로리 정보가 자동 갱신됩니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-blue-300 mb-1">Q. 할 일(TO-DO)을 입력하면 어디에 저장되나요?</div>
            <p className="text-slate-400 leading-relaxed">
              위젯에서 등록하거나 체크한 할 일은 본인 컴퓨터의 <code>내 문서\NEWSchoolWidget\todos.json</code> 파일에 안전하게 자동 저장되므로, 컴퓨터를 껐다 켜도 내용이 그대로 유지됩니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-blue-300 mb-1">Q. 작업표시줄/작업관리자에 "Windows PowerShell"이라고 뜨던 게 왜 없어졌나요?</div>
            <p className="text-slate-400 leading-relaxed">
              최초 실행 시에는 지금까지처럼 PowerShell을 통해 위젯이 즉시 뜨지만, 그 순간 뒤에서 자동으로 이 설정 그대로 컴파일된 나만의 전용 실행 파일(<code>%LOCALAPPDATA%\NEWSchoolWidget\NEWSchoolWidget.exe</code>)을 만들어 둡니다.
              <strong className="text-slate-300"> 두 번째 실행부터는 그 전용 실행 파일로 바로 켜지기 때문에</strong> 작업표시줄/작업관리자에 "학교 생활 위젯"이라는 고유 이름과 아이콘으로 표시되고, PowerShell 보안 경고도 더 이상 거치지 않습니다. (최초 1회 컴파일 시 인터넷 연결이 필요하며, 스튜디오에서 설정을 바꿔 새로 다운로드하면 다음 실행 때 자동으로 다시 컴파일됩니다.)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-blue-300 mb-1">Q. 컴퓨터를 켤 때마다 자동으로 위젯이 뜨게 하려면요?</div>
            <p className="text-slate-400 leading-relaxed">
              예전처럼 <code>shell:startup</code> 폴더에 직접 파일을 넣지 않아도 됩니다. <strong>[위젯 커스텀 설정] → [디자인 & 스냅]</strong> 탭의 <strong>"컴퓨터 시작 시 자동 실행"</strong> 체크박스를 켜고 위젯을 한 번 실행하면, 다음 로그인부터 자동으로 켜지도록 위젯이 스스로 등록합니다. 끄고 싶으면 체크박스를 해제하고 다시 한 번 실행하면 자동으로 해제됩니다.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-blue-300 mb-1">Q. 위젯을 종료하거나 다시 켜고 싶어요.</div>
            <p className="text-slate-400 leading-relaxed">
              위젯 오른쪽 상단의 <strong>[✕]</strong> 닫기 버튼을 누르면 언제든지 깔끔하게 종료됩니다. 다시 켤 때는 스크립트 또는 .bat 파일을 다시 실행하시면 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Code tab content (파워쉘 .ps1 코드) — single-consumer, so it lives inline here
// instead of its own file.
// ---------------------------------------------------------------------------
interface CodeViewerProps {
  config: WidgetConfig;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ config }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState<boolean>(false);
  const scriptContent = generatePowerShellScript(config);

  const handleCopyCode = async () => {
    try {
      await copyScriptToClipboard(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  const handleDownloadPS1 = () => downloadPS1(config);
  const handleDownloadBAT = () => downloadAllInOneBat(config);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative">
      {/* Code Header Bar */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">NEWSchoolWidget.ps1 (파워쉘 완성형 코드)</h3>
            <p className="text-[12px] text-slate-400">설정하신 학교 정보와 시간표가 스크립트에 자동 반영되었습니다.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '복사 완료!' : '전체 코드 복사'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPS1}
            className="px-3 py-1.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.ps1 다운로드</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBAT}
            className="px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors"
            title="별도 파일 없이 더블 클릭으로 바로 켜지는 올인원 배치 파일"
          >
            <Play className="w-3.5 h-3.5" />
            <span>올인원 .bat 다운로드</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTroubleshoot(true)}
            className="px-2.5 py-1.5 rounded-xl text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
            title="실행 에러 / SmartScreen 해결법"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>실행 문제 해결</span>
          </button>
        </div>
      </div>

      {/* Standalone Notice Banner */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            <strong>[올인원 .bat]</strong>은 별도 .ps1 파일 없이 <strong>이 파일 하나만 다운받아 더블 클릭</strong>하면 즉시 실행됩니다.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowTroubleshoot(true)}
          className="text-[13px] text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0 ml-2"
        >
          '실행할 수 없는 앱' 알림이 뜨나요?
        </button>
      </div>

      {/* Code Text Body */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-slate-300 bg-slate-950/60 leading-relaxed">
        <pre className="select-text whitespace-pre-wrap break-all">
          {scriptContent}
        </pre>
      </div>

      {/* Code Footer info */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[13px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>WPF XAML Native 렌더링 • 듀얼 모니터 {config.snapSide === 'left' ? '좌측' : '우측'} 상단 자동 스냅 내장</span>
        </div>
        <span className="text-slate-500">인코딩: UTF-8 with BOM (한글 깨짐 방지 완벽)</span>
      </div>

      {/* Troubleshooting Modal */}
      {showTroubleshoot && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90%] overflow-y-auto shadow-2xl p-5 text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>윈도우에서 실행할 수 없다고 뜰 때 해결법</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTroubleshoot(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-300">
              {/* Solution 1: SmartScreen */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-2">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px]">1</span>
                  <span>'Windows의 PC 보호' (SmartScreen) 파란 창이 뜰 때</span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-6">
                  인터넷에서 다운로드한 배치 파일에 윈도우가 띄우는 기본 안내입니다. 바이러스가 아니므로 안심하셔도 됩니다:
                </p>
                <div className="ml-6 p-2 rounded-lg bg-blue-950/40 border border-blue-500/20 text-slate-200 font-medium space-y-1">
                  <div>👉 파란색 경고 창에서 <strong>[추가 정보]</strong> 링크를 클릭합니다.</div>
                  <div>👉 아래에 나타나는 <strong>[실행]</strong> 버튼을 누르면 위젯이 즉시 켜집니다!</div>
                </div>
              </div>

              {/* Solution 2: File Properties Unblock */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[12px]">2</span>
                  <span>파일 속성에서 '차단 해제'하기 (가장 깔끔한 방법)</span>
                </div>
                <ol className="ml-6 list-decimal list-inside space-y-1 text-slate-300">
                  <li>다운로드한 <code>NEWSchoolWidget_원클릭_실행.bat</code> 파일을 <strong>마우스 우클릭 ➔ [속성]</strong>을 클릭합니다.</li>
                  <li>창 맨 아래 보안 항목의 <strong>[차단 해제(Unblock)]</strong> 체크박스에 체크합니다.</li>
                  <li><strong>[적용]</strong> 및 <strong>[확인]</strong>을 누른 뒤 더블 클릭하면 다음부터 경고 없이 바로 실행됩니다.</li>
                </ol>
              </div>

              {/* Solution 3: ExecutionPolicy in PowerShell */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-2">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[12px]">3</span>
                  <span>.ps1 파일로 우클릭 실행하기 (대체 방법)</span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-6">
                  배치 파일 대신 <strong>[.ps1 다운로드]</strong>로 받은 <code>NEWSchoolWidget.ps1</code> 파일을 <strong>마우스 우클릭 ➔ [PowerShell에서 실행]</strong>을 누르면 스크립트가 실행됩니다.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTroubleshoot(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [config, setConfig] = useState<WidgetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // 예전 버전에서 저장된 설정에는 이번에 추가된 필드(자동 시작/강조색/모서리 반경 등)가 없을
      // 수 있으므로 기본값과 병합해서 undefined 필드가 생기지 않도록 함
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load local config', e);
    }
    return DEFAULT_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'simulator' | 'config' | 'code' | 'guide'>('simulator');
  const [quickCopied, setQuickCopied] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_DISMISSED_KEY) !== '1';
    } catch (e) {
      return true;
    }
  });

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1');
    } catch (e) {
      // localStorage unavailable — dismissal just won't persist across reloads
    }
  };

  // Save config on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save local config', e);
    }
  }, [config]);

  const handleDownloadPS1 = () => downloadPS1(config);
  const handleDownloadBAT = () => downloadAllInOneBat(config);

  const handleQuickCopy = async () => {
    await copyScriptToClipboard(config);
    setQuickCopied(true);
    setTimeout(() => setQuickCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  학교 생활 윈도우 위젯 스튜디오
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[13px] font-semibold">
                  PowerShell + WPF
                </span>
              </div>
              <p className="text-sm text-slate-400">
                바탕화면 {config.snapSide === 'left' ? '좌측' : '우측'} 상단 자동 스냅 • 나이스 실시간 급식(13:30 전환) • 시간표 • D-Day • 할 일 관리
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickCopy}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
                quickCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{quickCopied ? '복사됨!' : '스크립트 복사'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPS1}
              className="px-3.5 py-1.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.ps1 다운로드</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadBAT}
              className="hidden sm:flex px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white items-center gap-1.5 transition-all"
              title="검은 콘솔창 없이 즉시 띄우는 배치파일"
            >
              <Play className="w-3.5 h-3.5" />
              <span>원클릭 실행용 .bat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>바탕화면 시뮬레이터</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all shrink-0 ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>위젯 커스텀 설정</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all shrink-0 ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>파워쉘 (.ps1) 코드</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all shrink-0 ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>초보자 실행 가이드</span>
          </button>
        </div>

        {/* First-visit onboarding banner */}
        {showOnboarding && (
          <div className="relative p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30">
            <button
              type="button"
              onClick={dismissOnboarding}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-3">
              <Sparkles className="w-4 h-4" />
              <span>처음이신가요? 3단계면 끝나요</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-6">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 shrink-0 rounded-full bg-blue-600 text-white font-bold text-[12px] flex items-center justify-center mt-0.5">1</span>
                <p className="text-sm text-slate-300"><strong className="text-white">설정</strong> 탭에서 학교·시간표를 등록하세요.</p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 mt-1.5 hidden sm:block" />
                <span className="w-5 h-5 shrink-0 rounded-full bg-blue-600 text-white font-bold text-[12px] flex items-center justify-center mt-0.5 sm:hidden">2</span>
                <span className="w-5 h-5 shrink-0 rounded-full bg-blue-600 text-white font-bold text-[12px] hidden sm:flex items-center justify-center mt-0.5">2</span>
                <p className="text-sm text-slate-300">우측 상단 <strong className="text-white">원클릭 실행용 .bat</strong>을 다운로드하세요.</p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 mt-1.5 hidden sm:block" />
                <span className="w-5 h-5 shrink-0 rounded-full bg-blue-600 text-white font-bold text-[12px] flex items-center justify-center mt-0.5">3</span>
                <p className="text-sm text-slate-300">더블클릭! 최초 1회만 전용 실행 파일이 자동 생성되고, 다음부터는 PowerShell 없이 바로 실행됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Simulator View */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Desktop Canvas (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <DesktopSimulator
                config={config}
                onUpdateConfig={setConfig}
              />
            </div>

            {/* Quick Config & Widget Inspector (1 col) */}
            <div className="space-y-4">
              {/* Quick Info Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>위젯 핵심 동작 특성</span>
                </h3>

                <ul className="text-sm text-slate-300 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>마우스 드래그 & 자동 스냅:</strong> 위젯을 자유롭게 끌다가 손을 놓으면 현재 모니터 {config.snapSide === 'left' ? '좌측' : '우측'} 상단으로 부드럽게 붙습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>13:30 급식 자동 전환:</strong> 오후 1시 30분 이전에는 '오늘의 급식', 1시 30분 이후에는 자동으로 '내일의 급식'으로 전환됩니다. (금요일 오후엔 월요일 급식)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>동적 높이 조절:</strong> 할 일을 추가하거나 삭제하면 위젯 길이가 내용에 맞춰 자연스럽게 늘어나고 줄어듭니다.</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('config')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-colors"
                  >
                    학교 및 시간표 변경하기 ➔
                  </button>
                </div>
              </div>

              {/* Side Config Mini Panel */}
              <ConfigPanel
                config={config}
                onUpdateConfig={setConfig}
                compact
              />
            </div>
          </div>
        )}

        {/* Tab 2: Config View */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ConfigPanel
                config={config}
                onUpdateConfig={setConfig}
              />
            </div>

            {/* Live Preview of the widget */}
            <div className="flex flex-col items-center justify-start space-y-3">
              <div className="text-sm font-bold text-slate-400">위젯 실시간 미리보기</div>
              <SchoolWidgetCard
                config={config}
                onUpdateConfig={setConfig}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Code View */}
        {activeTab === 'code' && (
          <div className="h-[700px]">
            <CodeViewer config={config} />
          </div>
        )}

        {/* Tab 4: Guide View */}
        {activeTab === 'guide' && (
          <GuideSection />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-sm text-slate-500">
        <p>
          학교 생활 윈도우 위젯 • 나이스(NEIS) Open API 연동 • WPF XAML & PowerShell Script Generator
        </p>
      </footer>
    </div>
  );
}
