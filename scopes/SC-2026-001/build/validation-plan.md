# Validation Plan: 무료체험 횟수 정책 변경 (1회 → 3회)

scope: SC-2026-001

---

### VAL-001 | CST-001 | inject

**검증 대상:** 신규 가입 시 체험권 nPurchased=3 확인
**검증 방법:** 테스트 계정 생성 → 체험권 조회 → nPurchased 값 확인
**통과 조건:** nPurchased=3, originCount=3
**실패 시 조치:** addTrialTicket() 상수 확인

---

### VAL-002 | CST-002 | inject

**검증 대상:** 순차 개방: 1회차 완료 전 2회차 예약 불가 확인
**검증 방법:** 1회차 미완료 상태에서 2회차 수업 생성 시도
**통과 조건:** 수업 생성 거부(currentOpenRound=1, 1회차 미완료)
**실패 시 조치:** createPodoClassV3() 검증 로직 확인

---

### VAL-003 | CST-003 | inject

**검증 대상:** 학생 노쇼 시 1회 차감 + 다음 회차 개방 확인
**검증 방법:** 1회차 예약 → 노쇼 처리 → nUsed, currentOpenRound 확인
**통과 조건:** nUsed=1, currentOpenRound=2
**실패 시 조치:** 노쇼 핸들러의 currentOpenRound 업데이트 확인

---

### VAL-004 | CST-004 | inject

**검증 대상:** 튜터 노쇼 시 nUsed 원복 + 재예약 가능 확인
**검증 방법:** 1회차 예약 → 튜터 노쇼 → nUsed, currentOpenRound 확인 → 재예약 시도
**통과 조건:** nUsed=0, currentOpenRound=1, 재예약 성공
**실패 시 조치:** 튜터 노쇼 핸들러의 nUsed 원복 확인

---

### VAL-005 | CST-005 | inject

**검증 대상:** 유료 체험 5,000원 결제 + 수강권 발급 확인
**검증 방법:** 3회 소진 후 유료 체험 구매 → 결제 처리 → 신규 Ticket 확인
**통과 조건:** 5,000원 결제 성공, PODO_TRIAL Ticket(nPurchased=3) 발급
**실패 시 조치:** PaymentGateway 유료 체험 분기 확인

---

### VAL-006 | CST-006 | inject

**검증 대상:** 체험 홈 UI에 3회차 진행 표시 확인
**검증 방법:** 각 시나리오(정상/노쇼/복구/소진) 상태에서 UI 렌더링 확인
**통과 조건:** TrialStepper에 ●/○/🔒 상태 정확히 표시, 잔여 회차 텍스트 정확
**실패 시 조치:** TrialStepper 컴포넌트 상태 매핑 확인

---

### VAL-007 | CST-007 | inject

**검증 대상:** 이용약관 제13조의2 조항 존재 확인
**검증 방법:** terms-of-service.md에 제13조의2 내용 확인
**통과 조건:** 무료 3회, 순차 개방, 차감, 복구, 유효기간 14일, 유료 전환 조항 포함
**실패 시 조치:** 약관 문서 수정

---

### VAL-008 | CST-008 | inject

**검증 대상:** 기존 미사용자 마이그레이션 확인
**검증 방법:** 마이그레이션 스크립트 실행 → 대상 사용자 nPurchased 확인
**통과 조건:** nUsed=0인 PODO_TRIAL Ticket의 nPurchased=3 변경. nUsed>0인 Ticket은 미변경
**실패 시 조치:** 마이그레이션 WHERE 조건 확인

---

### VAL-009 | CST-009 | inject

**검증 대상:** 체험권 유효기간 14일 확인
**검증 방법:** 신규 체험권 생성 → expireDate 확인
**통과 조건:** expireDate = 생성일 + 14일
**실패 시 조치:** PaymentGateway giveDays 값 확인

---
