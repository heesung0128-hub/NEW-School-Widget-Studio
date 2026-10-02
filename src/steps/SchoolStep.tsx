import React, { useState } from 'react';
import { Search, Utensils, CheckCircle2 } from 'lucide-react';
import { SchoolInfo, WidgetConfig } from '../types';
import { searchSchools } from '../utils/neisApi';
import { cardCls, inputCls, btnPrimary, sectionTitle, mutedText } from '../components/ui';

interface StepProps {
  config: WidgetConfig;
  onUpdateConfig: (newConfig: WidgetConfig) => void;
}

export const SchoolStep: React.FC<StepProps> = ({ config, onUpdateConfig }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SchoolInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setIsSearching(true);
    setMessage('');
    try {
      const found = await searchSchools(keyword.trim());
      setResults(found);
      if (found.length === 0) setMessage('일치하는 학교를 찾을 수 없어요. 학교 이름을 다시 확인해 주세요.');
    } catch {
      setMessage('학교를 검색하는 중 문제가 생겼어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSchool = (school: SchoolInfo) => {
    onUpdateConfig({ ...config, school });
    setResults([]);
    setKeyword('');
  };

  return (
    <div className="space-y-5">
      <section className={cardCls}>
        <h2 className={sectionTitle}>근무하시는 학교를 찾아주세요</h2>
        <p className={`${mutedText} mt-1`}>학교를 고르면 오늘의 급식이 위젯에 자동으로 나와요.</p>

        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-sm text-slate-600">지금 선택된 학교</div>
            <div className="text-lg font-bold text-slate-900">{config.school.schoolName}</div>
            <div className="text-sm text-slate-600">{config.school.officeName}</div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-5">
          <label htmlFor="neis-school-search" className="block text-base font-semibold text-slate-800 mb-2">
            다른 학교로 바꾸려면 학교 이름을 검색하세요
          </label>
          <div className="flex gap-2">
            <input
              id="neis-school-search"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예: 서울고등학교"
              className={inputCls}
            />
            <button type="submit" disabled={isSearching} className={`${btnPrimary} shrink-0`}>
              <Search className="w-5 h-5" aria-hidden="true" />
              <span>{isSearching ? '찾는 중…' : '검색'}</span>
            </button>
          </div>
        </form>

        {message && <p role="status" className="mt-3 text-base text-amber-700">{message}</p>}

        {results.length > 0 && (
          <ul className="mt-4 space-y-2 max-h-72 overflow-y-auto">
            {results.map((school) => (
              <li key={school.schoolCode}>
                <button
                  type="button"
                  onClick={() => selectSchool(school)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="text-base font-bold text-slate-900">{school.schoolName}</div>
                  <div className="text-sm text-slate-600">
                    {school.officeName} · {school.location || '위치 정보 없음'}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardCls}>
        <h3 className={`${sectionTitle} flex items-center gap-2`}>
          <Utensils className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          급식 표시
        </h3>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="meal-switch-time" className="block text-base font-semibold text-slate-800 mb-1">
              몇 시부터 내일 급식을 보여줄까요?
            </label>
            <input
              id="meal-switch-time"
              type="time"
              value={config.mealSwitchTime}
              onChange={(e) => onUpdateConfig({ ...config, mealSwitchTime: e.target.value })}
              className={`${inputCls} max-w-44`}
            />
            <p className={`${mutedText} mt-1`}>이 시간이 지나면 '내일의 급식'이 나와요. (금요일에는 월요일 급식)</p>
          </div>

          <label className="flex items-center gap-3 min-h-11 cursor-pointer text-base text-slate-800">
            <input
              type="checkbox"
              checked={config.showAllergies}
              onChange={(e) => onUpdateConfig({ ...config, showAllergies: e.target.checked })}
              className="w-5 h-5 rounded accent-blue-600"
            />
            <span>알레르기 유발물질 번호도 보여주기</span>
          </label>

          <label className="flex items-center gap-3 min-h-11 cursor-pointer text-base text-slate-800">
            <input
              type="checkbox"
              checked={config.showCalories}
              onChange={(e) => onUpdateConfig({ ...config, showCalories: e.target.checked })}
              className="w-5 h-5 rounded accent-blue-600"
            />
            <span>열량(Kcal)도 보여주기</span>
          </label>
        </div>
      </section>
    </div>
  );
};
