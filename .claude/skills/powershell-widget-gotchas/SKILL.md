---
name: powershell-widget-gotchas
description: >
  src/utils/powerShellGenerator.ts를 수정하거나, 생성된 .ps1/.exe 위젯을 디버깅
  하거나, 생성기에 새 WPF UI 요소나 PowerShell 로직을 추가할 때 반드시 이 스킬을
  먼저 참고할 것. 이 파일은 TypeScript로 PowerShell 5.1 + WPF 스크립트를 통째로
  텍스트 생성하는데, PS 5.1 고유의 함정과 자가 컴파일(ps2exe) 흐름을 모르고
  건드리면 겉보기엔 멀쩡한 코드가 실제 윈도우에서만 조용히 깨진다. "위젯 생성기",
  "PowerShell 스크립트", ".ps1", "WPF", "위젯이 안 떠요/깨져요" 같은 요청에서
  트리거.
---

# PowerShell 위젯 생성기 함정 모음

`generatePowerShellScript()`([powerShellGenerator.ts:20](../../../src/utils/powerShellGenerator.ts))는 사용자 설정을 받아 PowerShell 5.1 + WPF 스크립트 전체를 문자열로 만들어낸다. TypeScript에서 PowerShell 코드를 "생성"하는 특성상, 아래 함정들은 로컬 타입체크나 리액트 쪽 테스트로는 전혀 잡히지 않고 **실제 윈도우에서 .ps1을 실행해야만** 드러난다.

## 1. 빈 배열이 `ConvertFrom-Json`을 거치면 사라지는 함정

[Lines 285-291](../../../src/utils/powerShellGenerator.ts):
```powershell
$Global:InitialTodosJson = '...'
$Global:InitialTodosRaw = $Global:InitialTodosJson | ConvertFrom-Json
$Global:InitialTodosData = @($Global:InitialTodosRaw)
```
왜 두 줄로 나뉘어 있는가: `@(...)` 안에 파이프라인을 **직접** 넣으면(`@($x | ConvertFrom-Json)`), 빈 JSON 배열 `"[]"`을 파싱했을 때 PowerShell 5.1은 "빈 배열 그 자체"를 파이프라인 출력 1개로 취급해서 `@()`가 그걸 다시 감싸버리는 바람에 **원소 1개짜리 중첩 배열**이 된다. 반드시 변수에 먼저 담아서 파이프라인을 "끊은" 다음 `@()`로 감싸야 `Count=0`인 빈 목록이 제대로 나온다.

→ 새로운 배열 데이터(예: `ddays`, `timetable`)를 이 패턴으로 추가할 때는 항상 이 2단계 방식을 그대로 따라간다.

## 2. 템플릿 리터럴 대신 `string[]` + `join`

