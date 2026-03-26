# Brownfield Detail

scope: immediate-class-post-purchase-20260325-001

<a id="payment-success"></a>

## Payment success flow

**소스:** PaymentGateway.java

PortOne callback → processPayment() → SubscribeMapp + Ticket → Home redirect. Must intercept for completion screen.
