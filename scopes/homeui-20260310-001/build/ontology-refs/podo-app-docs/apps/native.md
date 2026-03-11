# apps/native - React Native 모바일 앱

## 개요

**파일 경로**: `/apps/native/`

**역할**: 튜터용 모바일 앱 (iOS/Android)

**기술 스택**:
- React Native 0.79.6
- Expo 53 (Expo SDK)
- Expo Router 5 (파일 기반 라우팅)
- @webview-bridge/react-native (WebView 브릿지)
- react-native-webview (WebView 컴포넌트)
- Expo Notifications (푸시 알림)
- TypeScript

**핵심 기능**:
- WebView 기반 하이브리드 앱 (Web 앱 컨테이너 역할)
- App Bridge를 통한 네이티브 ↔ WebView 통신
- 푸시 알림 등록 및 처리
- 딥링크/Universal Link 처리 (podo://, https://podo.re-speak.com/open-in-app)
- Safe Area 관리
- 환경별 빌드 프로파일 (local, development, staging, production)

**빌드 명령어**:
```bash
# 개발 서버 실행
pnpm -C apps/native dev

# iOS 로컬 실행
pnpm -C apps/native ios

# Android 로컬 실행
pnpm -C apps/native android

# EAS 빌드 (development)
pnpm -C apps/native build:development

# EAS 빌드 (production)
pnpm -C apps/native build:production

# OTA 업데이트 (development)
pnpm -C apps/native update:development
```

---

## 디렉토리 구조

```
apps/native/
├── src/
│   ├── app/                    # Expo Router 라우트 정의
│   │   ├── _layout.tsx         # 루트 레이아웃 (스플래시 관리)
│   │   ├── index.tsx           # 메인 WebView 스크린
│   │   ├── [...rest].tsx       # 404 리다이렉트
│   │   └── +not-found.tsx      # 404 페이지
│   ├── core/                   # 핵심 레이어
│   │   ├── app-bridge.ts       # App Bridge 상태 및 액션 정의
│   │   └── web-view.ts         # WebView 컴포넌트 생성
│   ├── shared/                 # 공유 레이어
│   │   ├── hooks/              # 커스텀 훅
│   │   ├── hocs/               # 고차 컴포넌트
│   │   ├── libs/               # 유틸리티 함수
│   │   └── ui/                 # UI 컴포넌트
│   └── assets/                 # 정적 에셋
│       ├── images/             # 이미지 파일
│       └── json/               # Lottie JSON
├── ios/                        # iOS 네이티브 코드
├── android/                    # Android 네이티브 코드
├── app.json                    # Expo 기본 설정
├── app.config.ts               # 환경별 동적 설정
├── eas.json                    # EAS 빌드 프로파일
├── tsup.config.ts              # App Bridge 빌드 설정
└── package.json                # 패키지 및 스크립트
```

---

## App Bridge 인터페이스

### 파일 경로

- `/apps/native/src/core/app-bridge.ts`
- `/apps/native/src/core/web-view.ts`

### 개념

**App Bridge**는 React Native(네이티브)와 WebView(웹) 간 양방향 통신을 담당하는 인터페이스입니다. `@webview-bridge/react-native` 라이브러리 기반으로 구현되었습니다.

### App Bridge 상태 (State)

```typescript
export type AppBridgeState = {
  notificationPermissionStatus: NotificationGrantedStatus | null
  safeAreaBackgroundColor: string
  useSafeArea: boolean
  pushToken: string | null
  splashVisible: boolean
  appStartedAt: number
  appLoadedAt: number
  appLoaded: boolean
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `notificationPermissionStatus` | `'granted' \| 'undetermined' \| 'denied' \| null` | 푸시 알림 권한 상태 |
| `safeAreaBackgroundColor` | `string` | Safe Area 배경색 |
| `useSafeArea` | `boolean` | Safe Area 사용 여부 |
| `pushToken` | `string \| null` | Expo Push Token |
| `splashVisible` | `boolean` | 스플래시 화면 표시 여부 |
| `appStartedAt` | `number` | 앱 시작 시간 (타임스탬프) |
| `appLoadedAt` | `number` | 앱 로드 완료 시간 (타임스탬프) |
| `appLoaded` | `boolean` | 앱 로드 완료 여부 |

### App Bridge 액션 (Action)

```typescript
export type AppBridgeAction = {
  setAppLoaded: (bool: boolean) => Promise<void>
  setSafeAreaBackgroundColor: (safeAreaBackgroundColor: string) => Promise<void>
  setUseSafeArea: (useSafeArea: boolean) => Promise<void>
  setNotificationPermissionStatus: (notificationPermissionStatus: NotificationGrantedStatus) => Promise<void>
  alertNotificationPermission: () => Promise<void>
  linkingSettings: () => Promise<void>
  checkAndRequestNotificationPermission: () => Promise<NotificationGrantedStatus>
  requestPushToken: () => Promise<string>
  setAppStartedAt: () => Promise<void>
}
```

| 메서드 | 파라미터 | 반환값 | 설명 |
|--------|----------|--------|------|
| `setAppLoaded` | `bool: boolean` | `Promise<void>` | 앱 로드 완료 상태 설정 |
| `setSafeAreaBackgroundColor` | `safeAreaBackgroundColor: string` | `Promise<void>` | Safe Area 배경색 변경 |
| `setUseSafeArea` | `useSafeArea: boolean` | `Promise<void>` | Safe Area 사용 여부 설정 |
| `setNotificationPermissionStatus` | `status: NotificationGrantedStatus` | `Promise<void>` | 푸시 알림 권한 상태 설정 |
| `alertNotificationPermission` | - | `Promise<void>` | 알림 권한 요청 Alert 표시 |
| `linkingSettings` | - | `Promise<void>` | 앱 설정 화면 열기 |
| `checkAndRequestNotificationPermission` | - | `Promise<NotificationGrantedStatus>` | 알림 권한 확인 및 요청 |
| `requestPushToken` | - | `Promise<string>` | Expo Push Token 요청 |
| `setAppStartedAt` | - | `Promise<void>` | 앱 시작 시간 설정 |

### WebView 컴포넌트 생성

```typescript
// apps/native/src/core/web-view.ts
import { createWebView } from '@webview-bridge/react-native'
import { appBridge } from 'core/app-bridge'

export const { WebView } = createWebView({
  bridge: appBridge,
  debug: true,
})

export type { BridgeWebView }
```

**주요 특징**:
- `appBridge` 인스턴스를 주입하여 브릿지 활성화
- `debug: true`로 브릿지 통신 로그 출력
- `BridgeWebView` 타입으로 ref 관리 가능

### WebView에서 Bridge 호출 방법 (Web 앱에서)

```typescript
// Web 앱에서 네이티브 Bridge에 접근
import { useBridge } from '@webview-bridge/web'

const { requestPushToken, setUseSafeArea } = useBridge()

// 푸시 토큰 요청
const token = await requestPushToken()

// Safe Area 비활성화
await setUseSafeArea(false)
```

---

## 라우팅 구조 (Expo Router)

### Expo Router 개요

Expo Router는 파일 시스템 기반 라우팅을 제공합니다. `src/app/` 디렉토리 구조가 곧 라우트 구조입니다.

### 라우트 파일

| 파일 경로 | 라우트 | 역할 |
|-----------|--------|------|
| `src/app/_layout.tsx` | `/` | 루트 레이아웃, 스플래시 관리 |
| `src/app/index.tsx` | `/` | 메인 WebView 스크린 |
| `src/app/[...rest].tsx` | `/*` | Catch-all 라우트, `/`로 리다이렉트 |
| `src/app/+not-found.tsx` | - | 404 페이지 |

### 라우트 세부 설명

#### 1. `_layout.tsx` - 루트 레이아웃

**파일 경로**: `/apps/native/src/app/_layout.tsx`

**역할**:
- 네이티브 스플래시 화면 관리
- 최소 스플래시 노출 시간(4초) 보장
- `appLoaded` 상태 기반 스플래시 숨김

**주요 로직**:
```typescript
const MIN_SPLASH_MS = 4000

const RootLayout = () => {
  const [isSplashMinShown, setIsSplashMinShown] = useState(false)
  const { appLoaded, appStartedAt } = useBridge(appBridge, (state) => ({
    appLoaded: state.appLoaded,
    appStartedAt: state.appStartedAt,
  }))

  // 최소 스플래시 노출 시간 보장
  useEffect(() => {
    const elapsed = Date.now() - appStartedAt
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed)
    const timer = setTimeout(() => setIsSplashMinShown(true), remaining)
    return () => clearTimeout(timer)
  }, [appStartedAt])

  // 네이티브 스플래시 숨김: appLoaded && isSplashMinShown
  const splashVisible = !appLoaded || !isSplashMinShown

  return (
    <React.Fragment>
      <Stack screenOptions={{ headerShown: false }} />
      {splashVisible && <Splash />}
    </React.Fragment>
  )
}
```

#### 2. `index.tsx` - 메인 WebView 스크린

**파일 경로**: `/apps/native/src/app/index.tsx`

**역할**:
- WebView 기반 하이브리드 앱 메인 화면
- 딥링크/Universal Link 처리
- WebView 네비게이션 제어
- 네트워크 에러 처리

**주요 기능**:
- Safe Area Insets를 CSS 변수로 주입 (`--sat`, `--sab` 등)
- User Agent에 앱 정보 추가 (`PodoApp/RN 2.0.8 podo-ios-123`)
- `window.DEVICE_TYPE`, `window.NATIVE_APP_VERSION` 등 글로벌 변수 주입
- Intent URL 처리 (Android 앱 스킴)
- Toss Payments 결제 URL 처리

**딥링크 처리**:
```typescript
const handleWebViewNavigationStateChange = ({ url }: ShouldStartLoadRequest) => {
  // 외부 링크는 브라우저로 열기
  if (url.includes('external=true') || typeformRegex.test(url)) {
    Linking.openURL(url)
    return false
  }

  // Android Intent URL 처리
  if (Platform.OS === 'android' && url.startsWith('intent:')) {
    const fallbackUrl = url.match(/S\.browser_fallback_url=([^;]+)/)?.[1]
    if (fallbackUrl) {
      refWebview.current?.injectJavaScript(`window.location.href= '${decodedFallbackUrl}'`)
      return false
    }
  }

  // 앱 스킴 URL 처리 (카드사 앱 등)
  const convertUrl = new ConvertUrl(url)
  if (convertUrl.isAppLink()) {
    convertUrl.launchApp()
    return false
  }

  return true
}
```

#### 3. `[...rest].tsx` - Catch-all 리다이렉트

**파일 경로**: `/apps/native/src/app/[...rest].tsx`

**역할**: 모든 미정의 라우트를 `/`로 리다이렉트

```typescript
const CatchAllRedirectScreen = () => {
  return <Redirect href="/" />
}
```

---

## Core 레이어

### 파일 인덱스

| 파일 경로 | 역할 |
|-----------|------|
| `/apps/native/src/core/app-bridge.ts` | App Bridge 상태 및 액션 정의 |
| `/apps/native/src/core/web-view.ts` | WebView 컴포넌트 생성 |

### app-bridge.ts 상세

**파일 경로**: `/apps/native/src/core/app-bridge.ts`

**핵심 개념**:
- `@webview-bridge/react-native`의 `bridge()` 함수로 상태 관리 스토어 생성
- Zustand 스타일의 `set()`/`get()` API 사용
- WebView와 네이티브 간 상태 동기화

**브릿지 생성**:
```typescript
export const appBridge = bridge<AppBridgeState & AppBridgeAction & Bridge>(({ set, get }) => ({
  // 초기 상태
  notificationPermissionStatus: null,
  safeAreaBackgroundColor: '#FFFFFF',
  useSafeArea: true,
  pushToken: null,
  splashVisible: true,
  appStartedAt: Date.now(),
  appLoadedAt: 0,
  appLoaded: false,

  // 액션 구현
  setUseSafeArea: async (useSafeArea) => {
    set({ useSafeArea })
  },

  checkAndRequestNotificationPermission: async () => {
    const notificationPermissionStatus = await checkAndRequestNotificationPermission()
    set({ notificationPermissionStatus })
    return notificationPermissionStatus
  },

  requestPushToken: async () => {
    const pushToken = await requestPushToken()
    set({ pushToken })
    return pushToken
  },
}))
```

### web-view.ts 상세

**파일 경로**: `/apps/native/src/core/web-view.ts`

**역할**: `appBridge`를 주입한 WebView 컴포넌트 생성

```typescript
import { createWebView } from '@webview-bridge/react-native'
import { appBridge } from 'core/app-bridge'

export const { WebView } = createWebView({
  bridge: appBridge,
  debug: true,
})
```

**사용 예시**:
```typescript
import { WebView } from 'core/web-view'

<WebView
  ref={refWebview}
  source={{ uri: 'https://podo.re-speak.com' }}
  // ... 기타 props
/>
```

---

## Shared 레이어

### 디렉토리 구조

```
src/shared/
├── hooks/                      # 커스텀 훅
│   ├── use-app-state.ts        # 앱 상태 감지 (foreground/background)
│   ├── use-back-button-close.ts # Android 백 버튼 처리
│   ├── use-cookies.ts          # 개발용 쿠키 주입
│   ├── use-link.ts             # 딥링크/Universal Link 처리
│   ├── use-push-notification.ts # 푸시 알림 이벤트 처리
│   ├── use-safe-area.ts        # Safe Area 훅
│   ├── use-update.ts           # OTA 업데이트 확인
│   └── index.ts
├── hocs/                       # 고차 컴포넌트
│   ├── with-safe-area.tsx      # Safe Area Provider HOC
│   └── index.ts
├── libs/                       # 유틸리티 함수
│   ├── register-push-notification.ts # 푸시 알림 등록
│   └── index.ts
└── ui/                         # UI 컴포넌트
    ├── splash.tsx              # 스플래시 화면 (Lottie)
    ├── network-error.tsx       # 네트워크 에러 화면
    └── index.ts
```

### Hooks 상세

#### 1. use-link.ts - 딥링크 처리

**파일 경로**: `/apps/native/src/shared/hooks/use-link.ts`

**역할**:
- URL Scheme (`podo://`) 및 Universal Link 처리
- WebView URI 생성
- 환경별 WebView URL 결정

**주요 함수**:

```typescript
export const useLink = () => {
  const url = Linking.useLinkingURL() // 앱 실행 URL

  const webviewUrl = Constants.expoConfig?.extra?.WEBVIEW_URI ?? FALLBACK_WEBVIEW_URL

  // 딥링크 URL을 WebView URI로 변환
  const buildWebviewUri = (incomingUrl: string | null) => {
    if (!incomingUrl) return String(webviewUrl)

    const parsed = new URL(incomingUrl)

    // podo://open-in-app/home → https://podo.re-speak.com/home
    if (parsed.protocol.startsWith('podo')) {
      if (parsed.hostname === 'open-in-app' || parsed.hostname === 'qr') {
        const rest = parsed.pathname.replace(/^\//, '')
        return `${webviewUrl}/${rest}${parsed.search}`
      }
      return String(webviewUrl)
    }

    // https://podo.re-speak.com/open-in-app/home → https://podo.re-speak.com/home
    if (parsed.pathname.startsWith('/open-in-app')) {
      const rest = parsed.pathname.replace(/^\/?open-in-app\/?/, '')
      return `${webviewUrl}/${rest}${parsed.search}`
    }

    // QR 코드 경로
    if (parsed.pathname.startsWith('/qr')) {
      const rest = parsed.pathname.replace(/^\/?qr\/?/, '')
      return `${webviewUrl}/${rest}${parsed.search}`
    }

    return String(webviewUrl)
  }

  return { url, webviewUrl, buildWebviewUri }
}
```

**딥링크 예시**:
| 입력 URL | 변환된 WebView URI |
|----------|-------------------|
| `podo://open-in-app/home` | `https://podo.re-speak.com/home` |
| `https://podo.re-speak.com/open-in-app/class/123` | `https://podo.re-speak.com/class/123` |
| `podo://qr/abc123` | `https://podo.re-speak.com/abc123` |

#### 2. use-cookies.ts - 개발용 쿠키 주입

**파일 경로**: `/apps/native/src/shared/hooks/use-cookies.ts`

**역할**:
- 로컬 개발 시 WebView에 인증 쿠키 자동 주입
- `EXPO_PUBLIC_COOKIE_*` 환경 변수에서 쿠키 값 읽기

**주입 대상 쿠키**:
- `accessToken`
- `refreshToken`
- `uid`
- `token`

**동작 조건**:
- `APP_ENV === 'local'`일 때만 동작
- 환경 변수에 값이 있는 경우만 주입

```typescript
export const useCookies = (webviewUrl?: string) => {
  useEffect(() => {
    const isLocal = Constants.expoConfig?.extra?.APP_ENV === 'local'
    if (!webviewUrl || !isLocal) return

    const cookieConfigs = [
      { envKey: 'EXPO_PUBLIC_COOKIE_ACCESS_TOKEN', cookieName: 'accessToken' },
      { envKey: 'EXPO_PUBLIC_COOKIE_REFRESH_TOKEN', cookieName: 'refreshToken' },
      { envKey: 'EXPO_PUBLIC_COOKIE_UID', cookieName: 'uid' },
      { envKey: 'EXPO_PUBLIC_COOKIE_TOKEN', cookieName: 'token' },
    ]

    // 쿠키 설정
    await Promise.all(
      cookies.map((c) =>
        CookieManager.set(webviewUrl, {
          name: c.name,
          value: c.value,
          path: '/',
          httpOnly: false,
          secure: webviewUrl.startsWith('https'),
        }, true)
      )
    )
  }, [webviewUrl])
}
```

#### 3. use-push-notification.ts - 푸시 알림 이벤트

**파일 경로**: `/apps/native/src/shared/hooks/use-push-notification.ts`

**역할**:
- 푸시 알림 수신 리스너 등록
- 푸시 알림 클릭(응답) 리스너 등록

**Notification Handler 설정**:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})
```

**이벤트 리스너**:
```typescript
const usePushNotifications = () => {
  const [notification, setNotification] = useState<Notifications.Notification | undefined>()
  const notificationListener = useRef<Notifications.EventSubscription | null>(null)
  const responseListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    // 알림 수신 시
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification)
    })

    // 알림 클릭 시
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as PushNotificationData
      const { pk, sk } = data

      // TODO: 딥링크 처리 (예: ClassID → 수업 디테일)
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  return { notification }
}
```

**푸시 데이터 타입**:
```typescript
interface PushNotificationData {
  pk: `${string}#${string}`
  sk: string
  [key: string]: unknown
}
```

#### 4. use-back-button-close.ts - Android 백 버튼

**파일 경로**: `/apps/native/src/shared/hooks/use-back-button-close.ts`

**역할**: Android 백 버튼 두 번 누르면 앱 종료

```typescript
const DOUBLE_PRESS_DELAY = 2000

const useBackButtonClose = () => {
  const [lastBackButtonPress, setLastBackButtonPress] = useState(0)

  const onBackButtonPress = useCallback(() => {
    if (Platform.OS === 'ios') return

    const handleBackPress = () => {
      const now = Date.now()
      if (now - lastBackButtonPress < DOUBLE_PRESS_DELAY) {
        BackHandler.exitApp()
      } else {
        setLastBackButtonPress(now)
        ToastAndroid.show('Back 키를 한번 더 누르면 종료됩니다.', ToastAndroid.SHORT)
      }
      return true
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress)
    return () => backHandler.remove()
  }, [lastBackButtonPress])

  useFocusEffect(onBackButtonPress)
}
```

#### 5. use-app-state.ts - 앱 상태 감지

**파일 경로**: `/apps/native/src/shared/hooks/use-app-state.ts`

**역할**:
- 앱 Foreground/Background 상태 감지
- 앱 시작 시간 설정

```typescript
const useAppState = () => {
  const appStateRef = useRef(AppState.currentState)
  const [appStateVisible, setAppStateVisible] = useState(appStateRef.current)
  const { setAppStartedAt } = useBridge(appBridge)

  useEffect(() => {
    setAppStartedAt()
  }, [])

  useEffect(() => {
    AppState.addEventListener('change', (nextAppState) => {
      if (
        (appStateRef.current === 'inactive' || appStateRef.current === 'background') &&
        nextAppState === 'active'
      ) {
        console.log('앱으로 다시 돌아오는 경우 foreground')
      }
      appStateRef.current = nextAppState
      setAppStateVisible(appStateRef.current)
    })
  }, [])

  return { appStateVisible }
}
```

### HOCs 상세

#### with-safe-area.tsx - Safe Area Provider

**파일 경로**: `/apps/native/src/shared/hocs/with-safe-area.tsx`

**역할**:
- Safe Area 컨텍스트 제공
- App Bridge의 `useSafeArea`, `safeAreaBackgroundColor` 상태 기반 Safe Area 적용

```typescript
export const withSafeArea =
  <T extends object>(Component: ComponentType<T>) =>
  (props: T) => {
    const { useSafeArea, safeAreaBackgroundColor } = useBridge(appBridge, (state) => ({
      useSafeArea: state.useSafeArea,
      safeAreaBackgroundColor: state.safeAreaBackgroundColor,
    }))

    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: safeAreaBackgroundColor }}
          edges={useSafeArea ? ['top', 'bottom'] : []}
        >
          <Component {...props} />
        </SafeAreaView>
      </SafeAreaProvider>
    )
  }
```

**사용 예시**:
```typescript
import { withSafeArea } from '@shared/hocs'

const MyScreen = () => {
  return <View>...</View>
}

export default withSafeArea(MyScreen)
```

### Libs 상세

#### register-push-notification.ts - 푸시 알림 등록

**파일 경로**: `/apps/native/src/shared/libs/register-push-notification.ts`

**주요 함수**:

| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|----------|--------|------|
| `requestPushToken` | - | `Promise<string>` | Expo Push Token 요청 |
| `getNotificationPermissionStatus` | - | `Promise<NotificationGrantedStatus>` | 알림 권한 상태 조회 |
| `requestNotificationPermission` | - | `Promise<NotificationGrantedStatus>` | 알림 권한 요청 |
| `checkAndRequestNotificationPermission` | - | `Promise<NotificationGrantedStatus>` | 권한 확인 후 미허용 시 요청 |
| `alertNotificationPermission` | - | `void` | 알림 권한 요청 Alert 표시 |
| `linkingSettings` | - | `void` | 앱 설정 화면 열기 |

**requestPushToken 상세**:
```typescript
export const requestPushToken = async (): Promise<string> => {
  // Android 알림 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
  if (!projectId) {
    throw handleRegistrationError('Project ID not found')
  }

  try {
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId })
    return expoPushToken
  } catch (e: unknown) {
    throw handleRegistrationError(`${e}`)
  }
}
```

**checkAndRequestNotificationPermission 상세**:
```typescript
export const checkAndRequestNotificationPermission = async (): Promise<NotificationGrantedStatus> => {
  const existingStatus = await getNotificationPermissionStatus()

  let notificationStatus = existingStatus

  if (existingStatus !== 'granted') {
    notificationStatus = await requestNotificationPermission()
  }

  if (notificationStatus !== 'granted') {
    alertNotificationPermission()
  }

  return notificationStatus
}
```

### UI 컴포넌트 상세

#### 1. splash.tsx - 스플래시 화면

**파일 경로**: `/apps/native/src/shared/ui/splash.tsx`

**역할**: Lottie 애니메이션 기반 스플래시 화면

**애니메이션 파일**: `/apps/native/src/assets/json/splash.json`

#### 2. network-error.tsx - 네트워크 에러

**파일 경로**: `/apps/native/src/shared/ui/network-error.tsx`

**역할**: WebView 네트워크 에러 시 표시되는 에러 화면

**애니메이션 파일**: `/apps/native/src/assets/json/network-error.json`

---

## 푸시 알림

### 푸시 알림 아키텍처

```
1. 앱 실행 시 권한 확인 (use-push-notification.ts)
2. 권한 없으면 요청
3. 권한 획득 후 Expo Push Token 발급 (register-push-notification.ts)
4. Push Token을 App Bridge를 통해 WebView에 전달
5. WebView에서 서버로 Push Token 등록
6. 서버에서 Expo Push API를 통해 알림 발송
7. 앱에서 알림 수신 및 처리 (use-push-notification.ts)
```

### 푸시 알림 플로우

#### 1. 권한 요청 (앱 실행 시)

**파일**: `/apps/native/src/app/index.tsx`

```typescript
useEffect(() => {
  getNotificationPermissionStatus().then((status) => {
    setNotificationPermissionStatus(status)

    if (status === 'undetermined') {
      requestNotificationPermission()
    }
  })
}, [appStateVisible, setNotificationPermissionStatus])
```

#### 2. Push Token 발급

**파일**: `/apps/native/src/shared/libs/register-push-notification.ts`

```typescript
export const requestPushToken = async (): Promise<string> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId
  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId })
  return expoPushToken
}
```

**Expo Push Token 형식**: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

#### 3. App Bridge를 통한 Token 전달

```typescript
// Native에서 Push Token 발급 후 상태 저장
const pushToken = await requestPushToken()
set({ pushToken })

// WebView에서 Bridge를 통해 Token 조회
const { pushToken } = useBridge()
await registerPushTokenToServer(pushToken)
```

#### 4. 알림 수신 처리

**파일**: `/apps/native/src/shared/hooks/use-push-notification.ts`

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,      // 배너 표시
    shouldShowList: true,         // 알림 목록에 추가
    shouldPlaySound: true,        // 소리 재생
    shouldSetBadge: true,         // 뱃지 표시
  }),
})

// 알림 수신 리스너
notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
  setNotification(notification)
})

// 알림 클릭 리스너
responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data as PushNotificationData
  const { pk, sk } = data

  // 딥링크 처리 (예: ClassID → 수업 디테일)
  // Linking.openURL(`podo://open-in-app/class/${classId}`)
})
```

### 푸시 알림 권한 상태

```typescript
export type NotificationGrantedStatus = 'granted' | 'undetermined' | 'denied'
```

| 상태 | 의미 | 처리 방법 |
|------|------|-----------|
| `granted` | 권한 허용됨 | Push Token 발급 |
| `undetermined` | 권한 요청 전 | `requestNotificationPermission()` 호출 |
| `denied` | 권한 거부됨 | Alert 표시 → 설정 화면으로 이동 안내 |

### 푸시 알림 관련 파일 인덱스

| 파일 경로 | 역할 |
|-----------|------|
| `/apps/native/src/shared/libs/register-push-notification.ts` | 푸시 토큰 발급, 권한 요청 |
| `/apps/native/src/shared/hooks/use-push-notification.ts` | 푸시 알림 이벤트 리스너 |
| `/apps/native/src/core/app-bridge.ts` | 푸시 토큰 상태 관리 |
| `/apps/native/src/app/index.tsx` | 앱 실행 시 권한 확인 |

---

## 앱 설정 (app.json, app.config.ts)

### app.json - 기본 설정

**파일 경로**: `/apps/native/app.json`

**주요 설정**:
```json
{
  "expo": {
    "name": "podo",
    "slug": "day1-podo-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./src/assets/images/app-logo-apple.png",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "supportsTablet": true,
      "entitlements": {
        "com.apple.developer.applesignin": ["Default"]
      },
      "config": {
        "usesNonExemptEncryption": false
      },
      "appleTeamId": "M3LMVL5V4C"
    },
    "plugins": ["expo-router", "expo-notifications"],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "38378156-fc57-491c-9bde-076d4507114d"
      }
    },
    "owner": "day1company",
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/38378156-fc57-491c-9bde-076d4507114d"
    }
  }
}
```

### app.config.ts - 환경별 동적 설정

**파일 경로**: `/apps/native/app.config.ts`

**환경 구분**:
```typescript
type AppEnv = 'local' | 'development' | 'staging' | 'production' | 'temp'
```

**환경별 설정**:

| 환경 | WebView URI | Bundle ID | Scheme |
|------|-------------|-----------|--------|
| `local` | `http://localhost:3000` | `com.lemonade.podo.local` | `podo-local` |
| `development` | `https://dev-podo.re-speak.com` | `com.lemonade.podo.development` | `podo-development` |
| `staging` | `https://stage-podo.re-speak.com` | `com.lemonade.podo.staging` | `podo-staging` |
| `production` | `https://podo.re-speak.com` | `com.lemonade.podo` | `podo` |

**주요 동적 설정 함수**:

```typescript
const getBaseWebUri = () => {
  return match(appEnv)
    .with('local', () => 'http://localhost:3000')
    .with('development', () => 'https://dev-podo.re-speak.com')
    .with('staging', () => 'https://stage-podo.re-speak.com')
    .with(P.union('production', 'temp'), () => 'https://podo.re-speak.com')
    .exhaustive()
}

const getBundleIdentifierForEnv = () => {
  return match(appEnv)
    .with('local', () => 'com.lemonade.podo.local')
    .with('development', () => 'com.lemonade.podo.development')
    .with('staging', () => 'com.lemonade.podo.staging')
    .with(P.union('production', 'temp'), () => 'com.lemonade.podo')
    .exhaustive()
}
```

**iOS 권한 설정 (Info.plist)**:
```typescript
infoPlist: {
  NSCameraUsageDescription: '프로필 사진 촬영을 위해서 권한이 필요합니다.',
  NSMicrophoneUsageDescription: '1:1수업을 위하여 마이크 권한이 필요합니다.',
  NSPhotoLibraryUsageDescription: '프로필 사진 등록을 위해서 권한이 필요합니다.',
  NSSpeechRecognitionUsageDescription: '레벨테스트를 위해 스피치 권한이 필요합니다.',
  UIBackgroundModes: ['fetch', 'remote-notification'],
}
```

**딥링크 설정 (iOS Associated Domains)**:
```typescript
ios: {
  associatedDomains: [`applinks:${getDomainForEnv()}`],
  bundleIdentifier: getBundleIdentifierForEnv(),
}
```

**딥링크 설정 (Android Intent Filters)**:
```typescript
android: {
  intentFilters: [
    {
      action: 'VIEW',
      category: ['DEFAULT', 'BROWSABLE'],
      data: [{ scheme: 'podo' }],
    },
    {
      action: 'VIEW',
      autoVerify: true,
      category: ['DEFAULT', 'BROWSABLE'],
      data: [
        { scheme: 'https', host: 'podo.re-speak.com', pathPrefix: '/open-in-app' },
        { scheme: 'https', host: 'stage-podo.re-speak.com', pathPrefix: '/open-in-app' },
        { scheme: 'https', host: 'dev-podo.re-speak.com', pathPrefix: '/open-in-app' },
      ],
    },
  ],
}
```

**외부 앱 스킴 설정 (결제 앱 등)**:
```typescript
LSApplicationQueriesSchemes: [
  'kakaof32bb567520ad70a2cfae25b066b4e89',
  'kakaokompassauth',
  'kakaotalk',
  'supertoss',
  'kb-acp',
  'liivbank',
  'payco',
  // ... 기타 결제 앱 스킴
]
```

---

## 빌드 프로파일 (eas.json)

### EAS 빌드 프로파일 개요

**파일 경로**: `/apps/native/eas.json`

**EAS CLI 버전**: `>= 15.0.10`

**Node.js 버전**: `22.13.1` (모든 프로파일 공통)

### 빌드 프로파일 목록

| 프로파일 | 환경 | 배포 방식 | 채널 | 용도 |
|----------|------|-----------|------|------|
| `local` | `local` | Internal | `local` | 로컬 개발 및 테스트 |
| `development` | `development` | Internal | `development` | 개발 빌드 (내부 배포) |
| `staging` | `staging` | Internal | `staging` | 스테이징 테스트 (내부 배포) |
| `staging-testflight` | `staging` | TestFlight | `staging` | TestFlight 배포 (스테이징) |
| `production` | `production` | App Store/Play Store | `production` | 프로덕션 배포 |

### 빌드 프로파일 상세

#### 1. local - 로컬 개발

```json
{
  "local": {
    "extends": "base",
    "distribution": "internal",
    "env": { "APP_ENV": "local" },
    "developmentClient": true,
    "channel": "local",
    "android": { "buildType": "apk" },
    "ios": { "simulator": true }
  }
}
```

**특징**:
- Development Client 활성화
- iOS Simulator용 빌드
- Android APK 빌드

**빌드 명령어**:
```bash
pnpm -C apps/native build:local
```

#### 2. development - 개발 환경

```json
{
  "development": {
    "extends": "base",
    "environment": "development",
    "distribution": "internal",
    "autoIncrement": true,
    "env": { "APP_ENV": "development" },
    "channel": "development",
    "credentialsSource": "remote",
    "android": { "buildType": "apk" }
  }
}
```

**특징**:
- 빌드 번호 자동 증가 (`autoIncrement: true`)
- Remote Credentials 사용
- Internal 배포 (Ad-Hoc)

**빌드 명령어**:
```bash
pnpm -C apps/native build:development
```

#### 3. staging - 스테이징 환경

```json
{
  "staging": {
    "extends": "base",
    "distribution": "internal",
    "environment": "production",
    "credentialsSource": "remote",
    "autoIncrement": true,
    "env": { "APP_ENV": "staging" },
    "channel": "staging"
  }
}
```

**특징**:
- Production 환경 설정 사용 (`environment: "production"`)
- APP_ENV는 staging
- Internal 배포

**빌드 명령어**:
```bash
pnpm -C apps/native build:staging
```

#### 4. staging-testflight - TestFlight 배포

```json
{
  "staging-testflight": {
    "extends": "base",
    "environment": "production",
    "credentialsSource": "remote",
    "autoIncrement": true,
    "env": { "APP_ENV": "staging" },
    "channel": "staging"
  }
}
```

**특징**:
- TestFlight 배포용
- Distribution 미지정 시 Store 배포

**빌드 명령어**:
```bash
pnpm -C apps/native build:staging:ios --profile staging-testflight
```

#### 5. production - 프로덕션 배포

```json
{
  "production": {
    "extends": "base",
    "autoIncrement": true,
    "environment": "production",
    "env": { "APP_ENV": "production" },
    "channel": "production",
    "credentialsSource": "remote"
  }
}
```

**특징**:
- App Store/Play Store 배포
- Production 환경

**빌드 명령어**:
```bash
pnpm -C apps/native build:production
```

### OTA 업데이트 (Expo Updates)

**업데이트 URL**: `https://u.expo.dev/38378156-fc57-491c-9bde-076d4507114d`

**Runtime Version**: `1.0.0` (app.json에서 설정)

**채널별 업데이트**:
```bash
# Development 채널 OTA 업데이트
pnpm -C apps/native update:development

# Production 채널 OTA 업데이트
pnpm -C apps/native update:production
```

**주의사항**:
- OTA 업데이트는 JavaScript 번들만 업데이트 가능
- 네이티브 코드 변경 시 새 빌드 필요
- Runtime Version이 다른 경우 업데이트 적용 안 됨

---

## 환경 변수 관리

### 환경 변수 주입 방식

**Expo 환경 변수**: `app.config.ts`의 `extra` 필드로 주입

```typescript
// app.config.ts
export default {
  extra: {
    WEBVIEW_URI: getBaseWebUri(),
    APP_ENV: appEnv,
    DOMAIN: getDomainForEnv(),
  }
}

// 네이티브 코드에서 접근
import Constants from 'expo-constants'

const webviewUrl = Constants.expoConfig?.extra?.WEBVIEW_URI
const appEnv = Constants.expoConfig?.extra?.APP_ENV
```

### 개발용 쿠키 환경 변수

**로컬 개발 시 WebView 인증을 위한 쿠키 주입**:

| 환경 변수 | 쿠키 이름 | 설명 |
|-----------|-----------|------|
| `EXPO_PUBLIC_COOKIE_ACCESS_TOKEN` | `accessToken` | 액세스 토큰 |
| `EXPO_PUBLIC_COOKIE_REFRESH_TOKEN` | `refreshToken` | 리프레시 토큰 |
| `EXPO_PUBLIC_COOKIE_UID` | `uid` | 사용자 UID |
| `EXPO_PUBLIC_COOKIE_TOKEN` | `token` | 토큰 |

**설정 방법** (`.env.local`):
```bash
EXPO_PUBLIC_COOKIE_ACCESS_TOKEN=your_access_token
EXPO_PUBLIC_COOKIE_REFRESH_TOKEN=your_refresh_token
EXPO_PUBLIC_COOKIE_UID=your_uid
EXPO_PUBLIC_COOKIE_TOKEN=your_token
```

---

## WebView와 네이티브 간 통신 패턴

### 1. 네이티브 → WebView (JavaScript 주입)

**Safe Area Insets 주입**:
```typescript
refWebview.current?.injectJavaScript(/* javascript */ `
  (function() {
    const root = document.documentElement;
    root.style.setProperty('--sat', '${insets.top}px');
    root.style.setProperty('--sar', '${insets.right}px');
    root.style.setProperty('--sab', '${insets.bottom}px');
    root.style.setProperty('--sal', '${insets.left}px');
  })();

  true;
`)
```

**글로벌 변수 주입**:
```typescript
injectedJavaScript={
  /* javascript */ `
    window.NATIVE_APP_VERSION = "${Constants.expoConfig?.version}";
    window.BUILD_VERSION = "${buildVersion}";
    window.DEVICE_OS = "${Platform.OS}";
    window.DEVICE_TYPE = "${Platform.OS}";
    window.KAKAO_JS_SDK_ENABLED = true;

    const root = document.documentElement
    root.style.setProperty('--sat', '${insets.top}px');
    root.style.setProperty('--sar', '${insets.right}px');
    root.style.setProperty('--sab', '${insets.bottom}px');
    root.style.setProperty('--sal', '${insets.left}px');

    true;
  `
}
```

### 2. WebView → 네이티브 (App Bridge 호출)

**WebView에서 Bridge 사용**:
```typescript
import { useBridge } from '@webview-bridge/web'

