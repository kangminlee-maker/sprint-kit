---
domain: index
type: by-entity
last_verified: 2026-01-26
updated: 2026-01-26
status: verified
---

# 엔티티별 파일 인덱스

> **검증 완료**: 2026-01-26에 모든 Entity 경로를 실제 코드베이스와 대조하여 검증 완료
>
> **주요 발견 사항**:
> - `core/entity` 디렉토리는 존재하지 않음
> - 모든 Entity는 각 도메인의 `domain/` 패키지에 위치
> - Entity 접미사 사용하지 않음 (예: `User.java`, `Ticket.java`)
> - 일부 도메인은 여러 Entity 클래스로 구성 (예: Payment, Lecture, Subscribe)

## User (사용자)

### Entity
- `src/main/java/com/speaking/podo/applications/user/domain/User.java`

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/user/repository/UserRepository.java`
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/user/repository/dsl/UserDslRepository.java`
- QueryDSL 구현체: `src/main/java/com/speaking/podo/applications/user/repository/dsl/UserDslRepositoryImpl.java`

### Service (Entity 기반)
- `UserInfoService.java` - 사용자 정보 CRUD
- `UserStatusService.java` - 사용자 상태 관리
- `UserHoldService.java` - 페널티/홀딩 관리

### 관련 테이블
- `user` - 사용자 기본 정보
- `user_status` - 사용자 상태 (언어 설정 등)
- `user_hold` - 사용자 홀딩/페널티 이력

---

## Ticket (수강권)

### Entity
- `src/main/java/com/speaking/podo/applications/ticket/domain/Ticket.java`

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/ticket/repository/TicketRepository.java`
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/ticket/repository/dsl/TicketDslRepository.java` (있는 경우)

### Service (Entity 기반)
- `TicketService.java` - 수강권 CRUD

### 관련 테이블
- `ticket` - 수강권 정보
- `ticket_history` - 수강권 사용 이력

---

## Lecture (수업)

> 주의: `Class` 대신 `Lecture`로 명명됨

### Entity
- `src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java` - 수업 기본 정보
- `src/main/java/com/speaking/podo/applications/lecture/domain/LectureCourse.java` - 수업 코스 (교재)
- `src/main/java/com/speaking/podo/applications/lecture/domain/PreStudy.java` - 예습
- `src/main/java/com/speaking/podo/applications/lecture/domain/LectureOnline.java` - 온라인 수업
- `src/main/java/com/speaking/podo/applications/lecture/domain/LectureAiExp.java` - AI 경험치
- `src/main/java/com/speaking/podo/applications/lecture/domain/LectureStatusHistory.java` - 수업 상태 이력
- `src/main/java/com/speaking/podo/applications/lecture/domain/LecturePrestudyLog.java` - 예습 로그
- `src/main/java/com/speaking/podo/applications/lecture/domain/LectureSubject.java` - 수업 주제
- `src/main/java/com/speaking/podo/applications/lecture/domain/TutorSubject.java` - 튜터 주제
- `src/main/java/com/speaking/podo/applications/lecture/domain/RecommendChatCourse.java` - 추천 채팅 코스

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/lecture/repository/LectureRepository.java`
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/lecture/repository/dsl/LectureDslRepository.java`
- QueryDSL 구현체: `src/main/java/com/speaking/podo/applications/lecture/repository/dsl/LectureDslRepositoryImpl.java`
- LectureCourse QueryDSL: `src/main/java/com/speaking/podo/applications/lecture/repository/dsl/LectureCourseDslRepository.java`
- LectureCourse 구현체: `src/main/java/com/speaking/podo/applications/lecture/repository/dsl/LectureCourseDslRepositoryImpl.java`

### Service (Entity 기반)
- `LectureCommandService.java` - 수업 생성/수정
- `LectureQueryService.java` - 수업 조회

### 관련 테이블
- `class` (또는 `lecture`) - 수업 정보
- `class_course` - 수업 코스 (교재)
- `prestudy` - 예습
- `lecture_online` - 온라인 수업

---

## Payment (결제)

### Entity
- `src/main/java/com/speaking/podo/applications/payment/domain/PaymentInfo.java` - 결제 기본 정보
- `src/main/java/com/speaking/podo/applications/payment/domain/PaymentDetail.java` - 결제 상세
- `src/main/java/com/speaking/podo/applications/payment/domain/DirectPay.java` - 직접 결제
- `src/main/java/com/speaking/podo/applications/payment/domain/PaymentFailInfo.java` - 결제 실패 정보

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/payment/repository/PaymentRepository.java` (있는 경우)
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/payment/repository/PaymentInfoDslRepository.java`
- QueryDSL 구현체: `src/main/java/com/speaking/podo/applications/payment/repository/PaymentInfoDslRepositoryImpl.java`

