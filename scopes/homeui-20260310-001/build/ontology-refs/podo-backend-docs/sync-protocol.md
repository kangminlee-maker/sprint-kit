# Sync-Docs Protocol for podo-backend-DOC

## Overview

This protocol defines how code changes in podo-backend-DOC should trigger documentation updates.

## Documentation Structure

```
podo-docs/
├── README.md                 # Project overview, entry point
├── domains/{domain}/         # Domain-specific documentation
│   ├── README.md            # Domain overview
│   ├── entities.md          # Entity definitions, fields, relationships
│   └── policies.md          # Business rules, validation logic
├── business/                 # Cross-domain business flows
│   └── {flow-name}.md       # End-to-end process documentation
├── database/
│   ├── enums.md             # All enum definitions
│   ├── relationships.md     # Entity relationships diagram
│   └── tables/{table}.md    # Individual table documentation
├── api/
│   ├── README.md            # API overview
│   └── {domain}-api.md      # Endpoint documentation
└── index/
    ├── by-domain.md         # Files grouped by domain
    ├── by-controller.md     # All controllers listed
    └── by-entity.md         # All entities listed
```

## Code Reference Format

### Absolute Path (Preferred)
```
src/main/java/com/speaking/podo/applications/payment/service/PaymentService.java
```

### Package Reference
```
com.speaking.podo.applications.payment.service.PaymentService
```

### Relative Reference (within same domain doc)
```
See `PaymentService.java` in service/
```

## Change Type: Controller

### Trigger
- New controller class created
- Endpoint added (`@GetMapping`, `@PostMapping`, etc.)
- Endpoint path or method changed
- Request/Response DTO changed

### Update Rules
1. **Primary**: `api/{domain}-api.md`
   - Add/update endpoint documentation
   - Include HTTP method, path, parameters, response
   - Document error codes

2. **Index**: `index/by-controller.md`
   - Add new controller to list
   - Update endpoint count

### Example
```java
// Changed: PaymentController.java
@PostMapping("/payments/refund")
public RefundResponse refundPayment(@RequestBody RefundRequest request)
```

Update `api/payment-api.md`:
```markdown
### POST /payments/refund
**Description**: Process payment refund
**Request Body**: `RefundRequest`
- `paymentId` (Long, required): Payment ID to refund
- `reason` (String, optional): Refund reason
**Response**: `RefundResponse`
```

## Change Type: Service

### Trigger
- Business logic method added/modified
- Validation rule changed
- Transaction boundary changed

### Update Rules
1. **Primary**: `domains/{domain}/policies.md`
   - Document business rule changes
   - Update validation logic description

2. **Secondary**: `business/{flow}.md` (if cross-domain)
   - Update flow diagram if affected

### Example
```java
// Changed: SubscriptionService.java
public void cancelSubscription(Long subscriptionId, CancelReason reason) {
    // New: Prorated refund calculation added
}
```

Update `domains/subscription/policies.md`:
```markdown
### Subscription Cancellation Policy
- Cancellation triggers prorated refund calculation
- Refund amount = (remaining days / total days) * subscription price
```

## Change Type: Entity

### Trigger
- New entity created
- Field added/removed/modified
- Relationship changed (`@OneToMany`, `@ManyToOne`, etc.)
- Index or constraint added

### Update Rules
1. **Primary**: `domains/{domain}/entities.md`
   - Add/update entity documentation
   - Document all fields with types

2. **Database**: `database/tables/{TABLE_NAME}.md`
   - Update table schema documentation
   - Document column changes

3. **Relationships**: `database/relationships.md`
   - Update ER diagram if relationships changed

4. **Index**: `index/by-entity.md`
   - Add new entity to list

### Example
```java
// Changed: GtSubscribe.java
@Column(name = "pause_count")
private Integer pauseCount;  // NEW FIELD
```

Update `domains/subscription/entities.md`:
```markdown
### GtSubscribe
| Field | Type | Description |
|-------|------|-------------|
| pauseCount | Integer | Number of times subscription was paused |
```

Update `database/tables/GT_SUBSCRIBE.md`:
```markdown
### Columns
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| pause_count | INT | YES | Pause count |
```

## Change Type: Enum

### Trigger
- New enum created
- Enum value added/removed
- Enum description changed

### Update Rules
1. **Primary**: `database/enums.md`
   - Add/update enum in categorized list
   - Document all values with descriptions

### Example
```java
// Changed: PaymentStatus.java
public enum PaymentStatus {
    PENDING,
    COMPLETED,
    REFUNDED,
    PARTIALLY_REFUNDED  // NEW VALUE
}
```

Update `database/enums.md`:
```markdown
### PaymentStatus
| Value | Description |
|-------|-------------|
| PENDING | Payment initiated, awaiting completion |
| COMPLETED | Payment successful |
| REFUNDED | Full refund processed |
| PARTIALLY_REFUNDED | Partial refund processed |
```

## Change Type: Repository

### Trigger
- New query method added
- Query logic changed
- New index hint added

### Update Rules
1. **Primary**: `index/by-entity.md`
   - Document new query methods

2. **Secondary**: `database/relationships.md`
   - If query reveals relationship patterns

### Example
```java
// Changed: PaymentRepository.java
@Query("SELECT p FROM GtPaymentInfo p WHERE p.userId = :userId AND p.status = :status")
List<GtPaymentInfo> findByUserIdAndStatus(Long userId, PaymentStatus status);
```

## Change Type: File Deletion

### Rules
1. Remove all references to deleted file from documentation
2. Mark as deprecated first if public API
3. Update all index files