const MyComponent = () => {
  const { requestPushToken, setUseSafeArea, pushToken } = useBridge()

  const handleRegisterPush = async () => {
    const token = await requestPushToken()
    console.log('Push Token:', token)
  }

  const handleDisableSafeArea = async () => {
    await setUseSafeArea(false)
  }

  return (
    <div>
      <button onClick={handleRegisterPush}>푸시 등록</button>
      <button onClick={handleDisableSafeArea}>Safe Area 비활성화</button>
      <p>Push Token: {pushToken}</p>
    </div>
  )
}
```

### 3. 네이티브에서 Bridge 상태 읽기

```typescript
import { useBridge } from '@webview-bridge/react-native'
import { appBridge } from 'core/app-bridge'

const MyScreen = () => {
  const { pushToken, notificationPermissionStatus } = useBridge(appBridge, (state) => ({
    pushToken: state.pushToken,
    notificationPermissionStatus: state.notificationPermissionStatus,
  }))

  return (
    <View>
      <Text>Push Token: {pushToken}</Text>
      <Text>Permission: {notificationPermissionStatus}</Text>
    </View>
  )
}
```

---

## 주요 패키지 및 의존성

### 핵심 패키지

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `react` | `19.0.0` | React 프레임워크 |
| `react-native` | `0.79.6` | React Native 프레임워크 |
| `expo` | `~53.0.19` | Expo SDK |
| `expo-router` | `~5.1.3` | 파일 기반 라우팅 |
| `@webview-bridge/react-native` | `^1.7.8` | WebView 브릿지 |
| `react-native-webview` | `13.13.5` | WebView 컴포넌트 |
| `expo-notifications` | `^0.31.4` | 푸시 알림 |
| `@react-native-cookies/cookies` | `^6.2.1` | 쿠키 관리 |

### Expo 플러그인

| 플러그인 | 역할 |
|---------|------|
| `expo-router` | 파일 기반 라우팅 |
| `expo-notifications` | 푸시 알림 |
| `expo-build-properties` | Android/iOS 빌드 속성 설정 |

### 빌드 도구

| 패키지 | 역할 |
|--------|------|
| `tsup` | App Bridge TypeScript 빌드 |
| `typescript` | TypeScript 컴파일러 |

---

## 디버깅 및 트러블슈팅

### WebView 디버깅

**Chrome DevTools 사용**:
1. WebView에서 `webviewDebuggingEnabled={true}` 설정 확인
2. Chrome에서 `chrome://inspect` 접속
3. Remote Target에서 WebView 선택