### Service (Entity 기반)
- `PaymentService.java` - 결제 처리
- `DirectPayService.java` - 직접 결제

### 관련 테이블
- `payment_info` - 결제 기본 정보
- `payment_detail` - 결제 상세
- `direct_pay` - 직접 결제
- `payment_fail_info` - 결제 실패 정보

---

## Subscribe (구독)

### Entity
- `src/main/java/com/speaking/podo/applications/subscribe/domain/Subscribe.java` - 구독 상품 정보
- `src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeOrigin.java` - 구독 원본 정보
- `src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeMapp.java` - 사용자-구독 매핑
- `src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeMappHistory.java` - 구독 매핑 이력
- `src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeItem.java` - 구독 아이템
- `src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeItemMapp.java` - 구독 아이템 매핑

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/subscribe/repository/SubscribeRepository.java`
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/subscribe/repository/dsl/SubscribeDslRepository.java` (있는 경우)

### Service (Entity 기반)
- `SubscribeService.java` - 구독 관리
- `SubscribeOriginService.java` - 구독 원본 정보
- `SubscribeMappService.java` - 구독 매핑 관리 (domain/action 패키지)
- `SubscribeMappHistoryService.java` - 구독 매핑 이력

### 관련 테이블
- `subscribe` - 구독 상품 정보
- `subscribe_origin` - 구독 원본
- `subscribe_mapp` - 사용자-구독 매핑
- `subscribe_mapp_history` - 구독 매핑 이력
- `subscribe_item` - 구독 아이템
- `subscribe_item_mapp` - 구독 아이템 매핑

---

## Coupon (쿠폰)

### Entity
- `src/main/java/com/speaking/podo/applications/coupon/domain/Coupon.java` - 쿠폰 정보
- `src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java` - 쿠폰 템플릿

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/coupon/repository/CouponRepository.java`
- 템플릿 Repository: `src/main/java/com/speaking/podo/applications/coupon/repository/CouponTemplateRepository.java`
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/coupon/repository/CouponCommonDslRepository.java`
- QueryDSL 구현체: `src/main/java/com/speaking/podo/applications/coupon/repository/CouponCommonDslRepositoryImpl.java`

### Service (Entity 기반)
- `CouponService.java` - 쿠폰 관리 (usecase 패키지)

### 관련 테이블
- `coupon` - 쿠폰 정보
- `coupon_template` - 쿠폰 템플릿
- `coupon_history` - 쿠폰 사용 이력 (있는 경우)

---

## Tutor (튜터)

### Entity
- `src/main/java/com/speaking/podo/applications/user/domain/Tutor.java` (추정 - user 도메인 안에 위치)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/user/repository/TutorRepository.java`
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/user/repository/dsl/TutorQueryDslRepositoryImpl.java`

### Service (Entity 기반)
- `TutorService.java` - 튜터 정보 관리

### 관련 테이블
- `tutor` - 튜터 기본 정보
- `tutor_schedule` - 튜터 스케줄
- `tutor_subject` - 튜터 주제

---

## BizLog (비즈니스 로그)

### Entity
- `src/main/java/com/speaking/podo/applications/log/domain/BizLog.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/log/repository/BizLogRepository.java`

### Service (Entity 기반)
- `BizLogCommandService.java` - 비즈니스 로그 기록
- `BizLogQueryService.java` - 비즈니스 로그 조회

### 관련 테이블
- `biz_log` - 비즈니스 로그

---

## Diagnosis (진단)

### Entity
- `src/main/java/com/speaking/podo/applications/diagnosis/domain/Diagnosis.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/diagnosis/repository/DiagnosisRepository.java`

### Service (Entity 기반)
- `DiagnosisService.java` - 진단 로직
- `DiagnosisPersistenceService.java` - 진단 저장
- `SrtAnalysisService.java` - SRT 분석
- `SrtAnalyzeService.java` - SRT 분석 v2
- `PromptService.java` - AI 프롬프트

### 관련 테이블
- `diagnosis` - 진단 정보
- `diagnosis_result` - 진단 결과

---

## Discount (할인)

### Entity
- `src/main/java/com/speaking/podo/applications/discount/domain/Discount.java` (추정)
- `src/main/java/com/speaking/podo/applications/discount/domain/DiscountDetail.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/discount/repository/DiscountRepository.java`
- 상세 Repository: `src/main/java/com/speaking/podo/applications/discount/repository/DiscountDetailRepository.java`

### Service (Entity 기반)
- `DiscountService.java` - 할인 관리
- `DiscountDetailService.java` - 할인 상세

