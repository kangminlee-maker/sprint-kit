# RLM Deep Analysis 통합 설계

> 8-Agent Panel Review 1차(2026-03-20) + 2차(2026-03-20) + PoC 품질 평가 결과를 반영한 시스템 통합 설계.

## 1. 배경

### 현재 문제

기존 패턴 매칭 스캐너는 구조 정보(API 209개, 스키마 160개, 의존성 6,195개)를 추출하지만, "변경 목표와 충돌하는 비즈니스 로직 수준의 제약"은 발견하지 못한다.

### PoC 결과 (2026-03-20)

- podo-backend (1,552파일): 271초, 10개 제약 발견
- **부가 가치 60%** — 10개 중 6개는 RLM만 발견 가능 (anyMatch 버그, 가격 하드코딩, 티켓 중복 검증 등)
- 기존 스캐너와 역할이 겹치지 않음: 스캐너=구조, RLM=의미. 보완 관계

### Panel Review 합의 사항

1. PoC 기능적 타당성 인정 (8/8)
2. scanners/ 계층에서 appendScopeEvent() 직접 호출 금지 (8/8)
3. Python-TypeScript 간 입출력 스키마 필요 (7/8)
4. RLM은 "새로운 스캐너"가 아니라 "Discovery Depth의 확장" (Philosopher)

---

## 2. 설계 결정

### 계층 배치: Option B — commands/ 후처리

Philosopher의 재정의를 채택한다. RLM은 기존 스캐너(패턴 매칭, 구조 추출)와 성격이 다르므로(LLM 의미 분석), scanners/ 계층이 아닌 commands/ 계층의 후처리 단계로 배치한다.

```
executeGrounding() 내부:
  ├─ 기존 스캐너 실행 (scanLocal, scanTarball, scanVault)
  ├─ grounding.started / grounding.completed 이벤트 기록
  ├─ scope.md 생성
  └─ [신규] Deep Analysis 실행 (optional)
      ├─ Python 프로세스 spawn
      ├─ 결과 파싱 + 검증
      └─ constraint.discovered × N 이벤트 기록
```

**이유**:
- scanners/ 계층의 불변 규칙(ScanResult 반환만, 이벤트 기록 안 함)을 위반하지 않음
- 이벤트 기록 주체가 commands/ 계층으로 일원화됨
- grounding.completed 후 실행이므로 기존 스캐너 결과를 입력으로 활용 가능

### 명칭: "Deep Analysis" (not "Deep Scan")

onto_semantics 합의를 반영한다. 기존 `scan`은 "패턴 매칭 기반 구조 추출"이라는 확립된 의미를 가지므로, LLM 기반 의미 분석에는 `analysis`를 사용한다.

| 용어 | 의미 |
|------|------|
| Scan (기존) | 정규식/AST 패턴 매칭으로 구조 정보 추출. 결정론적 |
| Deep Analysis (신규) | LLM 재귀 탐색으로 의미적 제약 발견. 비결정론적 |

### discovery_stage: `"deep_analysis"` (신규 값)

`DiscoveryStage` union type에 새 값을 추가한다. 기존 `"grounding"`을 재사용하면 발견 경로를 역추적할 수 없다.

```typescript
export type DiscoveryStage =
  | "grounding"
  | "deep_analysis"    // ← 신규
  | "exploration"
  | "draft_surface_gen"
  | "draft_phase1"
  | "draft_phase2"
  | "compile"
  | "apply";
```

### evidence_status: `"code_inferred"` 유지 + evidence_note 보충

onto_semantics 권고를 따른다. 기존 union type을 변경하지 않되, RLM 결과의 `evidence_note` 필드에 "RLM deep analysis에 의한 코드 분석 결과"를 명시한다.

### 설정 섹션명: `deep_analysis` (not `rlm_scan`)

onto_evolution 권고를 반영한다. 특정 도구(RLM)에 종속되지 않는 이름을 사용한다.