파일 전체가 `const lines: string[] = [...]` ([line 140](../../../src/utils/powerShellGenerator.ts))로 문자열 배열을 쌓았다가 마지막에 join하는 구조다. 하나의 거대한 TS 템플릿 리터럴(백틱)을 쓰지 않는 이유: PowerShell 자체가 백틱(`` ` ``)을 이스케이프 문자로 쓰고 `${...}` 비슷한 문법도 있어서, TS 템플릿 리터럴 안에 PowerShell 코드를 그대로 넣으면 둘의 특수문자가 충돌한다. 배열 원소 하나하나가 "PowerShell 코드 한 줄"이라는 원칙을 유지하면 이 충돌을 원천 차단할 수 있다.

→ 새 로직을 추가할 때도 큰 템플릿 리터럴 블록으로 되돌리지 말고 같은 배열-줄 단위 스타일을 유지한다.

## 3. DPI Awareness는 반드시 System-Aware(-2), Per-Monitor-V2(-4) 아님

[Lines 189-202](../../../src/utils/powerShellGenerator.ts)에서 `SetProcessDpiAwarenessContext([IntPtr](-2))`를 호출한다. `powershell.exe`는 기본적으로 DPI-aware가 아니라서 Windows가 창 전체를 배율만큼 강제로 늘려 그리는데(DPI 가상화), 이를 끄기 위해 이 호출이 필요하다. 그런데 `-4`(Per-Monitor-V2)를 쓰면 PowerShell 5.1이 쓰는 .NET Framework의 WPF가 이를 완전히 지원하지 않아서, **다른 배율의 모니터로 위젯을 옮기면 레이아웃이 깨진다**. `-2`(System-Aware)는 "시작한 모니터 기준 고정, 모니터 이동 시 자동 재조정 시도 안 함"이라 더 안전하다.

→ 이 값을 `-4`로 "개선"하고 싶어질 수 있는데, .NET Core/5+ WPF가 아닌 한 하지 말 것.

## 4. 자가 컴파일(.exe) 흐름 — 설정은 이제 재컴파일 트리거가 아니다

1. 스크립트 시작 시 `MainModule.FileName`으로 지금 자신이 `powershell.exe`로 도는지 이미 컴파일된 `NEWSchoolWidget.exe`로 도는지 판별
2. `powershell.exe`로 돌고 있으면, 콘솔창 없이 한 번만 조용히 재실행 (`NEWSCHOOLWIDGET_RELAUNCHED` 환경변수로 무한루프 방지)
3. 백그라운드 `Start-Job`으로 NuGet 부트스트랩 → PSGallery 신뢰 등록 → `ps2exe` 모듈 설치 → 자기 자신을 `%LOCALAPPDATA%\NEWSchoolWidget\NEWSchoolWidget.exe`로 컴파일 — 위젯 UI는 이 컴파일을 기다리지 않고 바로 뜬다
4. `configHash`는 **`GENERATOR_VERSION` 상수만** 해시한 값이다(`hashConfig({ v: GENERATOR_VERSION })`) — 예전엔 사용자 설정(config) 전체를 같이 해시해서 설정이 바뀔 때마다 재컴파일했지만, 지금은 설정이 `내 문서\NEWSchoolWidget\config.json`으로 완전히 분리되어 있어서(아래 6번 참고) **설정 변경은 재컴파일과 무관하다** — `Rebuild-Widget`이 그 자리에서 즉시 반영한다. exe는 오직 **이 파일(생성기)의 코드 자체가 바뀔 때**만 다시 컴파일하면 되므로, PowerShell 로직을 실제로 수정했다면 반드시 `GENERATOR_VERSION`을 올릴 것 — 안 올리면 이미 설치된 사용자의 exe에는 그 수정이 영원히 반영되지 않는다.

## 6. 설정은 `config.json`, 위젯 갱신은 `Rebuild-Widget` — "다시 굽기" 없이 설정 변경

지금 구조는 **엔진(exe) / 설정(config.json)이 분리**돼 있다. 학교·시간표·D-Day·테마·자동실행 등 사용자가 바꿀 수 있는 모든 값은 `내 문서\NEWSchoolWidget\config.json`에 저장되고, 위젯 자체의 "⚙ 설정" 창([psSettingsWindow.ts](../../../src/utils/psSettingsWindow.ts))에서 편집한 뒤 저장하면:

1. `Apply-NewConfig` → `Save-Config`(파일에 씀) → `Sync-GlobalsFromConfig`(모든 `$Global:` 변수 재계산 + `Get-ThemeColors`로 `$Global:Colors` 갱신) → `Rebuild-Widget` 순서로 실행됨
2. `Rebuild-Widget`은 `Build-WidgetXaml`(현재 `$Global:` 값으로 XAML 문자열을 새로 만듦) → `$Global:Window.Content`에 새로 파싱한 트리를 통째로 교체 → `Bind-WidgetControls`로 재바인딩 → D-Day/시간표/급식/할일/스냅/자동시작을 전부 재실행
3. **창을 닫았다 새로 띄우지 않는다** — 같은 `$Global:Window`(같은 HWND) 그대로 `.Content`만 바뀌므로 작업표시줄/포커스 깜빡임이 없다

`generatePowerShellScript(config)`가 TS 쪽에서 만드는 건 이제 딱 하나, **최초 실행 시드값** `$Global:SeedConfigJson`뿐이다(`Load-Config`가 `config.json`이 없을 때만 이 시드를 파일로 저장하고 그걸 씀). 즉 스튜디오 웹사이트는 "최초 1회 설치용"이고, 그 이후 설정 변경은 전부 위젯 자체 설정창 쪽 코드(`psSettingsWindow.ts`)를 고쳐야 한다 — `App.tsx`/`ConfigPanel.tsx`만 고치고 끝내면 위젯 내부 설정창에는 그 필드가 안 보인다.

→ 새 설정 필드를 추가할 때 체크리스트: **(a)** `types.ts`의 `WidgetConfig`, **(b)** 웹 `ConfigPanel.tsx`(최초 설치용 UI), **(c)** `Sync-GlobalsFromConfig`(새 `$Global:` 변수로 반영), **(d)** 필요하면 `Build-WidgetXaml`(화면에 실제로 쓰는 경우), **(e)** `psSettingsWindow.ts`의 설정창 UI + `BtnSettingsSave` 핸들러의 `$newConfig.필드 = ...` — 전부 다 고쳐야 한다.

## 7. `Window.Content`를 나중에 교체하면 `Window.FindName`이 아니라 `Window.Content.FindName`을 써야 한다

WPF의 `XamlReader.Load`는 파싱한 트리의 **루트 엘리먼트에** `NameScope`를 붙인다. 처음부터 `<Window>...전체...</Window>`를 통째로 `Load`하면(예전 방식) 그 안의 모든 `x:Name`이 Window의 NameScope에 등록되어서 `$Global:Window.FindName("Foo")`가 잘 먹는다. 하지만 지금처럼 **빈 `<Window>` 껍데기를 먼저 만들고, `<Border>...</Border>` 콘텐츠 조각을 따로 `Load`해서 `$Global:Window.Content = ...`로 나중에 끼워 넣으면**, 그 이름들은 **Border 쪽 NameScope**에 등록되지 실제 Window의 있지 않다 — `$Global:Window.FindName(...)`은 항상 `$null`을 반환하고, 그 컨트롤을 나중에 쓰는 곳(`.Add_Click`, `.Text = ...`)에서 "null 값 식에서 메서드를 호출할 수 없습니다" 에러가 난다.

→ `Bind-WidgetControls`([powerShellGenerator.ts](../../../src/utils/powerShellGenerator.ts))는 반드시 `$Global:Window.Content.FindName("Foo")`처럼 **콘텐츠 루트에서** 찾는다. 설정 창(`Show-SettingsWindow`)처럼 `<Window>` 전체를 한 번에 `Load`하는 경우는(콘텐츠를 나중에 갈아끼우지 않으므로) 예전처럼 `$win.FindName(...)`로 충분하다 — 창 전체를 한 번에 로드하느냐, 콘텐츠만 나중에 교체하느냐에 따라 어느 쪽에서 찾아야 하는지가 달라진다는 걸 기억할 것.

## 8. `New-Object`는 XAML 태그 이름이 아니라 정확한 CLR 네임스페이스가 필요하다

XAML은 `xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"` 하나가 실제로는 `System.Windows.Controls`, `System.Windows.Controls.Primitives`, `System.Windows.Shapes` 등 **여러 CLR 네임스페이스에 동시에 매핑**되어 있어서, XAML 마크업에서는 `<UniformGrid>`라고만 써도 알아서 찾아준다. 하지만 PowerShell의 `New-Object -TypeName "System.Windows.Controls.UniformGrid"`처럼 **문자열로 타입 이름을 직접 지정**하는 경우는 이 자동 매핑이 없어서 정확한 전체 이름이 필요하다 — `UniformGrid`의 진짜 위치는 `System.Windows.Controls.Primitives.UniformGrid`다(`System.Windows.Controls.UniformGrid`는 존재하지 않는 타입이라 "유형을 찾을 수 없습니다" 에러가 남, 그것도 `ShowDialog()` 호출 스택 어딘가에서 터진 것처럼 보여서 원인 위치를 착각하기 쉽다).

→ XAML에서 잘 되던 태그를 프로그래밍 방식(`New-Object`)으로 옮길 때는 그 타입의 **실제 어셈블리/네임스페이스**를 확인할 것(막히면 `[AppDomain]::CurrentDomain.GetAssemblies() | % { $_.GetTypes() | ? { $_.Name -eq "TypeName" } }`로 실제 FullName을 찾아본다). `Grid`/`StackPanel`/`Border`/`TextBlock`/`Button`은 전부 `System.Windows.Controls`가 맞지만, `Primitives` 네임스페이스에 있는 타입(`UniformGrid`, `Popup`, `Track` 등)은 예외다.

## 5. PowerShell 문자열 리터럴로 값을 꽂을 때는 이스케이프 필수

`timetableJson`/`ddaysJson`/`todosJson`은 `.replace(/'/g, "''")`로 작은따옴표를 두 번 반복시켜 이스케이프한 뒤 PowerShell 작은따옴표 문자열 리터럴 안에 꽂는다 ([lines 53-55](../../../src/utils/powerShellGenerator.ts)). PowerShell 작은따옴표 문자열에서 `''`는 리터럴 `'` 하나를 의미하기 때문이다.

→ 새로운 config 필드를 문자열/JSON으로 스크립트에 꽂을 때 이 이스케이프 없이 그냥 interpolate하면, 사용자가 입력한 텍스트(예: 할 일 제목, 학교 이름)에 작은따옴표가 하나만 들어가도 PowerShell 문자열 리터럴이 조기 종료되어 스크립트 전체가 깨진다.
