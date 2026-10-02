import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { DDayItem, TimetableDay, WidgetConfig } from '../types';
import { cardCls, inputCls, btnPrimary, btnSecondary, iconBtn, sectionTitle, mutedText } from '../components/ui';

interface StepProps {
  config: WidgetConfig;
  onUpdateConfig: (newConfig: WidgetConfig) => void;
}

type Preset = 'high-teacher' | 'middle-teacher' | 'elem-student';

const PRESETS: { id: Preset; label: string; table: TimetableDay[] }[] = [
  {
    id: 'high-teacher',
    label: '고등학교 교사',
    table: [
      { day: '월', periods: ['문학 (3-1)', '문학 (3-2)', '상담', '수업준비', '진로지도', '동아리', '종례'] },
      { day: '화', periods: ['문학 (3-3)', '문학 (3-1)', '교직회의', '문학 (3-2)', '수업준비', '보충학습', '-'] },
      { day: '수', periods: ['수업준비', '문학 (3-3)', '문학 (3-1)', '전문학습', '자율학습', '-', '-'] },
      { day: '목', periods: ['문학 (3-2)', '문학 (3-3)', '문학 (3-1)', '학생상담', '수업준비', '진로활동', '-'] },
      { day: '금', periods: ['문학 (3-2)', '수업준비', '문학 (3-3)', '학년회의', '학급자치', '클럽활동', '-'] },
    ],
  },
  {
    id: 'middle-teacher',
    label: '중학교 교사',
    table: [
      { day: '월', periods: ['국어 (2-1)', '국어 (2-2)', '자유학기', '수업준비', '국어 (2-3)', '동아리', '-'] },
      { day: '화', periods: ['수업준비', '국어 (2-1)', '교직회의', '국어 (2-2)', '국어 (2-3)', '진로상담', '-'] },
      { day: '수', periods: ['국어 (2-2)', '국어 (2-3)', '전문적학습', '국어 (2-1)', '자율활동', '-', '-'] },
      { day: '목', periods: ['국어 (2-3)', '수업준비', '국어 (2-1)', '국어 (2-2)', '학생상담', '체육대회', '-'] },
      { day: '금', periods: ['국어 (2-1)', '국어 (2-2)', '수업준비', '국어 (2-3)', '학급회의', '창의체험', '-'] },
    ],
  },
  {
    id: 'elem-student',
    label: '초·중 학생',
    table: [
      { day: '월', periods: ['국어', '수학', '사회', '과학', '체육', '음악', '-'] },
      { day: '화', periods: ['수학', '영어', '국어', '도덕', '미술', '미술', '-'] },
      { day: '수', periods: ['과학', '국어', '체육', '영어', '수학', '-', '-'] },
      { day: '목', periods: ['사회', '수학', '국어', '실과', '실과', '체육', '-'] },
      { day: '금', periods: ['영어', '국어', '수학', '음악', '창체', '동아리', '-'] },
    ],
  },
];

export const ScheduleStep: React.FC<StepProps> = ({ config, onUpdateConfig }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const changePeriod = (day: '월' | '화' | '수' | '목' | '금', index: number, value: string) => {
    const timetable = config.timetable.map((t) => {
      if (t.day !== day) return t;
      const periods = [...t.periods];
      periods[index] = value;
      return { ...t, periods };
    });
    onUpdateConfig({ ...config, timetable });
  };

  const addDDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const item: DDayItem = { id: Date.now().toString(), title: title.trim(), targetDate: date };
    onUpdateConfig({ ...config, ddays: [...config.ddays, item] });
    setTitle('');
    setDate('');
  };

  const removeDDay = (id: string) =>
    onUpdateConfig({ ...config, ddays: config.ddays.filter((d) => d.id !== id) });

  const moveDDay = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= config.ddays.length) return;
    const ddays = [...config.ddays];
    [ddays[index], ddays[target]] = [ddays[target], ddays[index]];
    onUpdateConfig({ ...config, ddays });
  };

  return (
    <div className="space-y-5">
      <section className={cardCls}>
        <h2 className={sectionTitle}>시간표를 채워주세요</h2>
        <p className={`${mutedText} mt-1`}>비슷한 예시를 먼저 불러온 다음, 내 수업에 맞게 고치면 편해요.</p>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="시간표 예시 불러오기">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onUpdateConfig({ ...config, timetable: p.table })}
              className={btnSecondary}
            >
              {p.label} 예시 불러오기
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-1">
            <caption className="sr-only">요일별 시간표 입력</caption>
            <thead>
              <tr>
                <th scope="col" className="w-12" />
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <th key={n} scope="col" className="text-sm font-semibold text-slate-600 pb-1">
                    {n}교시
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['월', '화', '수', '목', '금'] as const).map((day) => {
                const row = config.timetable.find((t) => t.day === day) || {
                  day,
                  periods: ['', '', '', '', '', '', ''],
                };
                return (
                  <tr key={day}>
                    <th scope="row" className="text-base font-bold text-blue-700 text-center">
                      {day}
                    </th>
                    {row.periods.map((subject, i) => (
                      <td key={i}>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => changePeriod(day, i, e.target.value)}
                          placeholder="-"
                          aria-label={`${day}요일 ${i + 1}교시`}
                          className="w-full min-h-11 px-1.5 text-sm text-center rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={cardCls}>
        <h2 className={sectionTitle}>D-Day (시험, 방학 등)</h2>
        <p className={`${mutedText} mt-1`}>위젯 맨 위에 남은 날짜가 표시돼요. 없으면 비워두셔도 돼요.</p>

        <form onSubmit={addDDay} className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_11rem_auto] gap-2">
          <label className="sr-only" htmlFor="dday-title">D-Day 이름</label>
          <input
            id="dday-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 중간고사, 여름방학"
            className={inputCls}
          />
          <label className="sr-only" htmlFor="dday-date">D-Day 날짜</label>
          <input
            id="dday-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
          <button type="submit" className={btnPrimary}>
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>추가</span>
          </button>
        </form>

        <ul className="mt-4 space-y-2">
          {config.ddays.length === 0 && (
            <li className="py-4 text-center text-base text-slate-500">등록된 D-Day가 없어요.</li>
          )}
          {config.ddays.map((d, idx) => (
            <li key={d.id} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-slate-900 truncate">{d.title}</div>
                <div className="text-sm text-slate-600">{d.targetDate}</div>
              </div>
              <button
                type="button"
                onClick={() => moveDDay(idx, 'up')}
                disabled={idx === 0}
                className={iconBtn}
                aria-label={`${d.title} 위로 이동`}
              >
                <ArrowUp className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveDDay(idx, 'down')}
                disabled={idx === config.ddays.length - 1}
                className={iconBtn}
                aria-label={`${d.title} 아래로 이동`}
              >
                <ArrowDown className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => removeDDay(d.id)}
                className={`${iconBtn} hover:text-red-600`}
                aria-label={`${d.title} 삭제`}
              >
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
