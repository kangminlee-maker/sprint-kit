---
title: GT_USER 테이블
domain: database
table: GT_USER
entity: User.java
created: 2026-01-26
---

# GT_USER 테이블

## 개요
**테이블명**: `GT_USER`
**엔티티**: `com.speaking.podo.applications.user.domain.User`
**목적**: 회원 정보 (학생 및 튜터)

## 스키마

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| ID | Integer | NO | Auto | PK, 사용자 고유 ID |
| USER_ID | String | YES | - | 로그인 ID |
| USER_PW | String | YES | - | 비밀번호 (암호화) |
| NAME | String | YES | - | 닉네임/표시명 |
| REAL_NAME | String | YES | - | 실명 |
| PHONE | String | YES | - | 전화번호 |
| EMAIL | String | YES | - | 이메일 (Unique) |
| CREDIT | Integer | YES | 0 | 크레딧 (미사용) |
| SEX | String | YES | - | 성별 (M/F, Gender Enum) |
| LANG_TYPE | String | YES | - | 학습 언어 (EN/JP/CN, Language Enum) |
| CREATE_DATE | LocalDateTime | YES | - | 생성일시 |
| REFERRAL_TYPE | String | YES | PASS | 추천인 유형 |
| REFERRAL_DETAIL | String | YES | - | 추천인 상세 |
| PATH_PROFILE_THUMB | String | YES | default-profile-pic-thumb.jpg | 프로필 썸네일 |
| PATH_PROFILE_ORIGIN | String | YES | default-profile-pic.jpg | 프로필 원본 |
| RECOMMEND_CODE | String | NO | - | 추천 코드 |
| COMPANY_CODE | String | YES | - | 기업 코드 |
| CLASS_TYPE | String | YES | - | 수업 유형 |
| ACCESS_TOKEN | String | NO | - | PHP 연동 토큰 |
| REFRESH_TOKEN | String | NO | - | PHP 리프레시 토큰 |
| MAX_PRESTUDY_SKIP | Integer | NO | - | 예습 스킵 최대 횟수 |
| DEVICE_TOKEN | String | YES | - | 푸시 알림용 디바이스 토큰 |

---

## 인덱스

### Primary Key
- `PRIMARY KEY (ID)`

### Unique Key
- `UNIQUE KEY (EMAIL)`

### 권장 인덱스
```sql
CREATE INDEX idx_user_phone ON GT_USER(PHONE);
CREATE INDEX idx_user_email ON GT_USER(EMAIL);
CREATE INDEX idx_user_recommend_code ON GT_USER(RECOMMEND_CODE);
CREATE INDEX idx_user_company_code ON GT_USER(COMPANY_CODE);
```

---

## 관계

### 1:1 관계
- **Tutor**: `GT_USER.EMAIL` ← `Tutor.EMAIL` (튜터 정보)
- **RecruitTutor**: `GT_USER.PHONE` ← `RecruitTutor.PHONE` (튜터 지원 정보)

### 1:N 관계 (FK로 참조됨)
- **GT_SUBSCRIBE_MAPP**: `GT_USER.ID` ← `GT_SUBSCRIBE_MAPP.USER_ID`
- **GT_CLASS_TICKET**: `GT_USER.ID` ← `GT_CLASS_TICKET.USER_ID`
- **GT_CLASS** (학생): `GT_USER.ID` ← `GT_CLASS.STUDENT_USER_ID`
- **GT_CLASS** (튜터): `GT_USER.ID` ← `GT_CLASS.TEACHER_USER_ID`
- **le_coupon**: `GT_USER.ID` ← `le_coupon.user_id`
- **GT_PAYMENT_INFO**: `GT_USER.ID` ← `GT_PAYMENT_INFO.USER_UID`

---

## 비즈니스 로직

### 회원 구분
- 학생: `GT_CLASS.STUDENT_USER_ID`로 참조되는 사용자
- 튜터: `GT_CLASS.TEACHER_USER_ID`로 참조되는 사용자
- 튜터는 별도 `Tutor` 테이블과 1:1 관계

### 추천 코드
- `RECOMMEND_CODE`: 다른 사용자가 입력할 수 있는 고유 코드
- 추천인 추적용 (`REFERRAL_TYPE`, `REFERRAL_DETAIL`)

### 기업 회원
- `COMPANY_CODE`: 기업 전용 코드
- B2B 회원 구분용

### 프로필 이미지
- `PATH_PROFILE_THUMB`: 썸네일 (목록용)
- `PATH_PROFILE_ORIGIN`: 원본 (상세보기용)
- 기본값: `default-profile-pic*.jpg`

---

## Enum 매핑

### Gender (SEX 컬럼)
**Converter**: `GenderConverter`

| DB 값 | Enum |
|-------|------|
| M | Gender.M (남성) |
| F | Gender.F (여성) |

### Language (LANG_TYPE 컬럼)
**Converter**: `SimpleLanguageConverter`

| DB 값 | Enum | 설명 |
|-------|------|------|
| EN | Language.EN | 영어 |
| JP | Language.JP | 일본어 |
| CN | Language.CN | 중국어 |
| KR | Language.KR | 한국어 |

---

## 주요 쿼리 예시

### 1. 이메일로 사용자 조회
```sql
SELECT * FROM GT_USER WHERE EMAIL = 'user@example.com';
```

### 2. 학생의 활성 구독 조회
```sql
SELECT u.*, sm.*
FROM GT_USER u
INNER JOIN GT_SUBSCRIBE_MAPP sm ON u.ID = sm.USER_ID
WHERE u.ID = ?
  AND sm.SUBSCRIBE_YN = 'Y'
  AND sm.END_DATE >= CURDATE();
```

### 3. 튜터의 오늘 수업 목록
```sql
SELECT c.*, s.NAME AS student_name
FROM GT_CLASS c
INNER JOIN GT_USER s ON c.STUDENT_USER_ID = s.ID
WHERE c.TEACHER_USER_ID = ?
  AND c.CLASS_DATE = CURDATE()
  AND c.CREDIT = 1 -- REGIST
ORDER BY c.CLASS_START_TIME;
```

### 4. 추천 코드로 가입한 사용자 수
```sql
SELECT COUNT(*) FROM GT_USER WHERE REFERRAL_DETAIL = 'RECOMMEND_ABC123';
```

---

## 주의사항

### 1. NAME vs REAL_NAME
- `NAME`: 닉네임/표시명 (앱에서 보이는 이름)
- `REAL_NAME`: 실명 (결제, 증명서 등에 사용)

### 2. CREDIT 컬럼
- 현재 미사용 (기본값 0)
- GT_CLASS.CREDIT과 이름은 같지만 용도 다름

### 3. ACCESS_TOKEN / REFRESH_TOKEN
- PHP 레거시 시스템 연동용
- Spring Boot에서는 별도 JWT 사용

### 4. EMAIL Unique
- 이메일은 Unique Key
- 회원가입 시 중복 체크 필수

### 5. @DynamicInsert / @DynamicUpdate
- 엔티티에 `@DynamicInsert`, `@DynamicUpdate` 적용
- NULL 컬럼은 INSERT/UPDATE 쿼리에서 제외

---

## 엔티티 파일 위치
```
src/main/java/com/speaking/podo/applications/user/domain/User.java
```

---

## 템플릿 변수

엔티티에서 `@TemplateVariable` 어노테이션으로 지정된 필드:
- `ID`: `beforeStudentId`, `afterStudentId`
- `REAL_NAME`: `studentName`, `beforeStudentName`, `afterStudentName`

알림 템플릿 등에서 사용됩니다.
