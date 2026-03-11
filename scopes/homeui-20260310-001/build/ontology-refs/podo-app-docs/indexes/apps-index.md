# Apps Index - Podo Service

모든 앱의 주요 파일 경로 인덱스

## apps/web - Next.js 15 Web App

### Core Files
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/layout.tsx` | 루트 레이아웃 | root, layout, providers |
| `~/podo-app-DOC/apps/web/src/middleware.ts` | 미들웨어 체이닝 (nativeStore → session → GA4 → protectedRoute) | middleware, auth, session |
| `~/podo-app-DOC/apps/web/src/instrumentation.ts` | 서버 계측 설정 | instrumentation, monitoring |
| `~/podo-app-DOC/apps/web/src/instrumentation-client.ts` | 클라이언트 계측 설정 | client, monitoring, datadog |

### Routes - Internal (인증 필요)
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/(internal)/page.tsx` | `/` | 루트 리다이렉트 | root, redirect |
| `~/podo-app-DOC/apps/web/src/app/(internal)/home/page.tsx` | `/home` | 홈 페이지 | home, main |
| `~/podo-app-DOC/apps/web/src/app/(internal)/home/ai/page.tsx` | `/home/ai` | AI 홈 | ai-home, character-chat |
| `~/podo-app-DOC/apps/web/src/app/(internal)/login/page.tsx` | `/login` | 로그인 | login, oauth, kakao, apple |
| `~/podo-app-DOC/apps/web/src/app/(internal)/booking/page.tsx` | `/booking` | 수업 예약 | booking, reservation, schedule |
| `~/podo-app-DOC/apps/web/src/app/(internal)/reservation/page.tsx` | `/reservation` | 예약 관리 | reservation, booking-list |
| `~/podo-app-DOC/apps/web/src/app/(internal)/ai-learning/page.tsx` | `/ai-learning` | AI 학습 | ai-learning, character-chat |

### Routes - Lessons
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/regular/page.tsx` | `/lessons/regular` | 정규 수업 목록 | regular-lessons, tutor |
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/trial/page.tsx` | `/lessons/trial` | 체험 수업 목록 | trial-lessons |
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/ai/page.tsx` | `/lessons/ai` | AI 수업 목록 | ai-lessons, character-chat |
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/ai/[classCourseId]/page.tsx` | `/lessons/ai/:id` | AI 수업 상세 | ai-lesson-detail |
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/ai/trial-report/[uuid]/page.tsx` | `/lessons/ai/trial-report/:uuid` | AI 체험 리포트 | ai-trial-report |
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/classroom/[classID]/page.tsx` | `/lessons/classroom/:id` | 교실 (튜터 수업 진행) | classroom, live-lesson |
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/classroom/[classID]/report/page.tsx` | `/lessons/classroom/:id/report` | 수업 리포트 | lesson-report |
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/classroom/[classID]/review/page.tsx` | `/lessons/classroom/:id/review` | 수업 리뷰 작성 | lesson-review, feedback |
| `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/classroom/[classID]/review-complete/page.tsx` | `/lessons/classroom/:id/review-complete` | 리뷰 완료 | review-complete |

### Routes - Subscribes (구독/이용권)
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/page.tsx` | `/subscribes` | 이용권 구매 메인 | subscribes, tickets, purchase |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/tickets/page.tsx` | `/subscribes/tickets` | 이용권 목록 | tickets, products |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/tickets-v2/page.tsx` | `/subscribes/tickets-v2` | 이용권 목록 v2 | tickets-v2 |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/tickets/smart-talk/page.tsx` | `/subscribes/tickets/smart-talk` | 스마트톡 이용권 | smart-talk, character-chat |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/tickets/payback/page.tsx` | `/subscribes/tickets/payback` | 환급 이용권 | payback |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/trial/page.tsx` | `/subscribes/trial` | 체험 구독 | trial-subscribe |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/trial/smart-talk/page.tsx` | `/subscribes/trial/smart-talk` | 스마트톡 체험 | smart-talk-trial |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/trial/smart-talk/[subscribeId]/page.tsx` | `/subscribes/trial/smart-talk/:id` | 스마트톡 체험 결제 | smart-talk-trial-payment |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/page.tsx` | `/subscribes/payment/:id` | 결제 페이지 | payment, checkout |
| `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/success/page.tsx` | `/subscribes/payment/:id/success` | 결제 성공 | payment-success |

### Routes - My Podo (마이페이지)
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/page.tsx` | `/my-podo` | 마이페이지 메인 | mypage, profile |
| `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/coupon/page.tsx` | `/my-podo/coupon` | 쿠폰 목록 | coupons |
| `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/coupon/[id]/page.tsx` | `/my-podo/coupon/:id` | 쿠폰 상세 | coupon-detail |
| `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/notices/page.tsx` | `/my-podo/notices` | 공지사항 목록 | notices |
| `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/notices/[boardId]/page.tsx` | `/my-podo/notices/:id` | 공지사항 상세 | notice-detail |
| `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/notification-settings/page.tsx` | `/my-podo/notification-settings` | 알림 설정 | notification-settings, push |
| `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/payment-methods/page.tsx` | `/my-podo/payment-methods` | 결제 수단 관리 | payment-methods, cards |
| `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/payment-methods/register/page.tsx` | `/my-podo/payment-methods/register` | 카드 등록 | card-registration |

