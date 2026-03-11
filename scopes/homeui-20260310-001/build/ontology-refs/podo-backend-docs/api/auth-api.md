---
domain: api
type: endpoint
related_files:
  - src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java
  - src/main/java/com/speaking/podo/applications/auth/gateway/AuthGateway.java
  - src/main/java/com/speaking/podo/applications/auth/service/InternalTokenService.java
  - src/main/java/com/speaking/podo/applications/auth/service/RefreshTokenService.java
  - src/main/java/com/speaking/podo/applications/auth/service/AuthSidService.java
  - src/main/java/com/speaking/podo/applications/auth/service/OAuthStateService.java
keywords: [auth, 인증, OAuth, 토큰, JWT, refresh, login, 로그인]
last_verified: 2026-01-26
---

# 인증 API

## 엔드포인트 목록

### 1. OAuth 인증 플로우

#### GET /api/v1/auth/{provider}/authorize
- **설명**: OAuth 인증 URL 생성 및 리다이렉트
- **인증**: 불필요
- **경로 파라미터**:
  - `provider` (String): OAuth 제공자 (google, kakao, naver, apple 등)
- **쿼리 파라미터**:
  - `is_sdk` (Boolean, optional): SDK 모드 여부 (true면 JSON 응답, false면 리다이렉트)
  - 기타 provider별 파라미터
- **응답**:
  - `is_sdk=false`: HTTP 302 리다이렉트 (OAuth 제공자 로그인 페이지로)
  - `is_sdk=true`: JSON `AuthorizeContext` (authorizeUrl 포함)
```json
{
  "success": true,
  "data": {
    "authorizeUrl": "https://oauth.provider.com/authorize?...",
    "state": "random_state_string"
  }
}
```
- **관련 정책**: OAuth 2.0 Authorization Code Flow
- **파일**: `AuthController.java:46-58`

#### GET /api/v1/auth/{provider}/callback
- **설명**: OAuth 콜백 처리 및 토큰 발급
- **인증**: 불필요
- **경로 파라미터**:
  - `provider` (OauthProvider): OAuth 제공자
- **쿼리 파라미터**:
  - `code` (String): Authorization Code
  - `state` (String): CSRF 방지용 state
  - `error` (String, optional): 에러 코드
  - `error_description` (String, optional): 에러 설명
- **응답**:
  - 리다이렉트 또는 `PodoResponse<SocialLoginResponse>`
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "id": 123,
      "email": "user@example.com",
      "name": "홍길동"
    }
  }
}
```
- **헤더**:
  - `Authorization`: Bearer {accessToken}
  - `Refresh-Token`: {refreshToken}
- **관련 정책**: OAuth 콜백, 자동 회원가입, JWT 발급
- **파일**: `AuthController.java:60-74`

### 2. 토큰 관리

#### POST /api/v1/auth/internal/access-token
- **설명**: 내부 서버용 단기 Access Token 발급 (30분)
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `X-Podo-Header`: podo-server
  - `Authorization`: Basic cG9kbzpwb2Rv
- **요청 바디**: `InternalTokenRequest`
```json
{
  "userId": 123
}
```
- **응답**: `PodoResponse<TokenResponse>`
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 1800
  }
}
```
- **헤더**:
  - `Authorization`: Bearer {accessToken}
  - `Refresh-Token`: {refreshToken}
- **관련 정책**: 내부 서버 간 인증, 30분 만료
- **파일**: `AuthController.java:76-92`