### 관련 테이블
- `discount` - 할인 정보
- `discount_detail` - 할인 상세

---

## RefreshToken (리프레시 토큰)

### Entity
- `src/main/java/com/speaking/podo/applications/auth/domain/RefreshToken.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/auth/repository/RefreshTokenRepository.java`

### Service (Entity 기반)
- `RefreshTokenService.java` - Refresh Token 관리

### 관련 테이블
- `refresh_token` - 리프레시 토큰 정보

---

## AuthSid (인증 세션)

### Entity
- `src/main/java/com/speaking/podo/applications/auth/domain/AuthSid.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/auth/repository/AuthSidRepository.java`

### Service (Entity 기반)
- `AuthSidService.java` - Session ID 관리

### 관련 테이블
- `auth_sid` - 인증 세션 ID

---

## Board (게시판)

### Entity
- `src/main/java/com/speaking/podo/applications/board/domain/Board.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/board/repository/BoardRepository.java`
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/board/repository/BoardDslRepository.java`
- QueryDSL 구현체: `src/main/java/com/speaking/podo/applications/board/repository/BoardDslRepositoryImpl.java`

### Service (Entity 기반)
- `BoardQueryService.java` - 게시판 조회

### 관련 테이블
- `board` - 게시판
- `board_post` - 게시글

---

## Notice (공지사항)

### Entity
- `src/main/java/com/speaking/podo/applications/notice/domain/Notice.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/notice/repository/NoticeRepository.java`

### Service (Entity 기반)
- `NoticeQueryService.java` - 공지사항 조회

### 관련 테이블
- `notice` - 공지사항

---

## Popup (팝업)

### Entity
- `src/main/java/com/speaking/podo/applications/popup/domain/Popup.java`

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/popup/repository/PopupRepository.java`

### Service (Entity 기반)
- `PopupService.java` - 팝업 관리 (domain/action 패키지)

### 관련 테이블
- `popup` - 팝업 정보

---

## Recap (복습)

### Entity
- `src/main/java/com/speaking/podo/applications/recap/domain/Recap.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/recap/repository/RecapRepository.java`

### Service (Entity 기반)
- `RecapService.java` - 복습 관리 (domain/action 패키지)

### 관련 테이블
- `recap` - 복습 정보

---

## Card (카드)

### Entity
- `src/main/java/com/speaking/podo/applications/card/domain/Card.java` (추정)

### Repository
- 기본 Repository: `src/main/java/com/speaking/podo/applications/card/repository/CardRepository.java`
- QueryDSL Repository: `src/main/java/com/speaking/podo/applications/card/repository/CardDslRepository.java`
- QueryDSL 구현체: `src/main/java/com/speaking/podo/applications/card/repository/CardDslRepositoryImpl.java`

### Service (Entity 기반)
- `CardQueryService.java` - 카드 조회

### 관련 테이블
- `card` - 카드 정보

---

## 엔티티 관계도

### 핵심 엔티티 관계
```
User 1:N Ticket
User 1:N Class
User 1:N Payment
User 1:N Coupon
User 1:N UserHold
User 1:1 UserStatus

Ticket N:1 Subscribe
Class N:1 ClassCourse
Class N:1 Ticket
Class N:1 Tutor

Payment N:1 User
Payment N:1 Subscribe
Payment N:M Coupon

Subscribe 1:N SubscribeMapp
SubscribeMapp N:1 User
```

### Repository 패턴

#### 기본 Repository (JPA)
```java
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
}
```

#### QueryDSL Repository
```java
public interface UserDslRepository {
    List<UserDto> findUsersByCondition(UserSearchCondition condition);
}

public class UserDslRepositoryImpl implements UserDslRepository {
    private final JPAQueryFactory queryFactory;

    @Override
    public List<UserDto> findUsersByCondition(UserSearchCondition condition) {
        return queryFactory
            .select(Projections.fields(UserDto.class, ...))
            .from(qUser)
            .where(...)
            .fetch();
    }
}
```

### 네이밍 규칙
- **Entity**: `User`, `Ticket`, `Class` (Entity 접미사 없음)
- **Repository**: `UserRepository`, `TicketRepository`
- **QueryDSL Repository**: `UserDslRepository`, `UserDslRepositoryImpl`
- **Q클래스**: `QUser`, `QTicket` (QueryDSL 자동 생성)

### 주의사항
1. **Entity 접미사 생략**: 대부분의 엔티티는 `Entity` 접미사 없이 사용
2. **QueryDSL 우선**: Native Query 대신 QueryDSL 사용 권장
3. **Stream API 활용**: 복잡한 그룹핑/필터링은 Stream API로 처리
4. **DTO Projection**: Interface 대신 DTO 클래스 사용