```yaml
deep_analysis:
  enabled: false          # 기본 비활성 (기존 사용자 영향 없음)
  backend: anthropic      # anthropic | openai
  model: claude-sonnet-4-20250514
  sub_model: claude-haiku-4-5-20251001  # 하위 호출용 (비용 절감)
  api_key_env: ANTHROPIC_API_KEY        # 환경변수 이름 (백엔드 추가 시 코드 변경 불필요)
  timeout_sec: 180        # wall-clock 타임아웃
  max_iterations: 30      # RLM 반복 제한
```

---

## 3. 파일 구조

```
src/
  commands/
    start.ts               (수정) — Deep Analysis 호출 + 이벤트 기록
    deep-analysis.ts        (신규) — Python 프로세스 spawn + 결과 파싱 + 검증
  kernel/
    types.ts                (수정) — DiscoveryStage + DeepAnalysisCompletedPayload + PayloadMap
  config/
    project-config.ts       (수정) — deep_analysis 설정 파싱
scripts/
  deep-analysis.py          (신규) — RLM 실행 엔트리포인트 (PoC 발전)
```

### npm 배포 범위

- `scripts/deep-analysis.py`는 npm 배포에 **포함하지 않음** (기존 규칙 유지)
- `src/commands/deep-analysis.ts`는 dist/에 포함됨
- 사용자가 별도로 `pip install rlms` + Python 설치 필요 (optional dependency)

### deep_analysis 설정 Zod 스키마 (R2 S-2, P-A — 2/7 합의)

`project-config.ts`의 `projectConfigSchema`에 추가할 스키마:

```typescript
const deepAnalysisConfigSchema = z.object({
  enabled: z.boolean().default(false),
  backend: z.string().default("anthropic"),
  model: z.string().default("claude-sonnet-4-20250514"),
  sub_model: z.string().optional(),
  api_key_env: z.string().default("ANTHROPIC_API_KEY"),
  timeout_sec: z.number().default(180),
  max_iterations: z.number().default(30),
  budget_warning_tokens: z.number().default(500000),
}).optional();

// projectConfigSchema에 추가:
export const projectConfigSchema = z.object({
  default_sources: z.array(sourceEntrySchema),
  target_stack: z.record(z.string(), z.string()).optional(),
  apply_enabled: z.boolean().optional(),
  deep_analysis: deepAnalysisConfigSchema,  // ← 신규
});
```

**YAML 전용 필드 vs Python 입력 필드 구분**: `timeout_sec`과 `budget_warning_tokens`는 TypeScript 측에서만 사용하며 Python 입력 스키마(`DeepAnalysisInputSchema.config`)에는 포함하지 않는다. Python은 `max_iterations`로만 반복을 제한하고, wall-clock 타임아웃은 TypeScript의 프로세스 kill이 담당한다.

---

## 4. Python-TypeScript 입출력 스키마

### Python → TypeScript (stdout JSON)

```typescript
// deep-analysis.ts에서 Zod로 검증
const DeepAnalysisConstraintSchema = z.object({
  perspective: z.enum(["experience", "code", "policy"]),
  summary: z.string(),
  severity: z.enum(["required", "recommended"]),  // 기존 Severity 타입과 일치 (R2 F-1)
  evidence: z.string(),
  evidence_files: z.array(z.string()).optional(),  // 교차 검증용
  impact_if_ignored: z.string(),
});

const DeepAnalysisOutputSchema = z.object({
  constraints: z.array(DeepAnalysisConstraintSchema),
  execution_time_sec: z.number(),
  model: z.string(),
  iterations_used: z.number(),
});
```

### TypeScript → Python (stdin JSON)

```typescript
const DeepAnalysisInputSchema = z.object({
  target_directory: z.string(),
  brief: z.string(),
  file_tree: z.string(),           // depth=3 파일 트리
  file_counts: z.record(z.number()),
  key_files: z.record(z.string()), // 핵심 설정 파일 내용
  config: z.object({               // .sprint-kit.yaml에서 추출
    backend: z.string(),
    model: z.string(),
    sub_model: z.string().optional(),
    api_key_env: z.string(),
    max_iterations: z.number(),
  }),
});
```

### constraint_id 생성 규칙

비결정론적 LLM 출력에서 결정론적 ID를 생성하기 위해, TypeScript 측(deep-analysis.ts)에서 ID를 생성한다. LLM 출력 순서(`index`)에 의존하지 않는다. (R2 F-5, S-5, D-1, E2 — 4/7 합의)