### Checklist
- [ ] Remove from `index/by-*.md`
- [ ] Remove from `api/*.md` if controller
- [ ] Remove from `domains/*/entities.md` if entity
- [ ] Update `database/relationships.md` if entity with relationships
- [ ] Add deprecation note if breaking change

## Change Type: File Move/Rename

### Rules
1. Update all path references
2. Keep functionality documentation unchanged
3. Update indexes

### Checklist
- [ ] Search for old path in all `.md` files
- [ ] Replace with new path
- [ ] Update `index/by-domain.md` if domain changed

---

## Change Type: Directory Structure (⭐ 중요)

도메인 문서(`domains/{domain}/README.md`)에는 **패키지 구조 트리**가 포함되어 있습니다. 폴더/파일 추가, 삭제, 이동 시 해당 트리도 반드시 업데이트해야 합니다.

### 영향 문서
- `domains/{domain}/README.md` - 패키지 구조 섹션
- `domains/{domain}/entities.md` - Entity 목록
- `index/by-domain.md` - 도메인별 파일 인덱스

### 7.1 새 패키지/파일 추가 (A 상태)

**처리 단계**:
1. 추가된 경로의 도메인 식별 (`applications/{domain}/`)
2. 해당 도메인 문서의 패키지 구조 섹션 찾기
3. 알파벳 순서에 맞게 새 항목 추가
4. `// NEW` 주석 추가 (선택적)

**예시** - `applications/payment/webhook/` 패키지 추가:
```markdown
#### 변경 전
applications/payment/
├── controller/
├── entity/
└── service/

#### 변경 후
applications/payment/
├── controller/
├── entity/
├── service/
└── webhook/                    # 결제 웹훅 처리 (NEW)
    ├── PaymentWebhookController.java
    └── PaymentWebhookService.java
```

### 7.2 패키지/파일 삭제 (D 상태)

**처리 단계**:
1. 삭제된 경로의 도메인 식별
2. 해당 도메인 문서의 패키지 구조에서 항목 제거
3. 트리에서 완전히 제거

**예시** - `applications/payment/legacy/` 삭제:
```markdown
#### 변경 전
applications/payment/
├── controller/
├── legacy/                     # 레거시 결제
└── service/

#### 변경 후
applications/payment/
├── controller/
└── service/
```

### 7.3 패키지/파일 이동 (R 상태)

**처리 단계**:
1. 원본 위치에서 항목 제거
2. 새 위치에 항목 추가
3. 하위 파일들의 경로도 함께 갱신

### 7.4 경로→문서 매핑

| 변경 경로 패턴 | 업데이트할 문서 | 트리 섹션 |
|---------------|----------------|----------|
| `applications/{domain}/` | `domains/{domain}/README.md` | "패키지 구조" |
| `applications/{domain}/entity/` | `domains/{domain}/entities.md` | "Entity 목록" |
| `applications/{domain}/controller/` | `api/{domain}-api.md` | "컨트롤러 구조" |
| `applications/{domain}/service/` | `domains/{domain}/policies.md` | "서비스 레이어" |
| `applications/{domain}/repository/` | `domains/{domain}/entities.md` | "Repository 목록" |
| `applications/{domain}/dto/` | `api/{domain}-api.md` | "DTO 목록" |
| `core/**` | `domains/README.md` | "Core 모듈 구조" |
| `modules/**` | `domains/README.md` | "공유 모듈 구조" |

---

## Conflict Prevention

### File Locking
When multiple changes affect the same doc file:
1. Process changes sequentially per file
2. Use section markers to identify update locations
3. Validate no duplicate entries created

### Section Markers
```markdown
<!-- SYNC:START:{entity_name} -->
Entity documentation here
<!-- SYNC:END:{entity_name} -->
```

## Result Format

### Successful Update
```json
{
  "status": "success",
  "changes": [
    {
      "source_file": "src/main/java/.../PaymentService.java",
      "change_type": "service",
      "affected_docs": [
        {
          "path": "podo-docs/domains/payment/policies.md",
          "action": "updated",
          "sections": ["Payment Processing Rules"]
        }
      ]
    }
  ],
  "summary": {
    "files_analyzed": 1,
    "docs_updated": 1,
    "docs_created": 0,
    "warnings": 0
  }
}
```

### Warning Result
```json
{
  "status": "warning",
  "changes": [...],
  "warnings": [
    {
      "type": "unmapped_domain",
      "file": "src/main/java/.../NewFeature.java",
      "message": "No domain mapping found for package 'newfeature'"
    }
  ]
}
```

### Error Result
```json
{
  "status": "error",
  "error": {
    "type": "doc_not_found",
    "path": "podo-docs/domains/payment/policies.md",
    "message": "Target documentation file does not exist"
  }
}
```

## Update Examples

### Example 1: New API Endpoint

**Code Change**: Added `POST /api/coupons/bulk-issue` in `CouponController.java`

**Documentation Updates**:
1. `api/coupon-api.md` - Add endpoint documentation
2. `index/by-controller.md` - Update endpoint count

### Example 2: New Entity Field

**Code Change**: Added `expirationWarningDays` field to `LeCouponTemplate.java`

**Documentation Updates**:
1. `domains/coupon/entities.md` - Add field to LeCouponTemplate section
2. `database/tables/le_coupon_template.md` - Add column documentation

### Example 3: New Enum Value

**Code Change**: Added `GIFT` to `CouponIssueType.java`

**Documentation Updates**:
1. `database/enums.md` - Add value to CouponIssueType section

---

## Validation Checklist

Before finalizing sync-docs update:
- [ ] All affected files exist
- [ ] No duplicate entries created
- [ ] Code references use correct format
- [ ] Index files updated
- [ ] JSON result is valid
