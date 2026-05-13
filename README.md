# CEFANET CDF Fund Tracking System

A web platform for managing, monitoring and reporting on **Constituency Development Fund (CDF)** disbursements and outcomes across Zambian constituencies. Built to align CDF operations with the CEFANET M&E framework and Zambia's commitments to **SDG 1, 4, 8, and 16**.

> Single-page React + TypeScript application with role-based dashboards, end-to-end programme workflows, audit trail with hash-chain tamper-evidence, and a public citizen scorecard portal. Currently runs on in-memory mock data for demonstration; the architecture is designed to drop into a Node/PostgreSQL backend (see [`CEFANET_CDF_System_Requirements_and_Architecture.md`](./CEFANET_CDF_System_Requirements_and_Architecture.md)).

---

## What it tracks

### 🎓 Bursary Management — *SDG 4: Quality Education*
Register applicants (NRC, guardian contact, vulnerability categories), workflow states from **Draft → Graduated**, finance-officer disbursements, annual retention prompts, cohort completion rates, CSV bulk import, and 60-day non-confirmation alerts.

### 💰 Loans & Grants — *SDG 1 & 8: No Poverty / Decent Work*
Application registry with business sector and demographic category, full lifecycle from **Applied → Active → Completed/Defaulted**, repayment tracking with per-installment schedule (`PENDING / PAID / PARTIALLY_PAID / OVERDUE`), 12-month business survival surveys, jobs disaggregated by employment type / gender / age / disability, and auto 6 & 12-month follow-up reminders.

### ⚙️ Operational Efficiency — *SDG 16: Strong Institutions*
Disbursement timeliness across loans, grants and bursaries; admin & M&E cost ratio per quarter per constituency; average processing time by programme type; field monitoring visit log (with beneficiaries linked, findings, recommendations, attachments, follow-up action items); 90-day visit coverage flagging; community engagement sessions (dialogue / workshop / scorecard / other) with gender-disaggregated attendance.

### 🗳️ Community Engagement & Transparency
Public citizen scorecard portal (5 dimensions, anonymous-allowed); satisfaction index per constituency / quarter; project-level **feedback incorporation** tracking (`Yes / No / Partial`); public disclosure dashboard; quarterly report publish flow with **14-day & 3-day deadline reminders** and on-time compliance rate.

### 🎯 SDG Cross-Cutting Indicators
Editable baselines and targets per fiscal year, traffic-light progress (red / amber / green) per indicator with configurable thresholds, evaluation against current actuals computed from the live data.

### 📊 Reporting
Quarterly M&E report, annual SDG impact report, disbursement reconciliation, loan repayment status, beneficiary disaggregation. **PDF + Excel export**. Ad-hoc filtering by constituency / date range / programme type / gender / category / status. Scheduled report delivery (daily / weekly / monthly / quarterly).

### 🔔 Notifications & Alerts
In-app + email-channel mock for: status changes, overdue repayments, monitoring deadlines, quarterly report deadlines, 6/12-month follow-ups, business survival prompts. Admin-configurable templates and recipients.

### 🛡️ Security & Audit
- **MFA** TOTP step for all internal roles (demo code `000000`)
- **30-minute idle session timeout** with countdown banner
- Failed login attempts logged
- **Hash-chained audit log** — every CREATE/UPDATE/DELETE captures user, timestamp, module, field, old/new value, IP. Each entry references the previous entry's hash; the audit page surfaces a green/red verification badge so tampering is immediately visible.
- 7-year operational / 10-year audit retention policy enforcement.

---

## Roles

| Role | Access |
|---|---|
| **System Administrator** | Full CRUD, user management, system configuration |
| **National M&E Officer** | Read-all, SDG targets, dashboards |
| **Council / Constituency Officer** | Manage applications + reports for their constituency |
| **Finance Officer** | Approve disbursements, record transactions |
| **Field / Monitoring Officer** | Log monitoring visits, business surveys |
| **Auditor** | Read-only access to financials + audit logs |
| **Beneficiary** | Submit bursary application, view own records |
| **Public User** | Submit citizen scorecards, view public disclosure dashboard |

---

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** + custom utility design system
- **React Router v7** with role-gated routes
- **Recharts** for data visualisation
- **Motion** (`motion/react`) for animations
- **jsPDF** + **xlsx** for report export
- **date-fns** for date arithmetic
- In-memory mock data services (one per domain) — production would swap these for REST clients against a Node/Express API and PostgreSQL

---

## Running locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev          # starts Vite on http://localhost:3000
npm run lint         # tsc --noEmit (zero errors expected)
npm run build        # production build to dist/
```

### Demo accounts

The login page lists six pre-seeded users covering all roles. Internal accounts (Admin, M&E, Council, Finance, Field, Auditor) trigger the **MFA step** — use code **`000000`** to complete the login.

The public portal is available without authentication at `/public/scorecard` and `/public/disclosure`.

---

## Project structure

```
src/
├── App.tsx                    # Routes + role gating + boot-time scheduler
├── modules/
│   ├── auth/                  # AuthContext (MFA, idle timeout), Login/Register pages
│   ├── beneficiaries/         # Person- and group-centric registry
│   ├── bursaries/             # SDG 4 — application, disbursement, retention, completion
│   ├── loans/                 # SDG 1/8 — applications, repayment schedule, jobs, surveys
│   ├── monitoring/            # SDG 16 — efficiency, field visits, audit log (hash-chained)
│   ├── community/             # Scorecards, projects (feedback incorporation), quarterly reports
│   ├── sdg/                   # Targets + traffic-light evaluations
│   ├── reporting/             # PDF/Excel exports + scheduled delivery
│   ├── notifications/         # In-app + email-channel dispatch
│   ├── dashboard/             # Role-specific dashboard panels
│   ├── system/                # Constituency management
│   └── users/                 # User administration
└── shared/
    ├── api/mockData.ts        # Seed data
    ├── types/                 # Cross-module type barrel
    └── components/            # UI primitives + DashboardLayout
```

Each domain module owns its `types/`, `api/`, `pages/`, and `components/`. Services communicate only through their public interfaces — no service reaches into another's data layer.

---

## Status & roadmap

The project currently implements every functional requirement (FR-AUTH, FR-BUR, FR-LOAN, FR-OPS, FR-CE, FR-SDG, FR-RPT, FR-NOT, FR-AUD) defined in the requirements document, against an in-memory data layer. The next phase swaps mock services for a real Node/Express + PostgreSQL backend per the architecture in [`CEFANET_CDF_System_Requirements_and_Architecture.md`](./CEFANET_CDF_System_Requirements_and_Architecture.md):

1. PostgreSQL schema with row-level security per constituency
2. JWT auth + real TOTP via Passport.js
3. S3-compatible storage for evidence attachments
4. Bull/Redis queue for notifications and report generation
5. Pilot deployment with selected constituencies → national rollout

---

*Aligned with Zambia's CDF reform agenda and SDG commitments.*