```typescript
function generateConstraintId(c: DeepAnalysisConstraint): string {
  // perspective + evidence_files + summary의 해시로 결정론적 ID 생성
  // LLM 출력 순서에 무관하게 동일 제약 → 동일 ID → reducer 중복 방지 작동
  const filesKey = (c.evidence_files ?? []).sort().join(",");
  const summaryKey = c.summary.toLowerCase().replace(/\s+/g, " ").trim();
  const key = `${c.perspective}:${filesKey}:${summaryKey}`;
  return `CST-DA-${contentHash(key).slice(0, 8).toUpperCase()}`;
}
```

**설계 근거**: `index`를 해시 입력에서 제거했다. LLM은 비결정론적이므로 동일 입력에 대해 동일 제약들을 다른 순서로 반환할 수 있다. `index`가 포함되면 순서 변경 시 다른 ID가 생성되어, reducer의 중복 방지(`map.has(constraint_id)`)가 작동하지 않는다. `summary`의 정규화된 값을 추가하여, 동일 `perspective` + 동일 `evidence_files`이지만 다른 내용의 제약을 구분한다.

---

## 5. start.ts 통합 지점

### runDeepAnalysis 반환 타입 (R2 S-4, R-1)

```typescript
type DeepAnalysisResult =
  | {
      success: true;
      constraints: DeepAnalysisConstraint[];
      usage: { tokens_in: number; tokens_out: number; iterations_used: number; execution_time_sec: number };
    }
  | {
      success: false;
      error: string;
    };
```

### 통합 코드

```typescript
// executeGrounding() 내부, grounding.completed 기록 후:

// ── Deep Analysis (optional) ──
const deepConfig = projectConfig.deep_analysis;
if (deepConfig?.enabled) {
  progress("Deep Analysis 시작...");
  const daResult = await runDeepAnalysis({
    targetDir: projectRoot,
    brief: briefContent,
    scanResults,
    config: deepConfig,
    timeout: deepConfig.timeout_sec * 1000,
  });

  if (daResult.success) {
    for (const c of daResult.constraints) {
      const constraintId = generateConstraintId(c);
      appendScopeEvent(paths, {
        type: "constraint.discovered",
        actor: "system",
        payload: {
          constraint_id: constraintId,
          perspective: c.perspective,
          summary: c.summary,
          severity: c.severity,
          discovery_stage: "deep_analysis",
          decision_owner: "product_owner",
          impact_if_ignored: c.impact_if_ignored,
          evidence_status: "code_inferred",
          evidence_note: "RLM deep analysis에 의한 코드 분석 결과",
          source_refs: [{
            source: "deep_analysis",  // 밑줄 형식 (R2 SEM-4)
            detail: c.evidence,
          }],
        },
      });
    }

    // Deep Analysis 완료 이벤트 (R2 F-4, S-3, D-2, SEM-3 — 4/7 합의)
    appendScopeEvent(paths, {
      type: "deep_analysis.completed",
      actor: "system",
      payload: {
        constraint_count: daResult.constraints.length,
        ...daResult.usage,
      },
    });

    progress(`Deep Analysis 완료 (${daResult.constraints.length}개 제약 발견)`);
  } else {
    // Graceful degradation: 실패해도 grounding은 성공
    progress(`Deep Analysis 실패: ${daResult.error} (기존 스캔 결과로 진행)`);
  }
}
```

---

## 6. 에러 처리

### Graceful Degradation

Deep Analysis 실패는 grounding 전체를 실패시키지 않는다. 기존 `Promise.allSettled` 패턴과 동일한 원칙.

### DeepAnalysisError (R2 F-2, SEM-1, E4 — 3/7 합의)

`ScanError`를 재사용하지 않는다. Deep Analysis는 스캐너가 아닌 commands/ 후처리이므로, 별도 에러 타입을 `commands/deep-analysis.ts`에 정의한다.

```typescript
interface DeepAnalysisError {
  error_type: "env_missing" | "auth" | "timeout" | "network" | "parse" | "unknown";
  message: string;
}
```

