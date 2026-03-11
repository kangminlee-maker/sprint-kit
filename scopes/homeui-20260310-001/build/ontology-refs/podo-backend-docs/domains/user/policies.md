---
domain: user
type: policy
related_entities: [User, Tutor]
related_files:
  - src/main/java/com/speaking/podo/applications/user/service/UserInfoService.java
  - src/main/java/com/speaking/podo/applications/user/controller/UserController.java
  - src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java
keywords: [회원가입, 로그인, 수강권, 프로필, 인증]
last_verified: 2026-01-26
---

# 사용자 도메인 정책

<!-- CONTEXT: domain=user, type=정책, keywords=회원가입,로그인,수강권,인증 -->

## 1. 회원가입 정책

### 1.1 소셜 로그인 기반 회원가입

📁 파일: `src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java`

**지원 플랫폼:**
- **KAKAO**: 카카오 소셜 로그인
- **GOOGLE**: 구글 소셜 로그인
- **PODO**: PODO 자체 계정
- **TUTOR**: 튜터 전용 계정

**회원가입 플로우:**
1. 클라이언트가 `GET /api/v1/auth/{provider}/authorize` 호출
2. OAuth 제공자의 인증 페이지로 리다이렉트
3. 사용자 인증 후 `GET /api/v1/auth/{provider}/callback` 호출
4. 시스템이 Access Token + Refresh Token 발급
5. 신규 사용자인 경우 User 엔티티 자동 생성

**정책 규칙:**
- 이메일이 고유 식별자로 사용됨
- 동일 이메일로 중복 가입 불가
- 소셜 계정 정보는 OAuth 매핑 테이블에 저장

### 1.2 PODO 계정 생성

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:164-177`

**API:** `POST /api/v1/user/podo`

**생성 절차:**
1. **계정 존재 여부 확인**: `POST /api/v1/user/podo/isExists`로 이메일 중복 체크
2. **계정 생성**: 이메일, 이름, 전화번호 등 기본 정보 입력
3. **초기 설정**:
   - `credit` = 0 (수강권 없음)
   - `profileImageUrl` = 기본 이미지
   - `recommendCode` = 자동 생성 (친구 추천용)

**필수 입력 항목:**
- 이메일 (email) - 고유 식별자
- 이름 (name)
- 실명 (realName)
- 전화번호 (phone) - 선택적
- 클래스 타입 (classType) - PODO, LEMONADE 등

**정책 규칙:**
- 이메일은 `unique` 제약 조건 적용
- 생성 시 자동으로 `createAt` (생성일시) 기록
- 추천 코드는 시스템에서 자동 생성하여 중복 방지

### 1.3 체험 수업 회원가입

📁 파일: `src/main/java/com/speaking/podo/applications/user/service/UserInfoService.java:35`

**API:** `POST /api/v1/user/lemonade` (classCount = "0")

**특징:**
- 결제 없이 체험 수업만 수강 가능한 계정
- `imp_uid` (아임포트 결제 고유번호)가 있어도 `classCount=0`이면 체험 계정으로 생성
- 체험 수업 단계(step) 정보 추적

**정책 규칙:**
- 체험 계정도 정식 계정과 동일한 User 엔티티 사용
- 체험 수업 완료 후 정식 결제 시 동일 계정으로 업그레이드

## 2. 인증 정책

### 2.1 토큰 기반 인증

📁 파일: `src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java:76-92`

**토큰 종류:**
- **Access Token**: 실제 API 호출에 사용 (만료 시간: 30분)
- **Refresh Token**: Access Token 갱신에 사용 (만료 시간: 더 김)

**토큰 발급:**
- **소셜 로그인 성공 시**: OAuth callback에서 자동 발급
- **내부 토큰 발급**: `POST /api/v1/auth/internal/access-token` (서버 간 통신용)

**토큰 갱신:**
- **API:** `POST /api/v1/auth/refresh`
- **입력:** Refresh Token
- **출력:** 새로운 Access Token + Refresh Token

**토큰 검증:**
- **API:** `POST /api/v1/auth/introspect`
- **기능:** JWT 토큰의 유효성 및 만료 여부 검증
- **반환:** `{ "active": true/false, "sub": userId, "iat": 발급시간, "exp": 만료시간 }`

**정책 규칙:**
- 모든 API 호출 시 `Authorization: Bearer {accessToken}` 헤더 필수
- Access Token 만료 시 Refresh Token으로 자동 갱신
- Refresh Token도 만료된 경우 재로그인 필요

### 2.2 내부 서버 간 인증

📁 파일: `src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java:76-92`

**API:** `POST /api/v1/auth/internal/access-token`

**목적:** PODO 내부 서버(PHP 레거시 등)에서 사용자 대신 토큰 발급

**보안 규칙:**
- **헤더 검증**: `X-Podo-Header: podo-server` 필수
- 외부에서 호출 시 401 Unauthorized 반환
- 30분 만료 토큰 발급

## 3. 사용자 정보 관리 정책

### 3.1 프로필 조회

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:234-263`

