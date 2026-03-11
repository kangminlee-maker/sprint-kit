---
domain: user
type: entity
related_entities: [User, Tutor, RecruitTutor]
related_files:
  - src/main/java/com/speaking/podo/applications/user/domain/User.java
  - src/main/java/com/speaking/podo/applications/user/domain/Tutor.java
  - src/main/java/com/speaking/podo/applications/user/domain/RecruitTutor.java
keywords: [엔티티, 테이블, 필드, 관계]
last_verified: 2026-01-26
---

# 사용자 도메인 엔티티 설명

<!-- CONTEXT: domain=user, type=엔티티, keywords=User,Tutor,RecruitTutor -->

## 1. User (학생 엔티티)

📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/User.java`

### 1.1 테이블 정보

- **테이블명**: `GT_USER`
- **설명**: PODO 서비스를 이용하는 학생(수강생) 정보를 저장하는 핵심 엔티티
- **주요 기능**: 회원 정보 관리, 수강권 관리, 학습 이력 추적

### 1.2 필드 상세

#### 기본 식별자

| 필드명 | 타입 | 설명 | 제약 조건 |
|--------|------|------|-----------|
| `id` | Integer | 사용자 고유 ID (Primary Key) | AUTO_INCREMENT, NOT NULL |
| `userId` | String | 사용자 로그인 ID | - |
| `email` | String | 이메일 주소 (고유 식별자) | UNIQUE, NOT NULL |

**비즈니스 규칙:**
- `id`는 시스템 내부에서 사용하는 고유 번호
- `email`은 사용자 식별 및 로그인에 사용하는 비즈니스 키
- `userId`는 레거시 호환을 위한 필드 (선택적)

#### 개인 정보

| 필드명 | 타입 | 설명 | 제약 조건 |
|--------|------|------|-----------|
| `name` | String | 사용자 닉네임 | - |
| `realName` | String | 사용자 실명 | - |
| `phone` | String | 전화번호 | - |
| `password` | String | 암호화된 비밀번호 | `@JsonIgnore` (보안) |
| `gender` | Gender | 성별 (M/F/NONE) | Enum 타입 |

**비즈니스 규칙:**
- `name`은 앱에서 표시되는 닉네임 (변경 가능)
- `realName`은 법적 문서 및 본인 확인용 실명 (변경 불가)
- `password`는 JSON 직렬화 시 제외 (보안상 외부 노출 금지)

#### 학습 정보

| 필드명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| `lang` | Language | 학습 언어 (ENGLISH, CHINESE, JAPANESE 등) | - |
| `credit` | Integer | 수강권 잔액 | 0 |
| `classType` | String | 수강 중인 클래스 타입 (PODO, LEMONADE 등) | - |
| `maxPrestudySkip` | Integer | 사전학습 최대 스킵 가능 횟수 | - |

**비즈니스 규칙:**
- `credit`은 수업 예약 가능 횟수를 의미 (1 credit = 1회 수업)
- `lang`은 최근 선택한 학습 언어 (앱 재실행 시 기본값)
- `maxPrestudySkip`은 월별 초기화됨

#### 프로필 정보

| 필드명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| `profileImageUrl` | String | 프로필 썸네일 이미지 경로 | `default-profile-pic-thumb.jpg` |
| `profileOriginImageUrl` | String | 프로필 원본 이미지 경로 | `default-profile-pic.jpg` |

**비즈니스 규칙:**
- 썸네일은 목록 및 채팅에서 사용 (100x100)
- 원본은 프로필 상세 페이지에서 사용 (500x500)
- 기본 이미지는 시스템에서 제공

#### 마케팅 정보

| 필드명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| `referralType` | String | 유입 경로 타입 (FACEBOOK, INSTAGRAM, GOOGLE 등) | `PASS` |
| `referralDetail` | String | 유입 경로 상세 정보 | - |
| `recommendCode` | String | 친구 추천 코드 (고유) | AUTO (자동 생성) |
| `companyCode` | String | B2B 제휴 회사 코드 | - |

**비즈니스 규칙:**
- `referralType = "PASS"` → 유입 경로 미기재
- `recommendCode`는 회원가입 시 자동 생성 (8자리)
- `companyCode` 입력 시 제휴 혜택 자동 적용

#### 레거시 호환 (PHP 토큰)

| 필드명 | 타입 | 설명 | 제약 조건 |
|--------|------|------|-----------|
| `tokenForPhp` | String | PHP 서버용 Access Token | `@JsonIgnore` (보안) |
| `refreshTokenForPhp` | String | PHP 서버용 Refresh Token | `@JsonIgnore` (보안) |

**비즈니스 규칙:**
- 레거시 PHP 시스템과의 호환성 유지를 위한 필드
- 새로운 Spring Boot 서버에서는 별도 JWT 토큰 사용
- 마이그레이션 완료 후 제거 예정

#### 기타

| 필드명 | 타입 | 설명 | 제약 조건 |
|--------|------|------|-----------|
| `createAt` | LocalDateTime | 회원가입 일시 | AUTO (현재 시간) |
| `deviceToken` | String | 푸시 알림용 디바이스 토큰 | - |
| `roleType` | RoleType | 권한 타입 (USER, ADMIN 등) | `@Transient` (DB 미저장) |

**비즈니스 규칙:**
- `createAt`은 가입 시 자동 설정
- `deviceToken`은 로그인 시 클라이언트에서 전송
- `roleType`은 런타임 시 동적 할당 (DB에 별도 권한 테이블 존재)

### 1.3 관계 (Relationships)

#### 1:1 Tutor

```java
@OneToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "EMAIL", referencedColumnName = "EMAIL",
            insertable = false, updatable = false)