### Routes - External (인증 불필요)
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/(external)/open-in-browser/page.tsx` | `/open-in-browser` | 브라우저 열기 안내 | open-browser, webview |
| `~/podo-app-DOC/apps/web/src/app/(external)/qr/store/page.tsx` | `/qr/store` | QR 스토어 | qr, store |
| `~/podo-app-DOC/apps/web/src/app/(external)/(with-safearea)/first-lesson-booster-dialog/page.tsx` | `/first-lesson-booster-dialog` | 첫 수업 부스터 다이얼로그 | dialog, first-lesson |
| `~/podo-app-DOC/apps/web/src/app/(external)/(with-safearea)/level-select-dialog/page.tsx` | `/level-select-dialog` | 레벨 선택 다이얼로그 | dialog, level-select |
| `~/podo-app-DOC/apps/web/src/app/(external)/(without-safearea)/app-install-banner/page.tsx` | `/app-install-banner` | 앱 설치 배너 | banner, app-install |
| `~/podo-app-DOC/apps/web/src/app/(external)/(without-safearea)/drawing/[classID]/page.tsx` | `/drawing/:id` | 그림판 | drawing, whiteboard |

### Routes - OAuth Callbacks
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/(external)/callback/oauth/redirect/page.tsx` | `/callback/oauth/redirect` | OAuth 리다이렉트 | oauth-callback, redirect |
| `~/podo-app-DOC/apps/web/src/app/(external)/callback/oauth/set-local-storage/page.tsx` | `/callback/oauth/set-local-storage` | 로컬스토리지 설정 | oauth, localstorage |
| `~/podo-app-DOC/apps/web/src/app/(external)/callback/oauth/delete-local-storage/page.tsx` | `/callback/oauth/delete-local-storage` | 로컬스토리지 삭제 | oauth, logout |
| `~/podo-app-DOC/apps/web/src/app/(external)/callback/oauth/delete-apple-account/[userID]/page.tsx` | `/callback/oauth/delete-apple-account/:id` | Apple 계정 삭제 | oauth, apple, delete |

