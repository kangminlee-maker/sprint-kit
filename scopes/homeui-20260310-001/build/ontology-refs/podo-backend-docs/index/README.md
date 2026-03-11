---
domain: index
type: overview
last_verified: 2026-01-26
---

# PODO Backend 파일 인덱스

## 목적
PODO 백엔드 코드베이스의 파일들을 다양한 관점으로 인덱싱하여 빠른 탐색을 지원합니다.

## 인덱스 종류

### 1. 도메인별 인덱스
- [도메인별 파일 인덱스](./by-domain.md)
- 비즈니스 도메인(User, Auth, Ticket, Lecture, Payment, Coupon 등)별로 관련 파일 분류
- 새로운 기능 개발 시 해당 도메인의 파일들을 빠르게 찾을 수 있음

### 2. 엔티티별 인덱스
- [엔티티별 파일 인덱스](./by-entity.md)
- DB 엔티티(테이블) 중심으로 관련 파일 분류
- 엔티티 → Repository → Service → Controller 흐름 추적

### 3. 컨트롤러별 인덱스
- [컨트롤러별 파일 인덱스](./by-controller.md)
- REST API 컨트롤러별로 의존하는 파일들 정리
- API 엔드포인트 수정 시 영향 범위 파악

## 인덱스 사용법

### 케이스 1: 새로운 기능 개발
```
1. 도메인별 인덱스에서 관련 도메인 찾기
2. 해당 도메인의 파일 구조 파악
3. 기존 패턴을 따라 신규 파일 생성
```

### 케이스 2: API 버그 수정
```
1. 컨트롤러별 인덱스에서 해당 API 찾기
2. Controller → Gateway → Service → Repository 순으로 추적
3. 문제 지점 특정 및 수정
```

### 케이스 3: DB 스키마 변경
```
1. 엔티티별 인덱스에서 변경할 엔티티 찾기
2. 영향받는 모든 파일 확인
3. 엔티티 → Repository → Service → Controller 순으로 수정
```

### 케이스 4: 리팩토링
```
1. 도메인별 인덱스로 리팩토링 범위 파악
2. 엔티티별 인덱스로 데이터 레이어 변경 사항 확인
3. 컨트롤러별 인덱스로 API 레이어 영향 파악
```

## 파일 경로 규칙

### 기본 경로
```
src/main/java/com/speaking/podo/applications/{domain}/
```

### 도메인 구조
```
{domain}/
├── controller/          # REST API 컨트롤러
│   ├── {Domain}Controller.java
│   └── {Domain}ControllerV2.java
├── gateway/             # 비즈니스 로직 게이트웨이
│   └── {Domain}Gateway.java
├── service/             # 서비스 레이어
│   ├── command/         # CUD 작업
│   ├── query/           # Read 작업
│   └── external/        # 외부 서비스 호출
├── repository/          # 데이터 접근 레이어
│   ├── {Entity}Repository.java
│   ├── {Entity}DslRepository.java
│   └── {Entity}DslRepositoryImpl.java
├── entity/              # JPA 엔티티
│   └── {Entity}Entity.java
├── dto/                 # DTO
│   ├── request/
│   └── response/
├── domain/              # 도메인 모델 (DDD)
│   ├── model/
│   ├── action/
│   └── serialize/
├── usecase/             # Use Case (DDD)
└── delivery/            # Delivery Layer (DDD)
```

## 아키텍처 패턴

### 레이어 구조
```
Controller (REST API)
    ↓
Gateway (비즈니스 로직 조합)
    ↓
Service (단일 비즈니스 로직)
    ↓
Repository (데이터 접근)
    ↓
Entity (DB 엔티티)
```

### 네이밍 규칙
- **Controller**: `{Domain}Controller.java`, `{Domain}ControllerV2.java`
- **Gateway**: `{Domain}Gateway.java`
- **Service**: `{Domain}Service.java`, `{Feature}CommandService.java`, `{Feature}QueryService.java`
- **Repository**: `{Entity}Repository.java`, `{Entity}DslRepository.java`
- **Entity**: `{Entity}Entity.java` (POJO Entity인 경우 Entity 접미사 생략)
- **DTO**: `{Feature}DTO.java`, `{Feature}ReqDto.java`, `{Feature}GetDto.java`

## 참고사항

### Interface 지양
- DTO Projection용 Interface 사용 금지
- 서비스 레이어에서 불필요한 Interface 생성 금지
- 기존 서비스에 메소드 추가하는 방식 선호

### Native Query 지양
- 특별한 경우가 아니라면 사용 금지
- QueryDSL 사용 권장
- 복잡한 필터링/그룹핑은 Stream API 활용

### JDK 25 / Spring Boot 3.5.x 문법
- `Collectors.toList()` 대신 `toList()` 사용
- Pattern matching for instanceof 사용
- var 키워드 적절히 활용

## 업데이트 정책
이 인덱스는 정기적으로 업데이트되어야 합니다.
- 새로운 파일 추가 시
- 파일 경로 변경 시
- 도메인 구조 변경 시

최종 업데이트: 2026-01-26
