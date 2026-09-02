---
name: widget-theme-sync
description: >
  위젯 테마(색상 팔레트)를 추가하거나, accent/카드/테두리 색을 바꾸거나, 새로운
  "글래스" 스타일을 만들 때 반드시 이 스킬을 먼저 참고할 것. 이 저장소는 브라우저
  시뮬레이터(Widget.tsx, Tailwind 클래스)와 실제 윈도우 위젯을 만드는 PowerShell
  생성기(powerShellGenerator.ts, WPF ARGB 헥스)가 색상을 각자 따로 하드코딩하고
  있어서, 한 곳만 고치면 시뮬레이터 미리보기와 실제 위젯 색이 어긋난다. "테마
  추가", "색 바꿔줘", "새 글래스 스타일", "강조색", "accent color" 같은 요청에서
  트리거.
---

# 위젯 테마 동기화

## 왜 이게 필요한가

이 프로젝트는 하나의 위젯을 두 번 구현한다:

1. **브라우저 시뮬레이터** — [Widget.tsx](../../../src/components/Widget.tsx) 가 Tailwind 클래스로 렌더링
2. **실제 윈도우 위젯** — [powerShellGenerator.ts](../../../src/utils/powerShellGenerator.ts) 안에 생성되는 PowerShell `Get-ThemeColors` 함수가 같은 색을 WPF ARGB 헥스 문자열로 계산한다

둘 사이에 공유되는 색상 소스가 없다. Tailwind는 브라우저가 CSS로 해석하고, WPF는 별도로 계산된 헥스값을 받아야 하기 때문이다. 그래서 **테마를 하나 바꾸면 반드시 두 파일을 손으로 함께 고쳐야** 하고, 하나만 고치면 시뮬레이터에서는 예쁘게 보이는데 실제 위젯은 예전 색 그대로인 버그가 조용히 생긴다.

> **구조 변경 참고(2026-09)**: 예전에는 `powerShellGenerator.ts`가 TS 생성 시점에 if/else로 색을 계산해서 `.ps1` 텍스트에 리터럴로 구워 넣었다. 지금은 설정이 `config.json`으로 분리되면서, 색 계산 자체가 **PowerShell 런타임 함수 `Get-ThemeColors`**(스크립트 안에 통째로 생성됨)로 옮겨갔다 — 위젯 최초 렌더링과 위젯 자체 "⚙ 설정" 창에서 테마를 바꿀 때(`Rebuild-Widget`) 모두 이 **하나의** 함수를 호출한다. 즉 "TS if/else 체인"을 grep해도 더 이상 안 나오니, 이 파일에서 색을 고치려면 `Get-ThemeColors` 함수를 찾을 것.

## 테마가 걸쳐 있는 4곳

새 테마를 추가하거나 기존 테마 색을 바꿀 때 아래 4곳을 **전부** 확인한다:

| # | 파일 | 역할 |
|---|---|---|
| 1 | [src/types.ts:34](../../../src/types.ts) | `WidgetTheme` 유니언 타입 — 새 테마 키를 여기 추가 안 하면 타입 에러 |
| 2 | [src/components/Widget.tsx:169-241](../../../src/components/Widget.tsx) | `themeClasses` 객체 — 시뮬레이터가 실제로 쓰는 Tailwind 클래스 |
| 3 | [src/components/ConfigPanel.tsx:519-526](../../../src/components/ConfigPanel.tsx) | 테마 선택 UI 목록 (`id`/`name`/`desc`) — 여기 없으면 사용자가 그 테마를 고를 방법이 없음 (위젯 자체 설정창의 테마 콤보박스는 `src/utils/psSettingsWindow.ts`의 `$Global:ThemeChoices` 배열이 별도로 갖고 있음 — 여기도 같이 추가해야 새 테마가 설정창에도 뜬다) |
| 4 | `src/utils/powerShellGenerator.ts`의 `Get-ThemeColors` PowerShell 함수 (생성되는 스크립트 안, TS 코드가 아님 — `grep`으로 찾으려면 `"function Get-ThemeColors"` 또는 테마 id 문자열로 찾을 것) | WPF ARGB 헥스 switch 문 — 위젯 렌더링과 설정창 양쪽에서 공유되는 실제 위젯 색 계산 |

