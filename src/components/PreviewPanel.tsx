import React, { useLayoutEffect, useRef, useState } from 'react';
import { WidgetConfig } from '../types';
import { SchoolWidgetCard } from './Widget';

interface PreviewPanelProps {
  config: WidgetConfig;
  onUpdateConfig: (newConfig: WidgetConfig) => void;
  className?: string;
  // 모바일에서 미리보기를 접었다 펼 때 크기를 다시 재도록 알려주는 값
  open?: boolean;
}

// 패널 좌우 안쪽 여백(p-4 × 2)
const PANEL_PADDING = 32;

/*
 * 위젯 미리보기 패널. 글씨 크기를 키우면 위젯 자체가 (너비 × 배율)만큼 커지므로, 어떤 크기에서도
 * 잘리지 않게 한다:
 *  - 넓은 화면(lg 이상): 패널 너비가 위젯 크기에 맞춰 같이 늘어남(배율 1 유지)
 *  - 좁은 화면(모바일): 부모 영역 너비에 맞춰 위젯을 통째로 축소해서 전체가 보이게 함
 *  - 위젯이 화면 높이보다 크면 고정(sticky)을 풀어서 페이지를 스크롤하며 끝까지 볼 수 있게 함
 * 배율은 패널 자신의 너비가 아니라 (패널 크기에 영향받지 않는) 부모 그리드 너비로 계산해서,
 * 배율 ↔ 너비가 서로를 되먹임하는 일이 없게 함.
 */
export const PreviewPanel: React.FC<PreviewPanelProps> = ({ config, onUpdateConfig, className = '', open }) => {
  const asideRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [sticky, setSticky] = useState(true);

  useLayoutEffect(() => {
    const aside = asideRef.current;
    const inner = innerRef.current;
    const grid = aside?.parentElement;
    if (!aside || !inner || !grid) return;

    const update = () => {
      const naturalWidth = inner.offsetWidth;
      const naturalHeight = inner.offsetHeight;
      // 미리보기가 접혀 있을 땐(display: none) 크기가 0이라 건너뜀
      if (!naturalWidth || !naturalHeight || !grid.clientWidth) return;
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      const available = isDesktop ? Infinity : grid.clientWidth - PANEL_PADDING;
      const nextScale = Math.min(1, available / naturalWidth);
      setScale(nextScale);
      setHeight(naturalHeight * nextScale);
      setSticky(naturalHeight * nextScale + 96 <= window.innerHeight);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(grid);
    observer.observe(inner);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [open]);

  return (
    <aside
      ref={asideRef}
      aria-label="내 위젯 미리보기"
      className={`${className} lg:w-max ${sticky ? 'lg:sticky lg:top-6' : ''}`}
    >
      <div className="rounded-2xl bg-slate-200 border border-slate-300 p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">내 위젯 미리보기</div>
        <div className="w-full" style={{ height }}>
          <div
            ref={innerRef}
            style={{ width: 'max-content', transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            <SchoolWidgetCard config={config} onUpdateConfig={onUpdateConfig} />
          </div>
        </div>
      </div>
    </aside>
  );
};