private Tutor tutor;
```

**설명:**
- User와 Tutor는 `email`로 연결
- 튜터가 학생으로 수업 수강 시 사용
- LAZY 로딩으로 성능 최적화

**비즈니스 시나리오:**
- 튜터 A가 다른 언어 학습을 위해 학생으로 등록
- 동일 이메일로 User + Tutor 두 엔티티 모두 존재 가능

#### 1:1 RecruitTutor

```java
@OneToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "PHONE", referencedColumnName = "PHONE",
            insertable = false, updatable = false)
private RecruitTutor recruitTutor;
```

**설명:**
- User와 RecruitTutor는 `phone`으로 연결
- 튜터 지원자가 학생으로 먼저 가입한 경우 매핑
- LAZY 로딩 사용

**비즈니스 시나리오:**
- 학생으로 가입 → 나중에 튜터 지원
- 동일 전화번호로 두 엔티티 연결

### 1.4 특수 어노테이션

#### @TemplateVariable

```java
@TemplateVariable({"beforeStudentId", "afterStudentId"})
private Integer id;

@TemplateVariable({"studentName", "beforeStudentName", "afterStudentName"})
private String realName;
```

**목적:**
- 이메일/SMS 템플릿에서 사용할 변수명 지정
- 예: "안녕하세요, {{studentName}}님!" → "안녕하세요, 홍길동님!"

**사용 예:**
- `beforeStudentName`: 수업 변경 전 학생 이름
- `afterStudentName`: 수업 변경 후 학생 이름

#### @DynamicInsert / @DynamicUpdate

```java
@DynamicInsert
@DynamicUpdate
public class User { ... }
```

**효과:**
- `@DynamicInsert`: INSERT 시 null이 아닌 필드만 SQL에 포함
- `@DynamicUpdate`: UPDATE 시 변경된 필드만 SQL에 포함

**장점:**
- DB 기본값 활용 가능 (예: `credit` 기본값 0)
- 불필요한 컬럼 업데이트 방지 (성능 향상)

### 1.5 생성자

```java
public User() {
    this.credit = 0;
}
```

**기본 생성자:**
- JPA 요구사항 (Hibernate가 리플렉션으로 사용)
- `credit` 초기값 명시적 설정 (DB 기본값 보험)

---

## 2. Tutor (튜터 엔티티)

📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/Tutor.java`

### 2.1 테이블 정보

- **테이블명**: `GT_TUTOR`
- **설명**: PODO에서 수업을 진행하는 튜터(강사) 정보를 저장하는 엔티티
- **주요 기능**: 튜터 프로필 관리, 활동 상태 관리, 매칭 정보 관리

### 2.2 필드 상세

#### 기본 식별자

| 필드명 | 타입 | 설명 | 제약 조건 |
|--------|------|------|-----------|
| `id` | Integer | 튜터 고유 ID (Primary Key) | AUTO_INCREMENT, NOT NULL |
| `userId` | String | 튜터 로그인 ID | - |
| `email` | String | 이메일 주소 | `@JsonIgnore` (중복 방지) |

**비즈니스 규칙:**
- `email`은 User 엔티티 조회 시 중복 출력 방지를 위해 `@JsonIgnore`
- Tutor는 User와 별도로 존재할 수도 있음 (튜터 전용 계정)

#### 개인 정보

| 필드명 | 타입 | 설명 | 제약 조건 |
|--------|------|------|-----------|
| `name` | String | 튜터 닉네임 | - |
| `realName` | String | 튜터 실명 | `@TemplateVariable` |
| `phone` | String | 전화번호 | - |
| `gender` | Gender | 성별 (M/F/NONE) | Enum 타입 |