**Bridge 디버깅**:
```typescript
export const { WebView } = createWebView({
  bridge: appBridge,
  debug: true, // 브릿지 통신 로그 출력
})
```

### 푸시 알림 테스트

**Expo Push Tool 사용**:
1. https://expo.dev/notifications 접속
2. Expo Push Token 입력
3. 테스트 알림 발송

**로컬 테스트 스크립트**:
```bash
curl -H "Content-Type: application/json" -X POST https://exp.host/--/api/v2/push/send -d '{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title":"Test",
  "body": "Test message"
}'
```

### 일반적인 문제 해결

#### 1. WebView가 로드되지 않음
- 네트워크 연결 확인
- `webviewUrl` 환경 변수 확인
- CORS 정책 확인

#### 2. 푸시 알림이 오지 않음
- 알림 권한 확인 (`getNotificationPermissionStatus()`)
- Expo Push Token 발급 확인
- Project ID 설정 확인 (`app.json`의 `extra.eas.projectId`)

#### 3. 딥링크가 작동하지 않음
- iOS: Associated Domains 설정 확인
- Android: Intent Filters 설정 확인
- `app.config.ts`의 `scheme` 확인

#### 4. Safe Area가 적용되지 않음
- `useSafeArea` 상태 확인
- CSS 변수 주입 확인 (`--sat`, `--sab` 등)

