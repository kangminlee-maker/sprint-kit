---
domain: business
type: overview
last_verified: 2026-01-26
---

# 비즈니스 로직 개요

## 목적
PODO 백엔드의 핵심 비즈니스 플로우를 정책 관점에서 문서화합니다.

## 주요 비즈니스 도메인

### 1. 구독 관리
- **파일**: [subscription-flow.md](./subscription-flow.md)
- **설명**: 구독 상품 가입, 연장, 해지 프로세스
- **주요 엔티티**: Subscribe, SubscribeMapp, Ticket

### 2. 결제 시스템
- **파일**: [payment-flow.md](./payment-flow.md)
- **설명**: 결제 처리, 실패 처리, 환불 프로세스
- **주요 엔티티**: PaymentInfo, PaymentDetail

### 3. 수업 예약 및 진행
- **파일**: [lecture-flow.md](./lecture-flow.md)
- **설명**: 수업 생성, 예약, 예습, 진행 플로우
- **주요 엔티티**: Lecture, LectureOnline, LectureCourse

### 4. 쿠폰 정책
- **파일**: [coupon-policy.md](./coupon-policy.md)
- **설명**: 쿠폰 발급, 사용, 할인 적용 규칙
- **주요 엔티티**: Coupon, CouponTemplate

### 5. 수강권 정책
- **파일**: [ticket-policy.md](./ticket-policy.md)
- **설명**: 수강권 생성, 사용, 만료 규칙
- **주요 엔티티**: Ticket

### 6. 튜터 매칭
- **파일**: [tutor-matching.md](./tutor-matching.md)
- **설명**: 학생-튜터 매칭 알고리즘
- **주요 엔티티**: Tutor, Lecture

## 도메인 간 관계

```
구독 관리 → 결제 시스템 → 수강권 정책
    ↓                          ↓
쿠폰 정책                수업 예약 및 진행
                              ↓
                         튜터 매칭
```

## 문서 읽는 순서 (신규 개발자용)

1. **수강권 정책** - 핵심 개념 이해
2. **구독 관리** - 전체 플로우 파악
3. **결제 시스템** - 금융 로직 이해
4. **쿠폰 정책** - 할인 정책 학습
5. **수업 예약 및 진행** - 실제 서비스 플로우
6. **튜터 매칭** - 고급 비즈니스 로직

## 주요 용어 정리

### 구독 타입
- **TRIAL**: 체험권 (1회 무료)
- **SUBSCRIBE**: 정기 구독 (월 단위 자동 결제)
- **LUMP_SUM**: 일시불 (전체 금액 선결제)
- **EXTEND**: 연장 구독 (기존 구독 연장)
- **BONUS**: 보너스 수강권 (무료 제공)

### 수강권 타입
- **COUNT**: 회차권 (정해진 횟수)
- **UNLIMIT**: 무제한권 (기간 내 무제한)
- **PODO_TRIAL**: 체험권
- **REGULAR**: 정기권

### 수업 상태
- **PRESTUDY**: 예습 중
- **REGIST**: 예약 대기
- **RESERVED**: 예약 완료
- **START**: 수업 시작
- **FINISH**: 수업 완료
- **CANCEL**: 취소

### 언어 타입
- **EN**: 영어
- **JP**: 일본어
- **ENJP**: 영어+일본어 (다언어 패키지)

### 커리큘럼 타입
- **BASIC**: 기본 과정
- **BUSINESS**: 비즈니스 과정
- **SMART_TALK**: 스마트톡 (AI 채팅)

## 관련 파일 인덱스

### 서비스 레이어
```
src/main/java/com/speaking/podo/applications/subscribe/usecase/SubscribeMappServiceImpl.java
src/main/java/com/speaking/podo/applications/ticket/service/TicketServiceV2Impl.java
src/main/java/com/speaking/podo/applications/payment/service/PaymentServiceImpl.java
src/main/java/com/speaking/podo/applications/coupon/usecase/CouponServiceImpl.java
src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandServiceImpl.java
```

### 도메인 모델
```
src/main/java/com/speaking/podo/applications/subscribe/domain/Subscribe.java
src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeMapp.java
src/main/java/com/speaking/podo/applications/ticket/domain/Ticket.java
src/main/java/com/speaking/podo/applications/payment/domain/PaymentInfo.java
src/main/java/com/speaking/podo/applications/coupon/domain/Coupon.java
src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java
```

## 주의사항

### 결제 관련
- **절대 Native Query 사용 금지** - QueryDSL + Stream API 활용
- **트랜잭션 격리** - 결제 실패 시 롤백 보장
- **멱등성 보장** - 중복 결제 방지

### 쿠폰 관련
- **선착순 쿠폰** - Redis Lock으로 동시성 제어
- **중복 발급 방지** - 사용자당 1회 제한
- **만료 처리** - 스케줄러로 자동 만료

### 수강권 관련
- **우선순위 규칙** - UNLIMIT > COUNT > PODO_TRIAL
- **만료일 계산** - 홀딩 기간 제외
- **보너스 수강권** - 구독 해지 시 자동 회수

## 외부 시스템 연동

### 포트원 (결제)
- **경로**: `modules/portone/service/PortoneService.java`
- **기능**: 정기 결제, 일시불 결제, 환불

### 레몬보드 (화상 수업)
- **경로**: `modules/lemonboard/adapter/LemonBoardAdapter.java`
- **기능**: 화상 수업 룸 생성, 교재 업로드

### AWS SQS (이벤트)
- **경로**: `modules/aws/service/SQSService.java`
- **기능**: 쿠폰 발급, 알림톡 발송

## 비즈니스 규칙 업데이트 히스토리

### 2026-01-26
- 초기 문서화 완료
- 주요 플로우 6개 정리

---

**문서 작성자**: Claude Code
**최종 업데이트**: 2026-01-26
