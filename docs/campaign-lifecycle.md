# Campaign Lifecycle — Complete Flow

---

## Phase 1: Creation (DRAFT)

Advertiser creates a campaign through **5 steps** — can stop and resume anytime:

| Step | Data Collected |
|---|---|
| 1. Information | Name, description, category, platforms, implementation type, deadline date, duration (days) |
| 2. Content | Content types, content description, optional PDF |
| 3. Influencers | Required count, influencer type (micro/mega/both), visibility (public/private), invited list if private |
| 4. Budget | Budget amount |
| 5. Review | Advertiser reviews everything and submits |

**Rules:**
- Only **one DRAFT** allowed per advertiser at a time — must complete or delete before creating another
- Each step saved independently — `currentStep` tracks where to resume
- Advertiser can delete the draft at any time (cleans up PDF and invited influencers)

---

## Phase 2: Admin Review (PENDING_REVIEW → APPROVED / REJECTED)

When advertiser clicks submit:
- Status → `PENDING_REVIEW`
- **Notification sent to all admins**

Admin actions:
- **APPROVE** → status → `APPROVED`, notification sent to advertiser. If campaign is **private**, all invited influencers receive invitation notifications.
- **REJECT** → status → `REJECTED`, rejection reason saved, notification sent to advertiser. Campaign is terminal — no further actions.

---

## Phase 3: Open for Applications (APPROVED)

Campaign is **publicly visible** to influencers (or only invited if private).

- Influencers can apply until `deadlineDate`
- Advertiser can **accept or reject** influencer applications at any time before deadline
- Application statuses: `PENDING` → `ACCEPTED` or `REJECTED`

---

## Phase 4: Deadline Day (Cron: daily at midnight)

Cron job runs every day. For every `APPROVED` campaign where `deadlineDate ≤ today`:

- Status → `PENDING_MINIMUM`
- `pendingMinimumDeadline` = now + 7 days (grace period)
- **Notification to advertiser**: "Your deadline has passed, take action"

---

## Phase 5: Advertiser Decision (PENDING_MINIMUM — 7-day grace)

Advertiser has **7 days** to choose one of 3 actions:

| Action | What Happens |
|---|---|
| **Extend 7 Days** | `deadlineDate` += 7 days, status → back to `APPROVED`, campaign reopens for applications |
| **Launch Anyway** | Checks: must have **at least 1 accepted influencer** (throws error if 0). Status → `IMPLEMENTATION`, `implementationStartDate` = today, `implementationEndDate` = today + `implementationPeriodDays` |
| **Discard** | Status → `DISCARDED`. Terminal. |

**If advertiser does nothing** — Cron job runs every 6 hours, checks for `PENDING_MINIMUM` campaigns where `pendingMinimumDeadline ≤ now`:
- Status → `DISCARDED` (auto)
- **Notification to advertiser**: "Your campaign was auto-discarded"

---

## Phase 6: Implementation (IMPLEMENTATION)

Campaign is live. Influencers execute their posts/content for `implementationPeriodDays` days.

- `implementationStartDate` = launch day
- `implementationEndDate` = start + period days

Cron job runs daily at 1am — finds `IMPLEMENTATION` campaigns where `implementationEndDate ≤ today`:
- Status → `COMPLETED`

---

## Terminal States

| Status | How you get here |
|---|---|
| `REJECTED` | Admin rejected the campaign |
| `DISCARDED` | Advertiser chose to discard, OR auto-discarded after 7-day grace expired |
| `COMPLETED` | Implementation period ended naturally |

---

## Full Status Flow Diagram

```
[DRAFT]
   │
   │ advertiser submits
   ▼
[PENDING_REVIEW]
   │
   ├─── admin rejects ──────────────────► [REJECTED] ✗
   │
   │ admin approves
   ▼
[APPROVED]  ◄──────────────────────────── extend 7 days ─┐
   │                                                       │
   │ deadline passes (cron midnight)                       │
   ▼                                                       │
[PENDING_MINIMUM]                                         │
   │                                                       │
   ├─── extend 7 days ─────────────────────────────────────┘
   │
   ├─── launch anyway (≥1 accepted) ────► [IMPLEMENTATION]
   │                                           │
   ├─── discard ────────────────────────► [DISCARDED] ✗    │ period ends (cron 1am)
   │                                                        ▼
   └─── no action (7 days, cron /6h) ──► [DISCARDED] ✗  [COMPLETED] ✓
```

---

## Cron Jobs Summary

| Job | Schedule | What it does |
|---|---|---|
| `processDeadlines` | Daily midnight `0 0 * * *` | APPROVED → PENDING_MINIMUM when deadline passed |
| `processGracePeriodExpirations` | Every 6h `0 */6 * * *` | PENDING_MINIMUM → DISCARDED when 7-day grace expired |
| `processImplementationCompletion` | Daily 1am `0 1 * * *` | IMPLEMENTATION → COMPLETED when period ended |
