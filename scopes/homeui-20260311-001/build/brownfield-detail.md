# Brownfield Detail

scope: homeui-20260311-001

<a id="a1"></a>

## HomeRedirection

**소스:** podo-app

trialClassCompYn=Y && paymentYn=N → router.replace

<a id="a2"></a>

## greetingStatusSchema

**소스:** podo-app

4개 enum

<a id="a3"></a>

## 상태 판별

**소스:** podo-app

useSuspenseQuery + ts-pattern

<a id="a4"></a>

## UI 분기

**소스:** podo-app

exhaustive 4개 분기

<a id="a5"></a>

## SSR prefetch

**소스:** podo-app

prefetchQuery

<a id="a6"></a>

## 홈 뷰

**소스:** podo-app

Redirection+Banner+Greeting+Tutorial

<a id="b1"></a>

## greeting 의존

**소스:** podo-app

features→widgets

<a id="b2"></a>

## subscribes 의존

**소스:** podo-app

getSubscribeMappList

<a id="c1"></a>

## PodoUserDto

**소스:** podo-backend

trialPaymentYn, trialClassCompYn, paymentYn

<a id="c2"></a>

## 체험수업 목록

**소스:** podo-backend

invoiceStatus, classState
