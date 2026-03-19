# Build Spec: 만료자 대상 프로모션 강화 및 메시지 테스트를 통한 rebuy 개선

## 1. Scope Summary

| 항목 | 값 |
|------|-----|
| scope ID | expired-user-promotion-mkt-20260319-001 |
| 제목 | 만료자 대상 프로모션 강화 및 메시지 테스트를 통한 rebuy 개선 |
| 방향 | LOW/MEDIUM 세그먼트 만료자(D+4 이후) 풀페이지 팝업 메시지를 손실 회피 + 가격 강조로 교체하여 재구매율(현재 2.21%)을 향상시킨다. 2주간 최종 결제 전환율로 성과 측정. |
| scope type | experience |

**범위 — 포함:**
- 풀페이지 팝업 헤드라인 변경: "지금 역대 최대 할인가로 다시 시작하세요!"
- 풀페이지 팝업 서브카피 변경: "포도와 열심히 쌓은 외국어 실력이 사라지고 있어요ㅠㅠ"
- 팝업 내 이미지 삽입: 월 4만원대 이미지 (디자이너 제작, CTA 위)
- CTA 변경: "4만원대로 다시 시작 >" → 세그먼트별 외부 프로모션 URL로 랜딩
- 닫기 문구 변경: "할인 혜택 포기하기"

**범위 — 제외:**
- 앱 밖 채널 (플친/LMS) 메시지 — 마케팅팀 별도 운영
- 세그먼트 분류 로직 (LOW/MEDIUM) — 기존 유지
- 쿠폰 금액/종류 — 기존 세그먼트별 금액 그대로
- 팝업 노출 조건 (D+4, 당일 미노출, 활성 수강권 보유 시 종료) — 기존 로직 유지
- 외부 프로모션 URL/랜딩페이지 — 이미 존재, 변경 없음

## 2. Confirmed Surface

- **surface 경로**: `surface/preview/`
- **content hash**: `a07026c1cf5d2dffcd17c4df0df70ab2066f585ea2ea946725adbfe58eb3f3fc`

**시나리오 요약:**
만료자(D+4 이후) 앱 오픈 시 풀페이지 팝업: 헤드라인(역대 최대 할인가) + 서브카피(외국어 실력 사라짐) + 가격 이미지(월 4만원대) + CTA(세그먼트별 URL) + 닫기(할인 혜택 포기하기). 닫기 시 당일 미노출, 다음날 재노출. 활성 수강권 보유 시 종료.

## 3. Constraint Decision Map

| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |
|--------|------|------|------|-------------------|
| CST-001 | Experience | 팝업의 "월 4만원대" 표시와 실제 결제 금액이 세그먼트/쿠폰에 따라 다를 수 있어 사용자 혼란 가능 | inject | Section 4에서 구현. 현재 4만원대 표시 유지 |
| CST-002 | Policy | "역대 최대 할인가" 문구가 광고/프로모션 표시 규정에 부합하는지 확인 필요 | inject | Section 4에서 구현. 역대 최대 할인가 표현 유지 + 내부 근거 기록 |
| CST-003 | Code | 풀페이지 팝업의 헤드라인/서브카피/이미지/CTA를 서버에서 교체할 수 있는 구조가 필요 | inject | Section 4에서 구현. 기존 서버 교체 구조 활용 |

## 4. Implementation Plan

### IMPL-001 | CST-001, CST-002, CST-003

- **요약:** 풀페이지 팝업 메시지 콘텐츠 교체 (서버 설정)
- **변경 대상:** 백엔드 — MarketingController / WelcomeBackPromotion 설정
- **변경 내용:** 서버에서 관리하는 풀페이지 팝업 콘텐츠를 교체합니다. 헤드라인: "지금 역대 최대 할인가로 다시 시작하세요!", 서브카피: "포도와 열심히 쌓은 외국어 실력이 사라지고 있어요ㅠㅠ", 이미지: 월 4만원대 이미지(디자이너 제작), CTA: "4만원대로 다시 시작 >" → 세그먼트별 외부 프로모션 URL, 닫기: "할인 혜택 포기하기"
- **guardrail:** 팝업 노출 조건(D+4, 당일 미노출, 활성 수강권 종료)은 변경하지 않음

### IMPL-002 | CST-001

- **요약:** 프로모션 이미지 에셋 등록
- **변경 대상:** 디자이너 → 이미지 에셋 제작 및 CDN 업로드
- **변경 내용:** 월 4만원대가 잘 보이는 이미지를 디자이너가 제작하여 CDN에 업로드합니다. 팝업 설정에서 해당 이미지 URL을 참조합니다.

## 5. Delta Set Reference

- **delta-set 경로**: `build/delta-set.json`
- **변경 파일 수**: modify 2건
- **content hash**: `b09fbd3e36c029f716cf55ee15211dec7ad7441dc2ed0d4b62dddb81d17a9bbb`
## 6. Validation Plan Reference

- **validation-plan 경로**: `build/validation-plan.md`
- **검증 항목 수**: 3건
- **content hash**: `a4c61ae7ab71023e31a8d995b6c914e9c7c4e8767dae9562accf0bb91f038cd8`
## 7. Brownfield Context

상세: [`build/brownfield-detail.md`](brownfield-detail.md) (hash: `ed87e8b5`)

### 변경 대상 파일 (3건)

| 경로 | 역할 | 상세 |
|------|------|------|
| `src/main/java/com/speaking/podo/applications/marketing/controller/MarketingController.java` | API 엔드포인트 | [→ 상세](brownfield-detail.md#undefined) |
| `src/main/java/com/speaking/podo/applications/user/dto/response/WelcomeBackPromotionDto.java` | 세그먼트 판별 DTO | [→ 상세](brownfield-detail.md#undefined) |
| `src/main/resources/config/common/marketing-config.yml` | 팝업 콘텐츠 설정 | [→ 상세](brownfield-detail.md#undefined) |

### 직접 의존 모듈 (1건)

| 모듈 | 의존 대상 | 상세 |
|------|----------|------|
| undefined | undefined | [→ 상세](brownfield-detail.md#undefined) |

<details>
<summary>API 계약 (1건)</summary>

| endpoint | method | 설명 | 상세 |
|----------|--------|------|------|
| undefined | GET | undefined | [→ 상세](brownfield-detail.md#undefined) |

</details>

