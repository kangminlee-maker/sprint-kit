코드베이스에서 도메인 온톨로지 YAML을 자동 생성합니다.

## 실행 절차

### 1. 대상 디렉토리 확인

사용자에게 대상 디렉토리를 확인합니다. 지정이 없으면 `.sprint-kit.yaml`의 소스 설정 또는 현재 프로젝트의 `src/` 디렉토리를 사용합니다.

### 2. Stage 1 실행 (코드 구조 추출)

```bash
npx tsx scripts/generate-ontology.ts --dir {대상 디렉토리} --out-dir {출력 디렉토리}
```

기본 출력 디렉토리: `./ontology-generated/`

Stage 1은 결정론적 코드 분석입니다. 진입점, 호출 그래프, 엔티티, enum, 상태 전이, 관계, 정책 상수를 추출하여 YAML 초안을 생성합니다. 이 초안에는 `meaning`, `display_name`, `trigger` 등 의미 필드가 빈 문자열(`""`)입니다.

### 3. Stage 2 실행 (의미 부여)

Stage 1이 생성한 YAML 초안을 읽고, 에이전트 프로토콜에 따라 의미를 채웁니다.

프로토콜: `docs/agent-protocol/ontology-generate.md`

프로토콜의 소비 순서(S1~S7)를 따라:
1. glossary.yaml의 `meaning` 필드에 각 엔티티의 비즈니스 의미를 한국어로 채움
2. `value_filters[].description`에 enum 값별 의미를 채움
3. actions.yaml의 `display_name`, `domain`, `side_effects`를 채움
4. transitions.yaml의 `trigger`, `guard` 의미를 채움

### 4. 결과 확인

생성된 파일을 사용자에게 보여주고, 검수를 요청합니다:
- `{출력 디렉토리}/glossary.yaml`
- `{출력 디렉토리}/actions.yaml`
- `{출력 디렉토리}/transitions.yaml`

### 5. 기존 온톨로지와 병합 (선택)

프로젝트에 기존 온톨로지 YAML이 있으면, 사용자에게 병합 여부를 확인합니다. 기존 파일의 수동 작성 내용(meaning, legacy_aliases 등)은 보존하고, 새로 발견된 엔티티/액션/전이만 추가합니다.