**API:** `GET /api/v1/user/podo/getInfo`

**조회 정보:**
- 기본 정보: 이름, 이메일, 전화번호
- 프로필 이미지: 썸네일, 원본
- 학습 정보: 학습 언어, 수강권 잔액
- 추천 정보: 추천 코드, 회사 코드

**정책 규칙:**
- 인증된 사용자만 자신의 정보 조회 가능
- `classType`에 따라 다른 정보 반환 (PODO, LEMONADE 등)
- 사용자가 존재하지 않으면 404 반환

### 3.2 프로필 수정

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:388-391`

**API:** `PUT /api/v1/user/podo/user`

**수정 가능 항목:**
- 이름 (name)
- 실명 (realName)
- 전화번호 (phone)
- 프로필 이미지 (profileImageUrl, profileOriginImageUrl)

**정책 규칙:**
- 이메일은 수정 불가 (고유 식별자)
- 전화번호 변경 시 OTP 인증 필요
- 프로필 이미지는 별도 업로드 API 사용

### 3.3 전화번호 인증

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:373-385`

**OTP 요청:** `POST /api/v1/user/podo/phone/otp`
- 입력: 전화번호
- 동작: SMS로 OTP 코드 발송

**OTP 검증:** `POST /api/v1/user/podo/phone/otp/validate`
- 입력: 전화번호, OTP 코드
- 동작: OTP 일치 여부 확인
- 성공 시: 전화번호 변경 가능

**정책 규칙:**
- OTP는 3분간 유효
- 5회 연속 실패 시 10분간 재발급 불가
- 하루 최대 10회 발송 제한

### 3.4 언어 설정

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:54-77`

**조회:** `GET /api/v1/user/lang` (Deprecated)
**수정:** `PATCH /api/v1/user/lang` (Deprecated)

**지원 언어:**
- 영어 (ENGLISH)
- 중국어 (CHINESE)
- 일본어 (JAPANESE)
- 베트남어 (VIETNAMESE)
- 스페인어 (SPANISH)

**정책 규칙:**
- 사용자가 최근 선택한 학습 언어 저장
- 앱 재실행 시 마지막 선택 언어로 자동 설정
- Deprecated: 향후 다른 방식으로 변경 예정

## 4. 수강권 관리 정책

### 4.1 수강권 초기화

📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/User.java:142-144`

**정책 규칙:**
- 신규 가입 시 `credit = 0`
- DB 기본값: `@ColumnDefault("0")`

### 4.2 체험 수강권 지급

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:179-202`

**API:** `POST /api/v1/user/podo/classTicketWithTrialClass`

**지급 정책:**
- 체험 수업 등록 시 1회 체험 수강권 지급
- 체험 수강권은 체험 수업에만 사용 가능
- 체험 수업 완료 후 자동 소멸

**정책 규칙:**
- 사용자당 1회만 지급 가능
- 이메일과 ID 일치 여부 확인 필수 (보안)
- 체험 수업 자동 생성과 함께 진행

### 4.3 수강권 차감

**차감 시점:**
- 수업 예약 확정 시 (Class 도메인에서 처리)
- 취소 불가 시점 이후 노쇼 시 차감

**정책 규칙:**
- 수강권이 0개면 수업 예약 불가
- 수강권은 음수가 될 수 없음
- 차감 실패 시 트랜잭션 롤백

## 5. 사전학습 스킵 정책

### 5.1 스킵 횟수 관리

📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/User.java:136-137`

**필드:** `maxPrestudySkip` (최대 스킵 가능 횟수)

**조회:** `GET /api/v1/user/podo/getPrestudySkipCount`
**실행:** `POST /api/v1/user/podo/skipPrestudy`