## Tailwind 투명도 → ARGB 알파 변환 공식

`powerShellGenerator.ts`의 헥스는 `#AARRGGBB` 형식이고, 앞 2자리(알파)는 Tailwind의 `/NN` 투명도 접미사를 `round(NN / 100 * 255)`로 변환한 값이다. 파일에 실제로 쓰인 값들:

| Tailwind 접미사 | 알파 헥스 | 검증 예시 |
|---|---|---|
| `/95` | `F2` | `bg-white/95` → `#F2FFFFFF`, `bg-neutral-950/95` → `#F20A0A0A` |
| `/90` | `E6` | `bg-slate-900/90` → `#E60F172A`, `bg-slate-50/90` → `#E6F8FAFC` |
| `/85` | `D9` | `bg-slate-700/85` → `#D9334155` |
| `/80` | `CC` | `border-slate-200/80` → `#CCE2E8F0` |
| `/70` | `B3` | `bg-slate-800/70` → `#B31E293B`, `bg-neutral-900/70` → `#B3171717` |
| `/60` | `99` | `bg-emerald-900/60` → `#99064E3B` (card 계열은 대부분 `/60`) |
| `/50` | `80` | `border-slate-700/50` → `#80334155` (border 계열은 대부분 `/50`) |

새 투명도 값을 쓰게 되면 공식(`round(pct*255)`, 2자리 대문자 헥스)으로 직접 계산하면 된다.

## 필드 대응표

`Widget.tsx`의 `themeClasses[theme]` 객체 필드와 `powerShellGenerator.ts`의 변수는 이렇게 대응한다:

| Widget.tsx 필드 | powerShellGenerator.ts 변수 | 비고 |
|---|---|---|
| `container` (배경색 부분) | `containerBg` | 클래스 문자열 중 `bg-*` 토큰만 대응 |
| `card` (배경색 부분) | `cardBg` | |
| `container`/`card`의 `border-*` 토큰 | `cardBorder` | **`themeClasses`에 별도로 있는 `border` 필드는 쓰지 말 것** — 아래 "함정" 참고 |
| `text` | `textPrimary` | |
| `subText` | `textSecondary` | `/NN` 서브 투명도가 붙어 있으면(예: `text-emerald-300/80`) 6자리 헥스 그대로 두지 말고, 앞의 알파 변환 공식으로 8자리 `#AARRGGBB`로 만들어서 반영한다 (예: `#6EE7B7` → `#CC6EE7B7`) |
| `accent` | `accentColor` | 뱃지/아이콘/보조텍스트처럼 연한 톤 전용. 커스텀 accent color(`customAccentColor`)가 있으면 덮어씀 |
| `accentBg` | `accentButtonColor` + `buttonTextColor` | 버튼처럼 배경을 통째로 채우는 곳 전용 (아래 참고). `accentColor`로 대충 대체하지 말 것 |

### 함정 1 — `themeClasses`의 `border` 필드는 죽은 코드다

`Widget.tsx`의 각 테마 객체에는 `border` 필드가 있지만(예: `border: 'border-slate-700/50'`), **React 컴포넌트 어디에서도 실제로 쓰이지 않는다** (`grep -r "currentTheme\."`로 확인 가능 — `container`/`card`/`subText`/`accentBg`만 쓰인다). 실제 화면에 그려지는 테두리는 `container`/`card` 문자열 안에 인라인으로 박힌 `border-*` 토큰이다.

과거에 `powerShellGenerator.ts`의 `cardBorder`를 이 죽은 `border` 필드 값으로 잘못 채운 적이 있었다(dark-acrylic: 실제 렌더링은 `/60`인데 죽은 필드는 `/50`이라 생성기도 `/50`으로 되어 있었음 — 위젯 테두리가 시뮬레이터보다 흐리게 나오는 버그였다). **`cardBorder`는 항상 `container`/`card`에 실제로 쓰인 `border-*` 토큰 기준으로 계산한다.**