| 에러 | error_type | 처리 |
|------|-----------|------|
| Python 미설치 / rlm 미설치 | `env_missing` | 경고 후 스킵 |
| API 키 미설정 | `auth` | 경고 후 스킵 |
| 타임아웃 (timeout_sec 초과) | `timeout` | 프로세스 kill → 경고 후 스킵 |
| LLM API rate limit / network | `network` | 경고 후 스킵 |
| JSON 파싱 실패 | `parse` | 경고 후 스킵 |
| Zod 스키마 검증 실패 | — | 유효한 항목만 사용, 나머지 경고 |
| 0개 제약 발견 | — | 정상 — "Deep Analysis: 추가 제약 없음" 안내 |

### 환경 검증 (Python spawn 전)

```typescript
async function checkDeepAnalysisEnv(): Promise<{ ok: boolean; error?: string }> {
  // 1. python3 --version
  // 2. python3 -c "import rlm; print(rlm.__version__)"
  // 둘 다 성공해야 ok: true
}
```

---

## 7. 보안

| 위협 | 대응 |
|------|------|
| REPL 임의 코드 실행 | RLM `environment="local"` 사용. target_dir 외부 접근은 RLM 프롬프트에서 제한 지시. Docker 샌드박스는 추후 검토 |
| API 키 노출 | `verbose=False` 기본값. 로그에 API 키 마스킹 |
| 소스 코드 LLM API 전송 | `enabled: false` 기본값 + 첫 실행 시 경고 메시지: "소스 코드가 LLM API로 전송됩니다" |
| 민감 파일 전송 | 구현 시 정의: `.gitignore` 패턴 + 추가 제외 목록(`.env`, `credentials.*`, `*.pem`, `*.key`)을 Deep Analysis 입력에서 사전 필터링 (R2 R-3) |

---

## 8. 비용 관리

### 설정

```yaml
deep_analysis:
  # ... 기본 설정 ...
  budget_warning_tokens: 500000  # 이 토큰 수 초과 시 경고 로깅
```

### 비용 로깅 — `deep_analysis.completed` 이벤트 (R2 F-4, S-3, D-2, SEM-3 — 4/7 합의)

Deep Analysis 완료 시 별도 이벤트를 기록한다. `grounding.completed`에 포함하지 않는다 — Deep Analysis는 grounding.completed **이후** 실행되므로, 이벤트 소싱 불변 규칙(이미 기록된 이벤트를 수정할 수 없음)에 위배되기 때문이다.

```typescript
// ObservationalEventType에 추가
"deep_analysis.completed": {
  constraint_count: number;
  tokens_in: number;
  tokens_out: number;
  iterations_used: number;
  execution_time_sec: number;
}
// grounded 상태에서 self-transition (observational)
```

### 결과 캐시

```
.sprint-kit/cache/deep-analysis-cache.json

키: contentHash(source_hashes + brief)
값: { constraints: [...], cached_at: ISO8601 }
TTL: source_hashes 변경 시 자동 무효화
```

redirect.to_grounding 시: source_hashes가 변경되면 캐시 무효화 → 재실행. 변경 없으면 캐시 결과 재사용.

---

## 9. Exploration 연결

### Phase 3 (현재 상태)

에이전트 프로토콜에 추가:

```
Deep Analysis가 N개 제약을 발견한 경우:
- "시스템 분석에서 {N}개의 잠재적 충돌이 발견되었습니다" 안내
- 각 제약의 summary + impact_if_ignored를 PO에게 제시
- evidence는 PO에게 노출하지 않음 (에이전트/빌더 내부 참조용)
```

### Phase 5 (가정 검증)

```
Deep Analysis 제약의 evidence_status가 "code_inferred"인 경우:
- PO에게 "시스템이 코드 분석으로 발견한 제약입니다. 확인해주세요" 안내
- PO가 확인하면 evidence_status → "verified" (constraint.evidence_updated)
```

### 정보 계층 분리

| 계층 | 대상 | 포함 정보 |
|------|------|----------|
| PO 계층 | Align Packet, Draft Packet | summary, severity, impact_if_ignored |
| 시스템/빌더 계층 | Build Spec, brownfield-detail | evidence, evidence_files, evidence_note |

---