---

## 배포 프로세스

### Development 배포

```bash
# 1. Development 빌드 생성
pnpm -C apps/native build:development

# 2. 빌드 확인
pnpm -C apps/native check:builds

# 3. 디바이스에서 실행
pnpm -C apps/native run:development:ios
```

### Staging 배포

```bash
# 1. Staging 빌드 생성
pnpm -C apps/native build:staging

# 2. TestFlight 배포 (iOS)
pnpm -C apps/native build:staging:ios --profile staging-testflight

# 3. 빌드 확인
pnpm -C apps/native check:builds
```

### Production 배포

```bash
# 1. Production 빌드 생성
pnpm -C apps/native build:production

# 2. 앱 스토어 제출
pnpm -C apps/native submit:production

# 3. OTA 업데이트 (필요 시)
pnpm -C apps/native update:production
```

---

## 키워드 인덱스

**React Native**, **Expo**, **WebView**, **Hybrid App**, **App Bridge**, **Push Notification**, **Deep Link**, **Universal Link**, **Safe Area**, **Expo Router**, **EAS Build**, **OTA Update**, **Expo Notifications**, **iOS**, **Android**, **TypeScript**, **Zustand**, **WebView Bridge**, **File-based Routing**, **expo-router**, **react-native-webview**, **@webview-bridge/react-native**