#### POST /api/v1/auth/refresh
- **설명**: Refresh Token으로 새 Access Token 발급
- **인증**: 불필요 (Refresh Token 필요)
- **요청 바디**: `TokenRefreshRequest`
```json
{
  "refreshToken": "jwt_refresh_token"
}
```
- **응답**: `PodoResponse<TokenResponse>`
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token",
    "expiresIn": 3600
  }
}
```
- **헤더**:
  - `Authorization`: Bearer {accessToken}
  - `Refresh-Token`: {refreshToken}
- **관련 정책**: Refresh Token Rotation, Access Token 갱신
- **파일**: `AuthController.java:94-105`

### 3. 토큰 검증

#### POST /api/v1/auth/introspect
- **설명**: JWT 토큰 검증 및 메타데이터 조회
- **인증**: 불필요
- **요청 바디**: `TokenValidationRequest`
```json
{
  "token": "jwt_token_to_validate"
}
```
- **응답**: `PodoResponse<Map<String, Object>>`
```json
{
  "success": true,
  "data": {
    "active": true,
    "sub": "123",
    "iat": 1706227200,
    "exp": 1706230800
  }
}
```
- **응답 필드**:
  - `active` (Boolean): 토큰 유효 여부
  - `sub` (String): 사용자 ID
  - `iat` (Long): 발급 시간 (Unix timestamp)
  - `exp` (Long): 만료 시간 (Unix timestamp)
- **관련 정책**: JWT 토큰 검증, RFC 7662 (OAuth Token Introspection)
- **파일**: `AuthController.java:107-132`

### 4. Session ID 교환

#### GET /api/v1/auth/exchange
- **설명**: Session ID (SID)를 JWT 토큰으로 교환
- **인증**: 불필요
- **쿼리 파라미터**:
  - `sid` (String): Session ID
- **응답**: `PodoResponse<SocialLoginResponse>`
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": { ... }
  }
}
```
- **헤더**:
  - `Authorization`: Bearer {accessToken}
  - `Refresh-Token`: {refreshToken}
- **관련 정책**: SID 기반 인증 (레거시 시스템 호환)
- **파일**: `AuthController.java:134-140`

## 인증 플로우

### OAuth 로그인 플로우
```
1. Client → GET /auth/{provider}/authorize
2. Server → 302 Redirect to OAuth Provider
3. User → Login at OAuth Provider
4. OAuth Provider → 302 Redirect to /auth/{provider}/callback?code=...
5. Server → Exchange code for access token
6. Server → Get user info from OAuth Provider
7. Server → Create/Update user in DB
8. Server → Issue JWT tokens
9. Server → 302 Redirect or JSON Response with tokens
```

### Token Refresh 플로우
```
1. Client → POST /auth/refresh (with refreshToken)
2. Server → Validate refreshToken
3. Server → Issue new accessToken and refreshToken
4. Server → Rotate refreshToken (old token invalidated)
5. Server → Return new tokens
```

### Introspection 플로우
```
1. Client/Server → POST /auth/introspect (with token)
2. Server → Decode and validate JWT
3. Server → Return token metadata
```

## 관련 서비스

### AuthGateway
- 인증 비즈니스 로직 게이트웨이
- 주요 메서드: `authorize()`, `handleCallback()`, `refreshTokens()`, `exchange()`

### InternalTokenService
- 내부 서버용 단기 토큰 발급 (30분)

### RefreshTokenService
- Refresh Token 관리 및 Rotation

### AuthSidService
- Session ID 관리 및 교환

### OAuthStateService
- OAuth state 파라미터 관리 (CSRF 방지)

## 주요 정책

1. **OAuth 2.0**: Authorization Code Flow 사용
2. **JWT**: Access Token과 Refresh Token 모두 JWT 형식
3. **Token Rotation**: Refresh Token 사용 시 새 Refresh Token 발급 (기존 토큰 무효화)
4. **만료 시간**:
   - Access Token: 1시간
   - Refresh Token: 14일
   - Internal Access Token: 30분
5. **자동 회원가입**: OAuth 콜백 시 신규 사용자 자동 생성
6. **CSRF 방지**: OAuth state 파라미터 검증
7. **Basic Auth**: 내부 서버용 API는 Basic Auth (podo:podo) 사용

## 지원하는 OAuth Provider
- Google
- Kakao
- Naver
- Apple
- 기타 (확장 가능)

## 에러 코드
- `401 Unauthorized`: 인증 실패, 토큰 만료/무효
- `403 Forbidden`: 권한 없음
- `400 Bad Request`: 잘못된 요청 파라미터
