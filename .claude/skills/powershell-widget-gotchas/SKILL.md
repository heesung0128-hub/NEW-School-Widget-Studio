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

## 4. 자가 컴파일(.exe) 흐름

1. 스크립트 시작 시 `MainModule.FileName`으로 지금 자신이 `powershell.exe`로 도는지 이미 컴파일된 `NEWSchoolWidget.exe`로 도는지 판별 ([lines 165-167](../../../src/utils/powerShellGenerator.ts))
2. `powershell.exe`로 돌고 있으면, 콘솔창 없이 한 번만 조용히 재실행 (`NEWSCHOOLWIDGET_RELAUNCHED` 환경변수로 무한루프 방지, [lines 181-185](../../../src/utils/powerShellGenerator.ts))
3. 백그라운드 `Start-Job`으로 NuGet 부트스트랩 → PSGallery 신뢰 등록 → `ps2exe` 모듈 설치 → 자기 자신을 `%LOCALAPPDATA%\NEWSchoolWidget\NEWSchoolWidget.exe`로 컴파일 ([lines 214-254](../../../src/utils/powerShellGenerator.ts)) — 위젯 UI는 이 컴파일을 기다리지 않고 바로 뜬다
4. 설정이 바뀌었는지는 `hashConfig()`([lines 6-18](../../../src/utils/powerShellGenerator.ts), cyrb53 알고리즘 — 암호학적 강도 불필요, 그냥 "설정이 그대로인지" 판별용)로 만든 `configHash`를 `build-meta.json`에 저장해두고 비교해서, **설정이 안 바뀌었으면 재컴파일을 건너뛴다**

→ 새 설정 필드를 추가하면 `hashConfig`가 자동으로 그 필드를 포함하므로(전체 config를 JSON.stringify) 별도 처리가 필요 없다. 다만 컴파일 조건 자체(설정 동일 여부 판정 로직)를 건드릴 때는 이 흐름 전체를 이해하고 있어야 한다.

## 5. PowerShell 문자열 리터럴로 값을 꽂을 때는 이스케이프 필수

`timetableJson`/`ddaysJson`/`todosJson`은 `.replace(/'/g, "''")`로 작은따옴표를 두 번 반복시켜 이스케이프한 뒤 PowerShell 작은따옴표 문자열 리터럴 안에 꽂는다 ([lines 53-55](../../../src/utils/powerShellGenerator.ts)). PowerShell 작은따옴표 문자열에서 `''`는 리터럴 `'` 하나를 의미하기 때문이다.

→ 새로운 config 필드를 문자열/JSON으로 스크립트에 꽂을 때 이 이스케이프 없이 그냥 interpolate하면, 사용자가 입력한 텍스트(예: 할 일 제목, 학교 이름)에 작은따옴표가 하나만 들어가도 PowerShell 문자열 리터럴이 조기 종료되어 스크립트 전체가 깨진다.