#### 튜터 활동 상태

| 필드명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| `type` | TutorType | 튜터 등급 (P/W/A/S/D) | `P` |
| `classPause` | Boolean | 수업 일시정지 여부 | `false` (`N`) |
| `todayClassYn` | Boolean | 오늘 수업 여부 | `false` (`N`) |
| `userReceiveYn` | Boolean | 신규 학생 수락 여부 | `true` (`Y`) |
| `canTakeClass` | Boolean | 수업 가능 여부 | - |
| `canUse` | Boolean | 튜터 사용 가능 여부 (활성화) | `true` (`Y`) |
| `podoClassYn` | Boolean | PODO 클래스 진행 가능 여부 | `true` (`Y`) |

**TutorType 설명:**
- **P (Prepare)**: 준비 중 (아직 수업 불가)
- **W (Wait)**: 대기 중 (승인 대기)
- **A (Active)**: 활동 중 (일반 튜터)
- **S (Special)**: 우수 튜터 (5.0 평점 이상)
- **D (Deleted)**: 삭제됨 (퇴사)

**비즈니스 규칙:**
- `canTakeClass = true` 이고 `canUse = true` 일 때만 매칭 가능
- `classPause = true` 이면 일시적으로 신규 예약 차단
- `userReceiveYn = false` 이면 기존 학생만 수업 가능

#### 튜터 프로필

| 필드명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| `country` | CountryType | 국가 (US, UK, PH, KR 등) | - |
| `profileSmallImage` | String | 프로필 작은 이미지 경로 | - |
| `profileLargeImage` | String | 프로필 큰 이미지 경로 | - |
| `hashTag` | Collection<String> | 튜터 특징 해시태그 목록 | - |
| `badge` | String | 튜터 뱃지 (인증, 우수 등) | - |
| `youtube` | String | 튜터 소개 유튜브 링크 | - |

**hashTag 예시:**
```json
["친절한", "발음완벽", "초보환영", "비즈니스영어"]
```

**비즈니스 규칙:**
- `hashTag`는 최대 5개까지 설정 가능
- `badge`는 시스템에서 자동 부여 (수동 설정 불가)

#### 튜터 언어 정보

| 필드명 | 타입 | 설명 | 설명 |
|--------|------|------|------|
| `language` | Language | 튜터 담당 언어 (ENGLISH, CHINESE 등) | - |
| `levTeacher` | String | 튜터 레벨 (초급/중급/고급) | - |

**비즈니스 규칙:**
- 1명의 튜터는 1개 언어만 담당 (다언어 튜터는 별도 계정)
- `levTeacher`는 레거시 필드 (현재는 `tutorLevelId` 사용)

#### 튜터 매칭 정보

| 필드명 | 타입 | 설명 | 설명 |
|--------|------|------|------|
| `matchInfoJson` | String | 매칭 참고 정보 (JSON 형식) | - |
| `classType` | String | 진행 가능한 클래스 타입 | - |
| `koreanAvailable` | Boolean | 한국어 소통 가능 여부 | - |
| `tutorLevelId` | Integer | 튜터 레벨 ID (외래키) | - |
| `tutorCurriculums` | String | 진행 가능한 커리큘럼 목록 | - |
| `customMatchingValue` | Float | 커스텀 매칭 가중치 | - |
| `allowLessonOneHourBefore` | Boolean | 1시간 전 예약 허용 여부 | `false` (`N`) |

**matchInfoJson 예시:**
```json
{
  "preferredAge": "20-30",
  "preferredGender": "F",
  "specialization": "Business English"
}
```

**비즈니스 규칙:**
- `customMatchingValue` 높을수록 우선 매칭 (1.0 = 기본값)
- `koreanAvailable = true` → 한국어로 수업 진행 가능
- `allowLessonOneHourBefore = true` → 급하게 예약 가능

#### 튜터 자격 정보

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `certificate` | String | 자격증 목록 | "TESOL, TEFL" |
| `education` | String | 학력 정보 | "서울대학교 영문학과 졸업" |
| `workExperience` | String | 경력 정보 | "5년차 영어 강사" |
| `tutorIntro` | String | 튜터 자기소개 | "안녕하세요! ..." |

**비즈니스 규칙:**
- `certificate`는 쉼표로 구분된 문자열 (향후 JSON 변환 예정)
- 자격 정보는 튜터 승인 시 검증

#### 기타

| 필드명 | 타입 | 설명 | 설명 |
|--------|------|------|------|
| `memo` | String | 관리자 메모 (내부용) | - |
| `countryType` | String | 국가 타입 (레거시) | - |

