---
domain: user
type: overview
related_entities: [User, Tutor, RecruitTutor]
related_files:
  - src/main/java/com/speaking/podo/applications/user/domain/User.java
  - src/main/java/com/speaking/podo/applications/user/domain/Tutor.java
  - src/main/java/com/speaking/podo/applications/user/controller/UserController.java
  - src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java
keywords: [사용자, 회원, 튜터, 학생, 인증]
last_verified: 2026-01-26
---

# 사용자 도메인 개요

<!-- CONTEXT: domain=user, type=개요, keywords=사용자,회원,튜터,학생 -->

## 도메인 설명

사용자 도메인은 PODO 플랫폼의 **회원 관리 및 인증**을 담당하는 핵심 도메인입니다. 학생(Student)과 튜터(Tutor) 두 가지 사용자 유형을 관리하며, 소셜 로그인(OAuth), 회원가입, 프로필 관리, 사용자 상태 추적 등의 기능을 제공합니다.

## 주요 엔티티

### 1. User (학생)
📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/User.java`

PODO 서비스를 이용하는 **학생(수강생)** 정보를 저장하는 핵심 엔티티입니다.

**핵심 속성:**
- 기본 정보: 이름, 이메일, 전화번호, 성별
- 학습 정보: 학습 언어(`lang`), 수강권(`credit`), 클래스 타입
- 프로필: 프로필 이미지(썸네일/원본)
- 추천/제휴: 추천 코드(`recommendCode`), 회사 코드(`companyCode`)
- 마케팅: 유입 경로(`referralType`, `referralDetail`)

**관계:**
- Tutor와 1:1 관계 (이메일 기준 매핑) - 튜터가 학생으로 전환 시 사용
- RecruitTutor와 1:1 관계 (전화번호 기준 매핑) - 튜터 채용 지원자 정보

### 2. Tutor (튜터)
📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/Tutor.java`

PODO에서 수업을 제공하는 **튜터(강사)** 정보를 저장하는 엔티티입니다.

**핵심 속성:**
- 기본 정보: 이름, 이메일, 전화번호, 성별
- 튜터 등급: `type` (P=준비중, W=대기, A=활동중, S=우수, D=삭제)
- 활동 상태: 수업 가능 여부, 오늘 수업 여부, 학생 수락 여부
- 프로필: 국가, 프로필 이미지, 해시태그, 뱃지, 유튜브
- 언어: 담당 언어(`language`), 한국어 가능 여부
- 매칭 정보: 커리큘럼, 수업 타입, 자격증, 학력

### 3. RecruitTutor (튜터 지원자)
📁 파일: `src/main/java/com/speaking/podo/applications/user/domain/RecruitTutor.java`

튜터 채용에 지원한 **예비 튜터** 정보를 저장하는 엔티티입니다.

## 주요 기능

### 1. 회원 가입 및 인증
📁 파일: `src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java`

- **소셜 로그인 지원**: KAKAO, GOOGLE, PODO, TUTOR
- **OAuth 2.0 플로우**: authorize → callback → token 발급
- **토큰 관리**: Access Token, Refresh Token 발급 및 갱신
- **토큰 검증**: JWT 기반 토큰 검증 (introspect)

### 2. 사용자 정보 관리
📁 파일: `src/main/java/com/speaking/podo/applications/user/controller/UserController.java`

- **프로필 조회/수정**: 사용자 정보 조회 및 업데이트
- **언어 설정**: 학습 언어 선택 및 변경
- **프로필 이미지**: 이미지 업로드 및 관리
- **추천 코드**: 친구 추천 코드 발급 및 관리

### 3. 학습 관련 기능
- **수강권 관리**: credit(수강권) 지급 및 차감
- **사전 학습 건너뛰기**: 최대 건너뛰기 횟수 관리 (`maxPrestudySkip`)
- **체험 수업**: 체험 수업 단계(step) 추적 및 관리

### 4. 페널티 및 홀딩 관리
- **페널티 조회**: 사용자의 페널티 내역 조회
- **홀딩 조회**: 사용자의 홀딩(일시정지) 내역 조회

### 5. 디바이스 관리
- **디바이스 토큰**: 푸시 알림을 위한 디바이스 토큰 등록

## API 엔드포인트 구조

```
/api/v1/auth
├── /{provider}/authorize     # 소셜 로그인 시작
├── /{provider}/callback      # 소셜 로그인 콜백
├── /refresh                  # 토큰 갱신
└── /introspect               # 토큰 검증

/api/v1/user
├── /podo/isExists            # 계정 존재 여부 확인
├── /podo                     # 계정 생성 (POST)
├── /podo/getInfo             # 계정 정보 조회
├── /podo/user/me             # 내 정보 조회
├── /podo/user                # 사용자 정보 수정 (PUT)
├── /getTutor                 # 튜터 정보 조회
└── /podo/device-token        # 디바이스 토큰 등록

/api/v2/user
└── /getTutor                 # 튜터 정보 조회 (v2)
```

## 비즈니스 규칙

### 1. 사용자 식별
- **학생**: `email`을 고유 식별자로 사용
- **튜터**: `email`을 고유 식별자로 사용
- **연동**: User와 Tutor는 email로 1:1 매핑 가능

### 2. 인증 방식
- **소셜 로그인**: KAKAO, GOOGLE 지원
- **내부 인증**: PODO, TUTOR 자체 인증
- **토큰 기반**: JWT Access Token + Refresh Token

### 3. 수강권 시스템
- **초기 수강권**: 신규 가입 시 0개
- **수강권 사용**: 수업 예약 시 차감
- **수강권 지급**: 결제, 프로모션 등을 통해 지급

### 4. 프로필 이미지
- **기본 이미지**: `default-profile-pic-thumb.jpg`, `default-profile-pic.jpg`
- **썸네일/원본**: 2가지 크기 저장

## 관련 도메인

- **Auth 도메인**: 인증 및 토큰 관리 (OAuth, JWT)
- **Class 도메인**: 수업 예약 및 수강권 차감
- **Payment 도메인**: 결제를 통한 수강권 지급
- **Matching 도메인**: 튜터 매칭 시 튜터 정보 참조

## 참고 문서

- [사용자 정책 상세](./policies.md)
- [엔티티 설명](./entities.md)
