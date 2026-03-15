# philosopher — sprint-kit 도메인 학습

- LLM 기반 시스템에서 "결정론 필수 영역"과 "비결정론 허용 영역" 구분이 핵심. 이벤트 소싱이 "기록 시점의 결정론"을 제공하는 역할 (출처: Scanner 설계 리뷰, 2026-03-09)
- 흐름 기반 온톨로지에서 "흐름 운반" 원칙과 "Constraint 독립 섹션" 긴장은 Local/Global 분류로 해소. dual-consumer(AI+사람) 설계는 정보 구조와 렌더링 계층 분리가 핵심 (출처: blueprint 온톨로지 설계 리뷰, 2026-03-09)
- 설계 원칙이 합의되었을 때, 해당 분리가 이미 다른 형태로 달성되어 있는지 확인이 우선. 원칙의 실질적 달성과 문자적 해석의 구분이 과설계 방지의 핵심 (출처: 산출물 온톨로지 리뷰, 2026-03-09)
- "compile 에이전트 ≠ validate 에이전트" 구조에서 validation-plan.md가 유일한 세션 간 맥락 전달 경로. 이 전제를 명시하지 않으면 렌더러의 행동 지침 내재화 필요성이 간과됨 (출처: validation-plan 업그레이드 설계 리뷰, 2026-03-12)
- edge_case 강제(compile-defense L2)와 edge_case 실행 추적(validate 프로토콜+타입)은 분리된 설계 과제. 코드가 존재를 강제해도 실행을 강제하지 않으면 enforcement 고리가 끊어짐 (출처: validation-plan 업그레이드 설계 리뷰, 2026-03-12)
- discriminated union의 switch exhaustive check 추가는 "개별 함수 보강"이 아니라 "union type의 계약 강화"로 프레이밍해야 합니다. 개별 함수 단위로 기술하면 동일 패턴의 다른 함수가 누락될 수 있고, union type 계약 단위로 기술하면 대상 열거가 "이 union을 switch하는 모든 함수"로 자연스럽게 확장됩니다 (출처: 속도 개선 #4 exhaustive check 리뷰, 2026-03-15)