### 2.3 특수 어노테이션

#### @Convert 커스텀 컨버터

```java
@Convert(converter = TutorTypeConverter.class)
private TutorType type;

@Convert(converter = TutorCountryTypeConverter.class)
private CountryType country;

@Convert(converter = TutorHashtagConverter.class)
private Collection<String> hashTag;
```

**목적:**
- DB 저장 형식과 Java 객체 형식 변환
- `TutorType`: "A" ↔ `TutorType.ACTIVE`
- `hashTag`: "친절한,발음완벽" ↔ `["친절한", "발음완벽"]`

#### @BooleanToStringConverter

```java
@Convert(converter = BooleanToStringConverter.class)
@Column(name = "CLASS_PAUSE_YN")
private Boolean classPause;
```

**변환 규칙:**
- `true` ↔ `"Y"`
- `false` ↔ `"N"`

**이유:**
- 레거시 DB는 Boolean을 CHAR(1) 'Y'/'N'으로 저장

### 2.4 관계 (Relationships)

Tutor 엔티티는 다른 엔티티와의 명시적 관계가 없습니다.
- User와의 관계는 User 엔티티에서 정의
- Class, Schedule 등과의 관계는 외래키로 참조

---

## 3. RecruitTutor (튜터 지원자 엔티티)

📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/RecruitTutor.java`

### 3.1 테이블 정보

- **테이블명**: `GT_RECRUIT_TUTOR`
- **설명**: 튜터 채용에 지원한 예비 튜터 정보를 저장하는 엔티티
- **주요 기능**: 튜터 지원자 관리, 승인 프로세스 추적

### 3.2 필드 상세

#### 기본 정보

| 필드명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| `id` | Integer | 지원자 고유 ID (Primary Key) | AUTO_INCREMENT |
| `email` | String | 이메일 주소 | - |
| `phone` | String | 전화번호 | - |
| `credit` | Integer | 초기 수강권 (테스트용) | 1 |

**비즈니스 규칙:**
- 튜터 지원 시 지원자 정보 저장
- 승인 후 Tutor 엔티티로 변환
- 미승인 지원자는 RecruitTutor에만 존재

### 3.3 향후 확장 예정

**주석:**
```java
// 필요한 값이 있을 때 추가하기
```

**확장 가능 필드:**
- 지원 동기 (motivation)
- 이력서 URL (resumeUrl)
- 경력 기술서 (careerDescription)
- 승인 상태 (approvalStatus)
- 지원 일시 (appliedAt)
- 승인 일시 (approvedAt)

**비즈니스 시나리오:**
1. 지원자가 튜터 지원 → RecruitTutor 생성
2. 관리자가 심사 → 승인 상태 업데이트
3. 승인 완료 → Tutor 엔티티 생성
4. RecruitTutor는 보관 (재지원 방지)

---

## 4. 엔티티 간 관계 다이어그램

```
┌─────────────────┐
│  RecruitTutor   │
│  (튜터 지원자)   │
└────────┬────────┘
         │ 1:1 (phone)
         │
┌────────┴────────┐         ┌─────────────────┐
│      User       │ 1:1     │      Tutor      │
│    (학생)       ├─────────┤    (튜터)       │
│                 │ (email) │                 │
└─────────────────┘         └─────────────────┘
         │                           │
         │ N:1                       │ N:1
         │                           │