---

## 파일 경로 인덱스

### Core
- `/apps/native/src/core/app-bridge.ts` - App Bridge 정의
- `/apps/native/src/core/web-view.ts` - WebView 컴포넌트

### App (Routes)
- `/apps/native/src/app/_layout.tsx` - 루트 레이아웃
- `/apps/native/src/app/index.tsx` - 메인 WebView 스크린
- `/apps/native/src/app/[...rest].tsx` - Catch-all 리다이렉트

### Hooks
- `/apps/native/src/shared/hooks/use-link.ts` - 딥링크 처리
- `/apps/native/src/shared/hooks/use-cookies.ts` - 쿠키 주입
- `/apps/native/src/shared/hooks/use-push-notification.ts` - 푸시 알림 이벤트
- `/apps/native/src/shared/hooks/use-back-button-close.ts` - Android 백 버튼
- `/apps/native/src/shared/hooks/use-app-state.ts` - 앱 상태 감지

### Libs
- `/apps/native/src/shared/libs/register-push-notification.ts` - 푸시 알림 등록

### HOCs
- `/apps/native/src/shared/hocs/with-safe-area.tsx` - Safe Area Provider

### UI
- `/apps/native/src/shared/ui/splash.tsx` - 스플래시 화면
- `/apps/native/src/shared/ui/network-error.tsx` - 네트워크 에러 화면

### Config
- `/apps/native/app.json` - Expo 기본 설정
- `/apps/native/app.config.ts` - 환경별 동적 설정
- `/apps/native/eas.json` - EAS 빌드 프로파일
- `/apps/native/package.json` - 패키지 및 스크립트
