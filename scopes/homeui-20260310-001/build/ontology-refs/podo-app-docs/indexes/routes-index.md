# Routes Index - Podo Service

모든 라우트 인덱스 (apps/web, apps/legacy-web, apps/native)

## apps/web - Next.js App Router Routes

### Root & Layout Routes
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/` | `~/podo-app-DOC/apps/web/src/app/layout.tsx` | - | 루트 레이아웃 (전역 프로바이더) | root, layout, providers, datadog |
| `/` | `~/podo-app-DOC/apps/web/src/app/(internal)/page.tsx` | 필요 | 루트 페이지 (리다이렉트) | redirect, root |
| `/(internal)/*` | `~/podo-app-DOC/apps/web/src/app/(internal)/layout.tsx` | 필요 | 내부 레이아웃 (인증 필요) | internal, auth, protected |
| `/(external)/*` | `~/podo-app-DOC/apps/web/src/app/(external)/layout.tsx` | 불필요 | 외부 레이아웃 (인증 불필요) | external, public |

### Home Routes
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/home` | `~/podo-app-DOC/apps/web/src/app/(internal)/home/page.tsx` | 필요 | 메인 홈 페이지 | home, main, dashboard |
| `/home/ai` | `~/podo-app-DOC/apps/web/src/app/(internal)/home/ai/page.tsx` | 필요 | AI 홈 (캐릭터챗) | ai-home, character-chat, smart-talk |

### Authentication Routes
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/login` | `~/podo-app-DOC/apps/web/src/app/(internal)/login/page.tsx` | 불필요 | 로그인 페이지 | login, oauth, kakao, apple |

### Booking & Reservation Routes
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/booking` | `~/podo-app-DOC/apps/web/src/app/(internal)/booking/page.tsx` | 필요 | 수업 예약하기 | booking, reservation, schedule, calendar |
| `/reservation` | `~/podo-app-DOC/apps/web/src/app/(internal)/reservation/page.tsx` | 필요 | 예약 현황 (예약된 수업 목록) | reservation, booking-list, scheduled |

### AI Learning Routes
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/ai-learning` | `~/podo-app-DOC/apps/web/src/app/(internal)/ai-learning/page.tsx` | 필요 | AI 학습 페이지 | ai-learning, character-chat |

### Lesson Routes - Regular (정규 수업)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/lessons/regular` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/regular/page.tsx` | 필요 | 정규 수업 목록 | regular-lessons, tutor, lesson-list |

### Lesson Routes - Trial (체험 수업)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/lessons/trial` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/trial/page.tsx` | 필요 | 체험 수업 목록 | trial-lessons, lesson-list |

### Lesson Routes - AI (AI 수업)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/lessons/ai` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/ai/page.tsx` | 필요 | AI 수업 목록 | ai-lessons, character-chat, lesson-list |
| `/lessons/ai/:classCourseId` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/ai/[classCourseId]/page.tsx` | 필요 | AI 수업 상세 | ai-lesson-detail, character-chat |
| `/lessons/ai/trial-report/:uuid` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/ai/trial-report/[uuid]/page.tsx` | 필요 | AI 체험 수업 리포트 | ai-trial-report, report |

### Lesson Routes - Classroom (수업 진행)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/lessons/classroom/:classID` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/classroom/[classID]/page.tsx` | 필요 | 교실 (실시간 수업 진행) | classroom, live-lesson, webrtc |
| `/lessons/classroom/:classID/report` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/classroom/[classID]/report/page.tsx` | 필요 | 수업 리포트 조회 | lesson-report, feedback |
| `/lessons/classroom/:classID/review` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/classroom/[classID]/review/page.tsx` | 필요 | 수업 리뷰 작성 | lesson-review, rating, feedback |
| `/lessons/classroom/:classID/review-complete` | `~/podo-app-DOC/apps/web/src/app/(internal)/lessons/classroom/[classID]/review-complete/page.tsx` | 필요 | 리뷰 작성 완료 | review-complete, success |

### Subscribe Routes - Main (이용권 구매)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/subscribes` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/page.tsx` | 필요 | 이용권 구매 메인 | subscribes, tickets, purchase, shop |

### Subscribe Routes - Tickets (이용권 목록)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/subscribes/tickets` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/tickets/page.tsx` | 필요 | 이용권 목록 v1 | tickets, products, list |
| `/subscribes/tickets-v2` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/tickets-v2/page.tsx` | 필요 | 이용권 목록 v2 (신규) | tickets-v2, products, list |
| `/subscribes/tickets/smart-talk` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/tickets/smart-talk/page.tsx` | 필요 | 스마트톡 이용권 | smart-talk, character-chat, tickets |
| `/subscribes/tickets/payback` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/tickets/payback/page.tsx` | 필요 | 환급 이용권 | payback, refund, tickets |

### Subscribe Routes - Trial (체험 구독)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/subscribes/trial` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/trial/page.tsx` | 필요 | 체험 구독 선택 | trial-subscribe, trial, first-purchase |
| `/subscribes/trial/smart-talk` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/trial/smart-talk/page.tsx` | 필요 | 스마트톡 체험 선택 | smart-talk-trial, trial |
| `/subscribes/trial/smart-talk/:subscribeId` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/trial/smart-talk/[subscribeId]/page.tsx` | 필요 | 스마트톡 체험 결제 | smart-talk-trial-payment, checkout |

### Subscribe Routes - Payment (결제)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/subscribes/payment/:subscribeId` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/page.tsx` | 필요 | 결제 페이지 | payment, checkout, purchase |
| `/subscribes/payment/:subscribeId/success` | `~/podo-app-DOC/apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/success/page.tsx` | 필요 | 결제 성공 페이지 | payment-success, success |

### My Podo Routes - Main (마이페이지)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/my-podo` | `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/page.tsx` | 필요 | 마이페이지 메인 | mypage, profile, settings |

### My Podo Routes - Coupon (쿠폰)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/my-podo/coupon` | `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/coupon/page.tsx` | 필요 | 쿠폰 목록 | coupons, list |
| `/my-podo/coupon/:id` | `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/coupon/[id]/page.tsx` | 필요 | 쿠폰 상세 | coupon-detail, discount |

### My Podo Routes - Notices (공지사항)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/my-podo/notices` | `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/notices/page.tsx` | 필요 | 공지사항 목록 | notices, announcements, list |
| `/my-podo/notices/:boardId` | `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/notices/[boardId]/page.tsx` | 필요 | 공지사항 상세 | notice-detail, announcement |

### My Podo Routes - Notification Settings (알림 설정)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/my-podo/notification-settings` | `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/notification-settings/page.tsx` | 필요 | 알림 설정 | notification-settings, push, preferences |

### My Podo Routes - Payment Methods (결제 수단)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/my-podo/payment-methods` | `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/payment-methods/page.tsx` | 필요 | 결제 수단 관리 | payment-methods, cards, list |
| `/my-podo/payment-methods/register` | `~/podo-app-DOC/apps/web/src/app/(internal)/my-podo/payment-methods/register/page.tsx` | 필요 | 결제 수단 등록 | card-registration, add-card |

### External Routes - Dialogs (인증 불필요 다이얼로그)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/first-lesson-booster-dialog` | `~/podo-app-DOC/apps/web/src/app/(external)/(with-safearea)/first-lesson-booster-dialog/page.tsx` | 불필요 | 첫 수업 부스터 다이얼로그 | dialog, first-lesson, booster |
| `/level-select-dialog` | `~/podo-app-DOC/apps/web/src/app/(external)/(with-safearea)/level-select-dialog/page.tsx` | 불필요 | 레벨 선택 다이얼로그 | dialog, level-select |
| `/app-install-banner` | `~/podo-app-DOC/apps/web/src/app/(external)/(without-safearea)/app-install-banner/page.tsx` | 불필요 | 앱 설치 배너 | banner, app-install, download |
| `/drawing/:classID` | `~/podo-app-DOC/apps/web/src/app/(external)/(without-safearea)/drawing/[classID]/page.tsx` | 불필요 | 그림판 (공유) | drawing, whiteboard, canvas |

### External Routes - Utilities (유틸리티)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/open-in-browser` | `~/podo-app-DOC/apps/web/src/app/(external)/open-in-browser/page.tsx` | 불필요 | 브라우저 열기 안내 | open-browser, webview-guide |
| `/qr/store` | `~/podo-app-DOC/apps/web/src/app/(external)/qr/store/page.tsx` | 불필요 | QR 스토어 랜딩 | qr, store, landing |

### External Routes - OAuth Callbacks (OAuth 콜백)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/callback/oauth/redirect` | `~/podo-app-DOC/apps/web/src/app/(external)/callback/oauth/redirect/page.tsx` | 불필요 | OAuth 리다이렉트 콜백 | oauth-callback, redirect, login |
| `/callback/oauth/set-local-storage` | `~/podo-app-DOC/apps/web/src/app/(external)/callback/oauth/set-local-storage/page.tsx` | 불필요 | 로컬스토리지 설정 (네이티브) | oauth, localstorage, native |
| `/callback/oauth/delete-local-storage` | `~/podo-app-DOC/apps/web/src/app/(external)/callback/oauth/delete-local-storage/page.tsx` | 불필요 | 로컬스토리지 삭제 (로그아웃) | oauth, logout, localstorage |
| `/callback/oauth/delete-apple-account/:userID` | `~/podo-app-DOC/apps/web/src/app/(external)/callback/oauth/delete-apple-account/[userID]/page.tsx` | 불필요 | Apple 계정 삭제 콜백 | oauth, apple, delete-account |

### Deep Link Routes (딥링크)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/open-in-app/*` | `~/podo-app-DOC/apps/web/src/app/open-in-app/[[...path]]/page.tsx` | 불필요 | 앱 열기 딥링크 | deeplink, open-app, universal-link |
| `/open-in-app/install` | `~/podo-app-DOC/apps/web/src/app/open-in-app/install/page.tsx` | 불필요 | 앱 설치 안내 | app-install, download |

### API Routes (BFF Proxy)
| 라우트 | 파일 경로 | 인증 | 설명 | 키워드 |
|--------|----------|------|------|--------|
| `/api/*` | `~/podo-app-DOC/apps/web/src/app/(external)/api/[...routes]/route.ts` | - | BFF API 프록시 (Hono) | api, bff, proxy, server |
| `/api/feature-flag` | `~/podo-app-DOC/apps/web/src/app/(external)/api/feature-flag/route.ts` | - | 피처 플래그 API | feature-flag, flagsmith |
| `/api/notion` | `~/podo-app-DOC/apps/web/src/app/(external)/api/notion/route.ts` | - | Notion API 프록시 | notion, api |

---

## apps/server - Hono BFF API Endpoints

### v1 API - Authentication
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v1/auth/public-redirect` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v1/public-redirect.handler.ts` | 퍼블릭 리다이렉트 (v1) | v1, redirect, public |

### v2 API - Authentication
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v2/auth/authorize` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/authorize.handler.ts` | OAuth 인증 시작 | v2, authorize, oauth |
| GET | `/api/v2/auth/authorize-state` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/authorize-state.handler.ts` | OAuth 인증 상태 조회 | v2, state, oauth |
| GET | `/api/v2/auth/callback` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/callback.handler.ts` | OAuth 콜백 처리 | v2, callback, oauth |
| POST | `/api/v2/auth/logout` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/logout.handler.ts` | 로그아웃 | v2, logout |
| GET | `/api/v2/auth/public-redirect` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/public-redirect.handler.ts` | 퍼블릭 리다이렉트 | v2, redirect, public |
| POST | `/api/v2/auth/restore` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/restore.handler.ts` | 세션 복원 | v2, restore, session |
| POST | `/api/v2/auth/validate-and-redirect` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/validate-and-redirect.handler.ts` | 검증 및 리다이렉트 | v2, validate, redirect |
| GET | `/api/v2/auth/verification` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/verification.handler.ts` | 인증 검증 | v2, verification, check |

### v1 API - OAuth
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v1/oauth/kakao/login` | `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/controller/login.handler.ts` | 카카오 로그인 | kakao, login, oauth |
| POST | `/api/v1/oauth/apple/login` | `~/podo-app-DOC/apps/server/src/domains/oauth/apple/controller/login.handler.ts` | Apple 로그인 | apple, login, oauth |
| POST | `/api/v1/oauth/apple/revoke` | `~/podo-app-DOC/apps/server/src/domains/oauth/apple/controller/revoke.handler.ts` | Apple 계정 탈퇴 | apple, revoke, delete |

### v1 API - Coupons
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v1/coupons/available` | `~/podo-app-DOC/apps/server/src/domains/coupons/controller/available.handler.ts` | 사용 가능 쿠폰 조회 | coupons, available, list |
| GET | `/api/v1/coupons/detail` | `~/podo-app-DOC/apps/server/src/domains/coupons/controller/detail.handler.ts` | 쿠폰 상세 조회 | coupons, detail |
| GET | `/api/v1/coupons/history` | `~/podo-app-DOC/apps/server/src/domains/coupons/controller/history.handler.ts` | 쿠폰 사용 이력 | coupons, history |

### v1 API - Lessons
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v1/lessons/history` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/history.handler.ts` | 수업 이력 조회 | lessons, history, list |
| POST | `/api/v1/lessons/book-schedule` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/book-schedule.handler.ts` | 수업 예약 | lessons, booking, schedule |
| GET | `/api/v1/lessons/tickets` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/tickets.handler.ts` | 수업권 조회 | lessons, tickets |
| GET | `/api/v1/lessons/level-detail` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/level-detail.handler.ts` | 레벨 상세 정보 | lessons, level, detail |
| GET | `/api/v1/lessons/ai-level-detail` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/ai-level-detail.handler.ts` | AI 레벨 상세 정보 | lessons, ai, level |
| GET | `/api/v1/lessons/trial-level-detail` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/trial-level-detail.handler.ts` | 체험 레벨 상세 정보 | lessons, trial, level |
| POST | `/api/v1/lessons/completed-pre-study` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/completed-pre-study.handler.ts` | 예습 완료 처리 | lessons, pre-study, complete |

### v1 API - Subscribes
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v1/subscribes/tickets` | `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/tickets.handler.ts` | 이용권 목록 조회 | subscribes, tickets, list |
| GET | `/api/v1/subscribes/lessons` | `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/lessons.handler.ts` | 구독별 수업 조회 | subscribes, lessons |
| GET | `/api/v1/subscribes/lessons/ai` | `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/ai-lessons.handler.ts` | AI 수업 조회 | subscribes, ai, lessons |

### v1 API - Payment Methods
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v1/payment-methods/registered-payment` | `~/podo-app-DOC/apps/server/src/domains/payment-methods/controller/registered-payment.handler.ts` | 등록된 결제 수단 조회 | payment-methods, list |
| POST | `/api/v1/payment-methods/register-card` | `~/podo-app-DOC/apps/server/src/domains/payment-methods/controller/register-card.handler.ts` | 카드 등록 | payment-methods, register, card |

### v1 API - Users
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| GET | `/api/v1/users/profile` | `~/podo-app-DOC/apps/server/src/domains/users/controller/profile.handler.ts` | 프로필 조회 | users, profile |
| POST | `/api/v1/users/device-token` | `~/podo-app-DOC/apps/server/src/domains/users/controller/device-token.handler.ts` | 디바이스 토큰 등록 | users, device-token, push |

### v1 API - Payment (Webhooks & SQS)
| HTTP | 엔드포인트 | 파일 경로 | 설명 | 키워드 |
|------|-----------|----------|------|--------|
| POST | `/api/v1/payment/subscribe-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/subscribe-sqs-message.handler.ts` | 구독 결제 SQS 메시지 | payment, sqs, subscribe |
| POST | `/api/v1/payment/trial-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/trial-sqs-message.handler.ts` | 체험 결제 SQS 메시지 | payment, sqs, trial |
| POST | `/api/v1/payment/lumpsum-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/lumpsum-sqs-message.handler.ts` | 일시불 결제 SQS 메시지 | payment, sqs, lumpsum |
| POST | `/api/v1/payment/ipad-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/ipad-sqs-message.handler.ts` | iPad 결제 SQS 메시지 | payment, sqs, ipad |
| POST | `/api/v1/payment/smart-talk-trial-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/smart-talk-trial-sqs-message.handler.ts` | 스마트톡 체험 결제 SQS | payment, sqs, smart-talk, trial |
| POST | `/api/v1/payment/notification-web-hook` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/notification-web-hook.handler.ts` | 결제 웹훅 | payment, webhook, notification |
| POST | `/api/v1/payment/logging-slack` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/logging-slack.handler.ts` | Slack 로깅 | payment, slack, logging |
| POST | `/api/v1/payment/parking-payment-methods` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/parking-payment-methods.handler.ts` | 결제 수단 파킹 | payment, parking |

---

## apps/legacy-web - Nuxt.js Pages Routes

### Legacy Home Routes
| 라우트 | 파일 경로 | 설명 | 키워드 |
|--------|----------|------|--------|
| `/` | `~/podo-app-DOC/apps/legacy-web/pages/index.vue` | 레거시 홈 | legacy, home |
| `/app/user/podo/home` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/home.vue` | 포도 홈 (레거시) | legacy, podo-home, main |

### Legacy Lesson Routes
| 라우트 | 파일 경로 | 설명 | 키워드 |
|--------|----------|------|--------|
| `/app/user/podo/classes` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/classes.vue` | 수업 목록 (레거시) | legacy, classes, lesson-list |
| `/app/user/podo/classroom` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/classroom.vue` | 교실 (레거시) | legacy, classroom, live-lesson |
| `/app/user/podo/class-booking` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/class-booking.vue` | 수업 예약 (레거시) | legacy, booking, reservation |
| `/app/user/podo/class-reserved` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/class-reserved.vue` | 예약된 수업 (레거시) | legacy, reserved, scheduled |
| `/app/user/podo/class-report` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/class-report.vue` | 수업 리포트 (레거시) | legacy, report, feedback |
| `/app/user/podo/class-replay` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/class-replay.vue` | 수업 다시보기 (레거시) | legacy, replay, video |
| `/app/user/podo/selftest` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/selftest.vue` | 자가 진단 (레거시) | legacy, selftest, level-test |

### Legacy MyPage Routes
| 라우트 | 파일 경로 | 설명 | 키워드 |
|--------|----------|------|--------|
| `/app/user/podo/mypage` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/index.vue` | 마이페이지 (레거시) | legacy, mypage, profile |
| `/app/user/podo/mypage/payment` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/payment.vue` | 결제 (레거시) | legacy, payment |
| `/app/user/podo/mypage/plan` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/plan/index.vue` | 플랜 관리 (레거시) | legacy, plan, subscribes |
| `/app/user/podo/mypage/plan/:ticketId` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/plan/_ticketId.vue` | 플랜 상세 (레거시) | legacy, plan-detail |
| `/app/user/podo/mypage/card-manage` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/card-manage.vue` | 카드 관리 (레거시) | legacy, card, payment-methods |
| `/app/user/podo/mypage/card-registration` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/mypage/card-registration.vue` | 카드 등록 (레거시) | legacy, card-registration |

### Legacy Churn Routes
| 라우트 | 파일 경로 | 설명 | 키워드 |
|--------|----------|------|--------|
| `/app/user/podo/churn` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/churn/index.vue` | 해지 (레거시) | legacy, churn, cancel |
| `/app/user/podo/churn/quit-reason` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/podo/churn/quit-reason.vue` | 해지 사유 (레거시) | legacy, churn, reason |

### Legacy Debug Routes
| 라우트 | 파일 경로 | 설명 | 키워드 |
|--------|----------|------|--------|
| `/app/user/debug` | `~/podo-app-DOC/apps/legacy-web/pages/app/user/debug/index.vue` | 디버그 (레거시) | legacy, debug, dev |

---

## apps/native - React Native (Expo Router) Routes

### Native Routes
| 라우트 | 파일 경로 | 설명 | 키워드 |
|--------|----------|------|--------|
| `/` | `~/podo-app-DOC/apps/native/src/app/index.tsx` | 메인 WebView 화면 | native, webview, main |
| `/*` | `~/podo-app-DOC/apps/native/src/app/[...rest].tsx` | 모든 나머지 라우트 (WebView) | native, webview, catch-all |
| `/_layout` | `~/podo-app-DOC/apps/native/src/app/_layout.tsx` | 루트 레이아웃 | native, layout, root |
| `/+not-found` | `~/podo-app-DOC/apps/native/src/app/+not-found.tsx` | 404 화면 | native, not-found, 404 |

---

## Middleware

### Web Middleware
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/web/src/middleware.ts` | 미들웨어 체이닝: nativeStore → session → GA4 → protectedRoute | middleware, auth, session, ga4 |