┌────────┴────────┐         ┌────────┴────────┐
│     Class       │         │    Schedule     │
│    (수업)       │         │   (튜터 일정)    │
└─────────────────┘         └─────────────────┘
```

**관계 설명:**
- User ↔ Tutor: 이메일로 1:1 매핑 (튜터가 학생 수업 수강 시)
- User ↔ RecruitTutor: 전화번호로 1:1 매핑 (학생이 나중에 튜터 지원 시)
- User → Class: 학생이 여러 수업 수강 (N:1)
- Tutor → Schedule: 튜터가 여러 일정 등록 (N:1)

---

## 5. 데이터베이스 제약 조건

### 5.1 User 테이블

```sql
CREATE TABLE GT_USER (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EMAIL VARCHAR(255) UNIQUE NOT NULL,
    NAME VARCHAR(100),
    REAL_NAME VARCHAR(100),
    PHONE VARCHAR(20),
    CREDIT INT DEFAULT 0,
    RECOMMEND_CODE VARCHAR(8) UNIQUE NOT NULL,
    CREATE_DATE DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- 기타 컬럼 생략
    INDEX idx_email (EMAIL),
    INDEX idx_phone (PHONE),
    INDEX idx_recommend_code (RECOMMEND_CODE)
);
```

**인덱스:**
- `EMAIL`: 로그인 및 조회 성능 향상
- `PHONE`: RecruitTutor 조인 성능 향상
- `RECOMMEND_CODE`: 추천 코드 조회 성능 향상

### 5.2 Tutor 테이블

```sql
CREATE TABLE GT_TUTOR (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EMAIL VARCHAR(255),
    TUTOR_GRADE CHAR(1) DEFAULT 'P',
    USE_YN CHAR(1) DEFAULT 'Y',
    CLASS_PAUSE_YN CHAR(1) DEFAULT 'N',
    CUSTOM_WEIGHT FLOAT DEFAULT 1.0,
    -- 기타 컬럼 생략
    INDEX idx_email (EMAIL),
    INDEX idx_type_use (TUTOR_GRADE, USE_YN),
    INDEX idx_language (TUTOR_TYPE)
);
```

**인덱스:**
- `EMAIL`: User 조인 성능 향상
- `TUTOR_GRADE, USE_YN`: 매칭 쿼리 성능 향상 (복합 인덱스)
- `TUTOR_TYPE`: 언어별 튜터 조회 성능 향상

### 5.3 RecruitTutor 테이블

```sql
CREATE TABLE GT_RECRUIT_TUTOR (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EMAIL VARCHAR(255),
    PHONE VARCHAR(20),
    CREDIT INT DEFAULT 1,
    INDEX idx_phone (PHONE)
);
```

**인덱스:**
- `PHONE`: User 조인 성능 향상

---

## 6. 주의사항 및 베스트 프랙티스

### 6.1 N+1 문제 방지

**문제 상황:**
```java
List<User> users = userRepository.findAll();
for (User user : users) {
    Tutor tutor = user.getTutor(); // N+1 쿼리 발생!
}
```

**해결 방법:**
```java
List<User> users = userRepository.findAllWithTutor(); // JOIN FETCH 사용
```

### 6.2 Boolean 타입 주의

**DB 저장 형식:**
- User: `Boolean` → DB는 `TINYINT(1)` (0/1)
- Tutor: `Boolean` → DB는 `CHAR(1)` (Y/N) + `@Convert` 필요

**권장 사항:**
- 신규 컬럼은 `TINYINT(1)` 사용 (표준)
- 레거시 컬럼은 컨버터 유지 (호환성)

### 6.3 Enum 타입 사용

**나쁜 예:**
```java
@Column(name = "TUTOR_GRADE")
private String type; // "A", "S", "D" 등 매직 스트링
```

**좋은 예:**
```java
@Convert(converter = TutorTypeConverter.class)
@Column(name = "TUTOR_GRADE")
private TutorType type; // Enum으로 타입 안전성 확보
```

### 6.4 보안 필드 처리

**비밀번호 및 토큰:**
```java
@JsonIgnore
@Column(name = "USER_PW")
private String password;

@JsonIgnore
@Column(name = "ACCESS_TOKEN")
private String tokenForPhp;
```

**규칙:**
- 민감 정보는 반드시 `@JsonIgnore` 처리
- API 응답에 절대 포함되지 않도록 주의

### 6.5 이미지 경로 저장

**권장 방식:**
- 상대 경로만 저장: `"profiles/user123.jpg"`
- CDN 도메인은 클라이언트에서 추가

**장점:**
- CDN 변경 시 DB 수정 불필요
- 환경별 (dev/prod) 유연한 대응

---

## 7. 마이그레이션 가이드

### 7.1 레거시 필드 제거 계획

**제거 예정 필드:**
- `User.tokenForPhp`
- `User.refreshTokenForPhp`
- `User.userId` (email로 통일)
- `Tutor.levTeacher` (tutorLevelId로 대체)
- `Tutor.countryType` (country로 대체)

**제거 절차:**
1. 새 필드로 데이터 마이그레이션
2. 2주간 모니터링
3. 레거시 필드를 `@Deprecated` 처리
4. 1개월 후 완전 제거

### 7.2 신규 필드 추가 시 주의사항

**체크리스트:**
- [ ] DB 마이그레이션 스크립트 작성
- [ ] 기본값 설정 (`@ColumnDefault` 또는 생성자)
- [ ] 기존 데이터 마이그레이션 계획
- [ ] API 문서 업데이트
- [ ] 단위 테스트 작성

**예시:**
```java
// 신규 필드 추가
@Column(name = "BIRTH_DATE")
private LocalDate birthDate;

// 기존 데이터 처리를 위한 기본값
public LocalDate getBirthDate() {
    return birthDate != null ? birthDate : LocalDate.of(1990, 1, 1);
}
```