### Routes - App Install
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/open-in-app/[[...path]]/page.tsx` | `/open-in-app/*` | 앱 열기 (딥링크) | deeplink, open-app |
| `~/podo-app-DOC/apps/web/src/app/open-in-app/install/page.tsx` | `/open-in-app/install` | 앱 설치 안내 | app-install |

### API Routes
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/web/src/app/(external)/api/[...routes]/route.ts` | `/api/*` | BFF 프록시 | api, bff, proxy |
| `~/podo-app-DOC/apps/web/src/app/(external)/api/feature-flag/route.ts` | `/api/feature-flag` | 피처 플래그 | feature-flag, flagsmith |
| `~/podo-app-DOC/apps/web/src/app/(external)/api/notion/route.ts` | `/api/notion` | Notion API | notion |

### Views (페이지 레벨 컴포넌트)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/web/src/views/home/view.tsx` | 홈 페이지 뷰 | home, main |
| `~/podo-app-DOC/apps/web/src/views/booking/view.tsx` | 예약 페이지 뷰 | booking, reservation |
| `~/podo-app-DOC/apps/web/src/views/reservation/view.tsx` | 예약 관리 뷰 | reservation-list |
| `~/podo-app-DOC/apps/web/src/views/class-room/view.tsx` | 교실 뷰 | classroom, live-lesson |
| `~/podo-app-DOC/apps/web/src/views/subscribe-payment/view.tsx` | 결제 페이지 뷰 | payment, checkout |
| `~/podo-app-DOC/apps/web/src/views/subscribe-list/language-subscribe-list-view.tsx` | 언어 이용권 목록 뷰 | subscribe-list, tickets |
| `~/podo-app-DOC/apps/web/src/views/subscribes-tickets-v2/view.tsx` | 이용권 v2 뷰 | tickets-v2 |
| `~/podo-app-DOC/apps/web/src/views/regular-lesson-detail-page/view.tsx` | 정규 수업 상세 뷰 | lesson-detail, regular |
| `~/podo-app-DOC/apps/web/src/views/trial-lesson-detail-page/view.tsx` | 체험 수업 상세 뷰 | lesson-detail, trial |
| `~/podo-app-DOC/apps/web/src/views/ai-learning/view.tsx` | AI 학습 뷰 | ai-learning |
| `~/podo-app-DOC/apps/web/src/views/character-chat-home/recommend-character-chat-section.tsx` | 캐릭터챗 홈 추천 섹션 | character-chat, ai |
| `~/podo-app-DOC/apps/web/src/views/character-chat-detail/character-chat-detail.tsx` | 캐릭터챗 상세 | character-chat-detail |
| `~/podo-app-DOC/apps/web/src/views/coupon-detail/view.tsx` | 쿠폰 상세 뷰 | coupon |
| `~/podo-app-DOC/apps/web/src/views/notice-list/view.tsx` | 공지사항 목록 뷰 | notices |
| `~/podo-app-DOC/apps/web/src/views/registered-payment-methods/view.tsx` | 결제 수단 관리 뷰 | payment-methods |
| `~/podo-app-DOC/apps/web/src/views/register-payment-methods/view.tsx` | 카드 등록 뷰 | card-registration |
| `~/podo-app-DOC/apps/web/src/views/notification-setting/view.tsx` | 알림 설정 뷰 | notification-settings |
| `~/podo-app-DOC/apps/web/src/views/smart-talk-trial-subscribes/view.tsx` | 스마트톡 체험 뷰 | smart-talk-trial |
| `~/podo-app-DOC/apps/web/src/views/lesson-review-complete/view.tsx` | 리뷰 완료 뷰 | review-complete |

---

## apps/server - Hono BFF (Backend for Frontend)

### Core Files
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/app.ts` | BFF 앱 엔트리포인트 | hono, server, bff |
| `~/podo-app-DOC/apps/server/src/presentation/setup/routes.ts` | 라우트 설정 | routes, setup |
| `~/podo-app-DOC/apps/server/src/presentation/setup/error-handlers.ts` | 에러 핸들러 | error, handlers |

### Domains - Authentication (인증)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/domains/authentication/service.ts` | 인증 서비스 | auth, service |
| `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v1/public-redirect.handler.ts` | v1 퍼블릭 리다이렉트 | v1, redirect |
| `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/authorize.handler.ts` | v2 인증 시작 | v2, authorize, oauth |
| `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/authorize-state.handler.ts` | v2 인증 상태 | v2, state |
| `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/callback.handler.ts` | v2 OAuth 콜백 | v2, callback, oauth |
| `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/logout.handler.ts` | v2 로그아웃 | v2, logout |
| `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/restore.handler.ts` | v2 세션 복원 | v2, restore, session |
| `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/verification.handler.ts` | v2 인증 검증 | v2, verification |
| `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/validate-and-redirect.handler.ts` | v2 검증 및 리다이렉트 | v2, validate, redirect |

### Domains - OAuth (소셜 로그인)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/service.ts` | 카카오 OAuth 서비스 | kakao, oauth, service |
| `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/controller/login.handler.ts` | 카카오 로그인 핸들러 | kakao, login |
| `~/podo-app-DOC/apps/server/src/domains/oauth/apple/service.ts` | Apple OAuth 서비스 | apple, oauth, service |
| `~/podo-app-DOC/apps/server/src/domains/oauth/apple/controller/login.handler.ts` | Apple 로그인 핸들러 | apple, login |
| `~/podo-app-DOC/apps/server/src/domains/oauth/apple/controller/revoke.handler.ts` | Apple 계정 탈퇴 핸들러 | apple, revoke, delete |

### Domains - Coupons (쿠폰)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/domains/coupons/service.ts` | 쿠폰 서비스 | coupons, service |
| `~/podo-app-DOC/apps/server/src/domains/coupons/controller/available.handler.ts` | 사용 가능 쿠폰 조회 | coupons, available |
| `~/podo-app-DOC/apps/server/src/domains/coupons/controller/detail.handler.ts` | 쿠폰 상세 조회 | coupons, detail |
| `~/podo-app-DOC/apps/server/src/domains/coupons/controller/history.handler.ts` | 쿠폰 사용 이력 | coupons, history |

### Domains - Lesson (수업)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/domains/lesson/controller/history.handler.ts` | 수업 이력 조회 | lesson, history |
| `~/podo-app-DOC/apps/server/src/domains/lesson/controller/book-schedule.handler.ts` | 수업 예약 | lesson, booking, schedule |
| `~/podo-app-DOC/apps/server/src/domains/lesson/controller/tickets.handler.ts` | 수업권 조회 | lesson, tickets |
| `~/podo-app-DOC/apps/server/src/domains/lesson/controller/level-detail.handler.ts` | 레벨 상세 정보 | lesson, level |
| `~/podo-app-DOC/apps/server/src/domains/lesson/controller/ai-level-detail.handler.ts` | AI 레벨 상세 정보 | lesson, ai, level |
| `~/podo-app-DOC/apps/server/src/domains/lesson/controller/trial-level-detail.handler.ts` | 체험 레벨 상세 정보 | lesson, trial, level |
| `~/podo-app-DOC/apps/server/src/domains/lesson/controller/completed-pre-study.handler.ts` | 예습 완료 처리 | lesson, pre-study |

### Domains - Subscribes (구독/이용권)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/tickets.handler.ts` | 이용권 목록 조회 | subscribes, tickets |
| `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/lessons.handler.ts` | 구독별 수업 조회 | subscribes, lessons |
| `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/ai-lessons.handler.ts` | AI 수업 조회 | subscribes, ai, lessons |

### Domains - Payment (결제)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/domains/payment/controller/subscribe-sqs-message.handler.ts` | 구독 결제 SQS 핸들러 | payment, sqs, subscribe |
| `~/podo-app-DOC/apps/server/src/domains/payment/controller/trial-sqs-message.handler.ts` | 체험 결제 SQS 핸들러 | payment, sqs, trial |
| `~/podo-app-DOC/apps/server/src/domains/payment/controller/lumpsum-sqs-message.handler.ts` | 일시불 결제 SQS 핸들러 | payment, sqs, lumpsum |
| `~/podo-app-DOC/apps/server/src/domains/payment/controller/ipad-sqs-message.handler.ts` | iPad 결제 SQS 핸들러 | payment, sqs, ipad |
| `~/podo-app-DOC/apps/server/src/domains/payment/controller/smart-talk-trial-sqs-message.handler.ts` | 스마트톡 체험 결제 SQS 핸들러 | payment, sqs, smart-talk, trial |
| `~/podo-app-DOC/apps/server/src/domains/payment/controller/notification-web-hook.handler.ts` | 결제 웹훅 | payment, webhook, notification |
| `~/podo-app-DOC/apps/server/src/domains/payment/controller/logging-slack.handler.ts` | Slack 로깅 | payment, slack, logging |
| `~/podo-app-DOC/apps/server/src/domains/payment/controller/parking-payment-methods.handler.ts` | 결제 수단 파킹 | payment, parking |

### Domains - Payment Methods (결제 수단)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/domains/payment-methods/service.ts` | 결제 수단 서비스 | payment-methods, service |
| `~/podo-app-DOC/apps/server/src/domains/payment-methods/controller/registered-payment.handler.ts` | 등록된 결제 수단 조회 | payment-methods, list |
| `~/podo-app-DOC/apps/server/src/domains/payment-methods/controller/register-card.handler.ts` | 카드 등록 | payment-methods, register, card |

### Domains - Users (사용자)
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/domains/users/controller/profile.handler.ts` | 프로필 조회 | users, profile |
| `~/podo-app-DOC/apps/server/src/domains/users/controller/device-token.handler.ts` | 디바이스 토큰 등록 | users, device-token, push |

---

## apps/native - React Native (Expo 53)

### Core Files
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/native/src/app/_layout.tsx` | 루트 레이아웃 | layout, root |
| `~/podo-app-DOC/apps/native/src/app/index.tsx` | 메인 화면 (WebView) | webview, main |
| `~/podo-app-DOC/apps/native/src/app/+not-found.tsx` | 404 화면 | not-found, 404 |
| `~/podo-app-DOC/apps/native/src/app/[...rest].tsx` | 나머지 라우트 (WebView) | catch-all, webview |

### Core Modules
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/native/src/core/app-bridge.ts` | 웹-네이티브 브릿지 | bridge, webview, communication |
| `~/podo-app-DOC/apps/native/src/core/web-view.ts` | WebView 컴포넌트 | webview |

### Hooks
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/native/src/shared/hooks/use-app-state.ts` | 앱 상태 훅 | hooks, app-state, lifecycle |
| `~/podo-app-DOC/apps/native/src/shared/hooks/use-back-button-close.ts` | 뒤로가기 버튼 훅 | hooks, back-button |
| `~/podo-app-DOC/apps/native/src/shared/hooks/use-cookies.ts` | 쿠키 관리 훅 | hooks, cookies |
| `~/podo-app-DOC/apps/native/src/shared/hooks/use-link.ts` | 링크 처리 훅 | hooks, deeplink, navigation |
| `~/podo-app-DOC/apps/native/src/shared/hooks/use-push-notification.ts` | 푸시 알림 훅 | hooks, push, notification |
| `~/podo-app-DOC/apps/native/src/shared/hooks/use-safe-area.ts` | Safe Area 훅 | hooks, safe-area |
| `~/podo-app-DOC/apps/native/src/shared/hooks/use-update.ts` | 앱 업데이트 훅 | hooks, update |

### UI Components
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/native/src/shared/ui/splash.tsx` | 스플래시 화면 | ui, splash |
| `~/podo-app-DOC/apps/native/src/shared/ui/network-error.tsx` | 네트워크 에러 화면 | ui, error, network |

### HOCs
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/native/src/shared/hocs/with-safe-area.tsx` | Safe Area HOC | hoc, safe-area |

### Libraries
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/native/src/shared/libs/register-push-notification.ts` | 푸시 알림 등록 | push, notification, register |

---

## apps/legacy-web - Nuxt.js (레거시)

### Pages
| 파일 경로 | 라우트 | 설명 | 키워드 |
|----------|--------|------|--------|
| `~/podo-app-DOC/apps/legacy-web/pages/index.vue` | `/` | 레거시 홈 | legacy, home |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/home.vue` | `/app/user/podo/home` | 포도 홈 (레거시) | legacy, podo-home |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/classes.vue` | `/app/user/podo/classes` | 수업 목록 (레거시) | legacy, classes |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/classroom.vue` | `/app/user/podo/classroom` | 교실 (레거시) | legacy, classroom |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/class-booking.vue` | `/app/user/podo/class-booking` | 수업 예약 (레거시) | legacy, booking |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/class-reserved.vue` | `/app/user/podo/class-reserved` | 예약된 수업 (레거시) | legacy, reserved |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/class-report.vue` | `/app/user/podo/class-report` | 수업 리포트 (레거시) | legacy, report |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/class-replay.vue` | `/app/user/podo/class-replay` | 수업 다시보기 (레거시) | legacy, replay |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/selftest.vue` | `/app/user/podo/selftest` | 자가 진단 (레거시) | legacy, selftest |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/index.vue` | `/app/user/podo/mypage` | 마이페이지 (레거시) | legacy, mypage |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/payment.vue` | `/app/user/podo/mypage/payment` | 결제 (레거시) | legacy, payment |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/plan/index.vue` | `/app/user/podo/mypage/plan` | 플랜 관리 (레거시) | legacy, plan |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/plan/_ticketId.vue` | `/app/user/podo/mypage/plan/:id` | 플랜 상세 (레거시) | legacy, plan-detail |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/card-manage.vue` | `/app/user/podo/mypage/card-manage` | 카드 관리 (레거시) | legacy, card |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/card-registration.vue` | `/app/user/podo/mypage/card-registration` | 카드 등록 (레거시) | legacy, card-registration |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/churn/index.vue` | `/app/user/podo/churn` | 해지 (레거시) | legacy, churn |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/churn/quit-reason.vue` | `/app/user/podo/churn/quit-reason` | 해지 사유 (레거시) | legacy, churn, reason |
| `~/podo-app-DOC/apps/legacy-web/pages/app/user/debug/index.vue` | `/app/user/debug` | 디버그 (레거시) | legacy, debug |