## 10. 테스트 전략

| 범주 | 파일 | 내용 | LLM 필요 |
|------|------|------|----------|
| 스키마 검증 | `deep-analysis.test.ts` | Zod 파싱 정상/비정상, constraint_id 생성 | 아니요 |
| 에러 처리 | `deep-analysis.test.ts` | 타임아웃, 프로세스 crash, JSON 오류 | 아니요 |
| start.ts 통합 | `start.test.ts` (기존 확장) | enabled=false 시 스킵, 실패 시 graceful | 아니요 |
| E2E | `e2e.test.ts` (기존 확장) | mock Python 출력 → 이벤트 기록 확인 | 아니요 |
| 렌더러 호환 | `draft-packet.test.ts` (기존 확장) | discovery_stage "deep_analysis" 제약이 Draft Packet에 표시되는지 확인 (R2 P-B) | 아니요 |
| 실제 LLM | `deep-analysis.integration.test.ts` | 실제 API 호출 (CI 선택적 실행) | 예 |

---

## 11. Codex/Cursor 호환성

### 현재 결정

- `deep_analysis.enabled` 기본값 `false` → Codex/Cursor에서 의도치 않은 실패 방지
- Python 미설치 환경에서 `enabled: true` → 환경 검증 실패 → 경고 후 스킵

### 향후 옵션 (통합 후 검토)

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A | Python 독립 패키지 (`pip install sprint-kit-analysis`) | npm/pip 분리 명확 | 설치 2단계 |
| B | TypeScript 재구현 (LLM API 직접 호출) | npm 단일 패키지 | RLM REPL 기능 상실 |
| C | API 서비스화 | 환경 무관 | 서버 운영 필요 |

PoC → 통합 → 운영 경험 축적 후 결정한다. 현재는 Python spawn 방식으로 진행.

---

## 12. 구현 순서

| # | 작업 | 의존성 | 산출물 |
|---|------|--------|--------|
| 1 | `types.ts` 수정: `DiscoveryStage` + `DeepAnalysisCompletedPayload` + `PayloadMap` + state-machine `deep_analysis.completed` self-transition | 없음 | types.ts 수정 |
| 2 | `project-config.ts`에 `deepAnalysisConfigSchema` 추가 | 없음 | config 수정 |
| 3 | `deep-analysis.ts` 작성: `DeepAnalysisError`, `DeepAnalysisResult`, `runDeepAnalysis()`, `generateConstraintId()`, `checkDeepAnalysisEnv()`, Zod 입출력 스키마 | #1, #2 | 신규 파일 |
| 4 | `scripts/deep-analysis.py` 작성 (PoC 발전) | 없음 | 신규 파일 |
| 5 | `start.ts`에 Deep Analysis 호출 삽입 + `deep_analysis.completed` 이벤트 기록 | #3 | start.ts 수정 |
| 6 | 테스트 작성 (스키마, 에러, 통합, 렌더러 호환, E2E) | #3, #5 | 테스트 파일 |
| 7 | 프로토콜 문서 업데이트 | #5 | start.md 수정 |

---

## 13. R2 Panel Review 반영 기록

| 즉시 조치 | 합의 | 반영 |
|----------|------|------|
| grounding.completed에 usage 포함 불가 → deep_analysis.completed 이벤트 신설 | 4/7 | Section 5, 8 수정 |
| constraint_id에서 index 제거 → perspective + summary hash | 4/7 | Section 4 수정 |
| ScanError 재사용 금지 → DeepAnalysisError 별도 정의 | 3/7 | Section 6 수정 |
| severity "optional" 제거 | 1/7 | Section 4 수정 |
| deep_analysis config Zod 스키마 명시 | 2/7 | Section 2 추가 |

| 권장 사항 | 반영 |
|----------|------|
| R-1: runDeepAnalysis() 반환 타입 discriminated union | Section 5 추가 |
| R-2: draft-packet.ts 렌더러 호환 테스트 | Section 10 추가 |
| R-3: 민감 파일 필터링 규칙 명시 | Section 7 추가 |
| R-4: 캐시 키에 모델명 포함은 운영 후 결정 | 현재 미포함 유지 (명시적 보류) |