### 함정 2 — 버튼 색(`accentBg`)과 뱃지/텍스트 색(`accent`)은 톤이 다르다

`accent`는 연한 톤(주로 `*-400`, light-acrylic만 `*-600`), `accentBg`는 진한 톤(주로 `*-600`, mono-glass는 `*-500` + 검은 글씨)이다. `추가` 버튼과 요일 선택 pill처럼 **배경을 통째로 채우는 요소**는 `accentColor`가 아니라 별도의 `accentButtonColor`(+ 필요시 `buttonTextColor`)를 써야 한다. 과거에 이 둘을 `accentColor` 하나로 퉁치는 바람에 실제 위젯 버튼이 시뮬레이터보다 훨씬 연하게 나왔고, mono-glass는 연노랑 배경에 흰 글씨(`buttonTextColor` 미대응)라 거의 안 보이는 저대비 버그까지 있었다. 새 테마를 추가할 때 `accentBg`의 색상 계열(`*-600`, `*-500` 등)과 텍스트색(검은 글씨가 필요한 밝은 배경인지)을 확인해서 `accentButtonColor`/`buttonTextColor`를 채운다.

## 체크리스트 (테마 추가/수정 시 순서대로)

1. **types.ts**: `WidgetTheme` 유니언에 새 키 추가
2. **Widget.tsx**: `themeClasses`에 7개 필드(`container`, `card`, `border`, `text`, `subText`, `accent`, `accentBg`) 모두 채워서 추가 (`border`/`text`/`accent`는 실제 렌더링엔 안 쓰이지만 PowerShell 생성기 작성 시 참고용 소스로 유지한다)
3. **ConfigPanel.tsx**: 테마 선택 목록에 `{ id, name, desc }` 추가 (한글 이름/설명 필요). **psSettingsWindow.ts**의 `$Global:ThemeChoices` 배열(`@{ Id = "..."; Name = "..." }`)에도 같은 항목을 추가 — 안 하면 위젯 자체 설정창의 테마 콤보박스에 새 테마가 안 보인다
4. **powerShellGenerator.ts의 `Get-ThemeColors` 함수**: `switch ($ThemeId)`에 새 분기(`"새테마-id" { ... }`) 추가. 기존 관례를 따라 각 색 옆에 **원본 Tailwind 클래스를 주석으로 남긴다** (예: `# container bg-slate-900/90, card bg-slate-800/70, border border-slate-700/60, ..., accentBg bg-blue-600`) — 나중에 시뮬레이터와 다시 비교할 때 이 주석이 유일한 단서가 된다. 이때 주석에 적는 `border`/`accentBg` 값은 반드시 **1단계 `themeClasses`의 죽은 필드가 아니라 실제 렌더링되는 `container`/`card`/`accentBg` 값**을 기준으로 적는다
5. 위 변환 공식으로 `ContainerBg`/`CardBg`/`CardBorder` 계산, `TextPrimary`/`TextSecondary`(서브 투명도 있으면 8자리 ARGB로)/`AccentColor`/`AccentButtonColor`는 Tailwind 색상표(예: slate-100 → `#F1F5F9`)에서 헥스값 가져오기. `AccentButtonColor` 배경 위 글씨가 밝은 색(옐로/앰버 계열)이면 `ButtonTextColor`를 검은색으로
6. 브라우저에서 시뮬레이터를 띄워 새 테마를 선택해보고, "파워쉘 (.ps1) 코드" 탭에서 생성된 스크립트를 열어 `Get-ThemeColors` 함수 안의 같은 분기가 같은 색인지(특히 `CardBorder`, `TextSecondary`, `AccentButtonColor`, `ButtonTextColor`) 육안 또는 문자열 검색으로 대조하고, 실제 Windows에서 실행해 위젯 자체 설정창에서도 새 테마를 선택해 색이 맞게 반영되는지 확인