**정책 규칙:**
- 기본값: 시스템에서 설정 (예: 3회)
- 스킵 사용 시 카운트 증가
- 최대 횟수 도달 시 스킵 불가
- 매월 1일 0시 자동 초기화

### 5.2 스킵 제한

**제한 조건:**
- 수업 시작 2시간 전까지만 스킵 가능 (취소 정책과 동일)
- 스킵 후 수업 재예약 필수
- 연속 2회 스킵 시 경고 메시지

## 6. 체험 수업 단계 정책

### 6.1 단계 추적

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:272-307`

**조회:** `GET /api/v1/user/podo/getTrialStepInfo`
**저장:** `POST /api/v1/user/podo/insertStep`

**단계 코드:**
- `STEP_1`: 회원가입 완료
- `STEP_2`: 체험 수업 예약
- `STEP_3`: 체험 수업 완료
- `STEP_4`: 정식 결제 완료

**정책 규칙:**
- 각 단계는 순차적으로 진행
- 이전 단계 미완료 시 다음 단계 불가
- 단계 정보는 마케팅/분석 목적으로 활용

### 6.2 단계별 액션

**STEP_1 완료 시:**
- 체험 수업 예약 안내 푸시 발송

**STEP_2 완료 시:**
- 수업 준비 가이드 이메일 발송

**STEP_3 완료 시:**
- 정식 결제 할인 쿠폰 자동 지급

**STEP_4 완료 시:**
- 체험 단계 종료, 정식 회원으로 전환

## 7. 디바이스 토큰 정책

### 7.1 디바이스 토큰 등록

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:407-413`

**API:** `POST /api/v1/user/podo/device-token`

**목적:**
- 푸시 알림 발송을 위한 디바이스 식별

**정책 규칙:**
- 로그인 시 자동 등록
- 앱 재설치 시 새 토큰 등록
- 기존 토큰은 자동 덮어쓰기 (1 사용자 = 1 디바이스 토큰)

### 7.2 다중 디바이스 지원

**현재 정책:**
- 1명의 사용자는 1개의 디바이스 토큰만 보유
- 새로운 디바이스에서 로그인 시 이전 디바이스 토큰 무효화

**향후 개선:**
- 다중 디바이스 지원 시 디바이스 토큰 배열로 관리 필요

## 8. 캐시 무효화 정책

### 8.1 사용자 정보 캐시

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:362-371`

**API:** `GET /api/v1/user/podo/invalidate-cache` (Deprecated)

**캐시 대상:**
- 사용자 기본 정보
- 수강권 잔액
- 프로필 이미지 URL

**무효화 시점:**
- 사용자 정보 수정 시 자동
- 수강권 변경 시 자동
- 관리자 강제 무효화 시

**정책 규칙:**
- 캐시 TTL: 5분
- 무효화 후 다음 조회 시 DB에서 재로드

## 9. 페널티 및 홀딩 정책

### 9.1 페널티 조회

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:309-333`

**API:** `GET /api/v1/user/podo/penaltyList`

**페널티 사유:**
- 노쇼 (수업 시작 후 5분 이내 미접속)
- 연속 취소 (24시간 이내 3회 이상)
- 튜터 신고 누적

**정책 규칙:**
- 페널티 누적 시 수업 예약 제한
- 페널티 1회 = 1일 예약 불가
- 최대 3회 누적 시 계정 정지

### 9.2 홀딩 조회

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:335-359`

**API:** `GET /api/v1/user/podo/holdingList`

**홀딩 종류:**
- 사용자 요청 홀딩: 일시적 수업 중단
- 시스템 홀딩: 페널티로 인한 강제 중단

**정책 규칙:**
- 홀딩 중에는 수업 예약 불가
- 홀딩 중 수강권 만료 기간 연장
- 홀딩 해제 후 정상 서비스 이용 가능

## 10. 튜터 정보 조회 정책

### 10.1 튜터 프로필 조회

📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java:108-127`

**API:**
- v1: `GET /api/v1/user/getTutor?tutorId={id}`
- v2: `GET /api/v2/user/getTutor?tutorId={id}`

**조회 정보:**
- 기본 정보: 이름, 국가, 프로필 이미지
- 전문성: 담당 언어, 레벨, 자격증, 학력
- 소개: 튜터 인트로, 경력, 해시태그, 뱃지
- 활동: 수업 가능 여부, 오늘 수업 여부

**정책 규칙:**
- 모든 사용자가 조회 가능 (공개 정보)
- 비활성 튜터는 검색 제외
- 튜터 정보 변경 시 실시간 반영

## 11. OAuth 매핑 정책

### 11.1 소셜 계정 연동

📁 파일: `src/main/java/com/speaking/podo/applications/user/service/UserInfoService.java:87`

**지원 플랫폼:**
- KAKAO
- GOOGLE

**연동 규칙:**
- 1개 이메일 = 여러 소셜 계정 연동 가능
- 카카오 + 구글 동시 연동 지원
- 연동 후 어느 계정으로든 로그인 가능

**정책:**
- 최초 로그인한 소셜 계정을 주 계정으로 설정
- 추가 연동 시 기존 사용자 정보 유지
- 연동 해제 시 최소 1개 계정은 유지 필수

### 11.2 OAuth 사용자 조회

📁 파일: `src/main/java/com/speaking/podo/applications/user/service/UserInfoService.java:89`

**API:** 내부 서비스 메서드

**기능:**
- 사용자의 모든 연동된 소셜 계정 목록 조회
- OAuth 제공자별 고유 ID 및 이메일 매핑 정보 반환

**정책 규칙:**
- 사용자는 자신의 OAuth 정보만 조회 가능
- 관리자는 모든 사용자 OAuth 정보 조회 가능

## 12. 추천 코드 정책

### 12.1 추천 코드 발급

📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/User.java:110-111`

**발급 시점:**
- 회원가입 시 자동 발급

**코드 형식:**
- 8자리 영문/숫자 조합
- 중복 불가 (DB unique 제약)

**정책 규칙:**
- 1인 1코드 원칙
- 코드 변경 불가
- 코드를 통한 가입자 추적

### 12.2 추천 보상

**보상 정책:**
- 추천인: 추천받은 사용자가 결제 시 수강권 1개 지급
- 피추천인: 회원가입 시 즉시 수강권 1개 지급

**정책 규칙:**
- 추천 코드는 결제 전까지 입력 가능
- 결제 후 추천 코드 입력 불가
- 추천 보상은 중복 지급 불가

## 13. 회사 코드 정책

### 13.1 B2B 제휴 코드

📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/User.java:114-115`

**목적:**
- 기업 제휴를 통한 단체 가입 관리

**코드 입력:**
- 회원가입 시 선택적 입력
- 입력 시 제휴 혜택 자동 적용

**정책 규칙:**
- 유효한 회사 코드만 입력 가능
- 코드별 할인율 및 혜택 상이
- 회사 코드 입력 후 변경 불가

### 13.2 제휴 혜택

**일반 혜택:**
- 첫 결제 10% 할인
- 추가 수강권 1개 지급

**기업별 맞춤 혜택:**
- 특정 기업: 20% 할인 + 3개 수강권
- 협약 내용에 따라 상이

## 14. 보안 정책

### 14.1 개인정보 보호

**정책:**
- 비밀번호는 암호화 저장 (`@JsonIgnore` 처리)
- 토큰은 외부 노출 금지 (`@JsonIgnore` 처리)
- 개인정보 조회 시 본인 확인 필수

### 14.2 접근 제어

**규칙:**
- 자신의 정보만 조회/수정 가능
- 관리자는 모든 정보 접근 가능 (감사 로그 기록)
- 비인증 사용자는 공개 정보만 조회

### 14.3 데이터 삭제

**회원 탈퇴 시:**
- 개인정보 즉시 삭제 (GDPR 준수)
- 수업 기록은 익명화 후 보관 (통계 목적)
- 재가입 시 새 계정으로 처리

## 15. 에러 처리 정책

### 15.1 공통 에러 코드

- `200`: 성공
- `404`: 데이터 없음 (사용자 미존재, 정보 없음)
- `409`: 중복 데이터 (이메일 중복, 이미 처리된 요청)
- `401`: 인증 실패 (토큰 없음, 만료)
- `500`: 서버 오류

### 15.2 에러 메시지

**원칙:**
- 사용자 친화적 한국어 메시지
- 보안상 상세 정보 노출 금지
- 에러 원인 명확히 전달

**예시:**
- "이미 가입된 이메일입니다."
- "유저 데이터가 존재하지 않습니다."
- "유저 정보가 일치하지 않습니다."
