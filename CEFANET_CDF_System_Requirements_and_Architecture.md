# CEFANET CDF Fund Tracking System
## Functional Requirements & System Architecture

**Version:** 1.0  
**Date:** May 2026  
**Prepared for:** CEFANET M&E Dashboard Project  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Stakeholders & User Roles](#2-stakeholders--user-roles)
3. [Functional Requirements](#3-functional-requirements)
   - 3.1 Authentication & Access Control
   - 3.2 Bursary Management Module
   - 3.3 Loans & Grants Management Module
   - 3.4 Operational Efficiency Module
   - 3.5 Community Engagement & Transparency Module
   - 3.6 SDG Alignment & Cross-Cutting Indicators
   - 3.7 Reporting & Dashboard
   - 3.8 Notifications & Alerts
   - 3.9 Audit Trail & Compliance
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [System Architecture](#5-system-architecture)
   - 5.1 Architecture Overview
   - 5.2 Layer Breakdown
   - 5.3 Domain Model
   - 5.4 Data Model (Key Entities)
   - 5.5 API Design
   - 5.6 Security Architecture
   - 5.7 Deployment Architecture
6. [Technology Stack](#6-technology-stack)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Project Overview

The **CEFANET CDF Fund Tracking System** is a web-based platform designed to manage, monitor, and report on Constituency Development Fund (CDF) disbursements and outcomes across all programme areas. The system aligns operations with the five indicator domains defined in the CEFANET M&E framework and supports Zambia's commitments to SDGs 1, 4, 8, and 16.

### Core Objectives

- Provide end-to-end tracking of CDF funds from allocation to impact measurement
- Enforce transparency and accountability at constituency level
- Generate real-time dashboards and periodic reports for decision-making
- Capture disaggregated beneficiary data (gender, age, disability, geography)
- Enable citizens to engage through scorecards and feedback mechanisms

---

## 2. Stakeholders & User Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **System Administrator** | IT/technical team managing the platform | Full CRUD, user management, system configuration |
| **National M&E Officer** | Oversees all constituencies, reviews aggregate data | Read-all, approve reports, configure indicators |
| **Constituency Officer** | Manages applications and disbursements in their area | Create/edit records for their constituency |
| **Finance Officer** | Processes payments and tracks repayments | Approve disbursements, record transactions |
| **Auditor / Compliance Officer** | Reviews financial records for compliance | Read-only access to all financial data, export |
| **Monitoring Officer** | Conducts field visits and records observations | Log monitoring visits, upload field evidence |
| **Community Member / Citizen** | Submits feedback and scorecards via public portal | Submit scorecard, view public reports |
| **Public Viewer** | General public accessing transparency reports | View published constituency reports |

---

## 3. Functional Requirements

### 3.1 Authentication & Access Control

**FR-AUTH-001:** The system shall support multi-factor authentication (MFA) for all internal users.

**FR-AUTH-002:** The system shall implement Role-Based Access Control (RBAC), restricting data access based on the user's assigned role and constituency.

**FR-AUTH-003:** Constituency Officers shall only view and manage data belonging to their assigned constituency.

**FR-AUTH-004:** The system shall support Single Sign-On (SSO) integration with existing government identity providers.

**FR-AUTH-005:** User sessions shall expire after 30 minutes of inactivity, requiring re-authentication.

**FR-AUTH-006:** The system shall maintain a log of all login attempts (successful and failed), accessible to System Administrators.

---

### 3.2 Bursary Management Module

This module tracks all activities under **SDG 4 – Quality Education**.

**FR-BUR-001:** The system shall allow Constituency Officers to register new bursary applicants with the following required fields:
- Full name, National Registration Card (NRC) number
- School name, grade/level, academic year
- Gender (Female / Male / Other)
- Vulnerability category: Orphan, Person with Disability (PWD), Rural Student, Other
- Contact information (guardian/parent)
- Constituency

**FR-BUR-002:** The system shall support workflow states for each bursary application: `Draft → Submitted → Under Review → Approved → Disbursed → Active → Graduated / Dropped Out`.

**FR-BUR-003:** The system shall automatically calculate and display the following KPIs per constituency and at national level:
- Number of bursaries awarded per quarter (count of `Approved` within the quarter)
- Gender distribution (% Female, % Male)
- Proportion of beneficiaries by vulnerability category

**FR-BUR-004:** At the start of each academic year, the system shall prompt officers to confirm which beneficiaries are continuing (retention). The retention rate shall be auto-calculated as: `(Continuing beneficiaries ÷ Previous year total) × 100`.

**FR-BUR-005:** The system shall calculate completion rate as: `(Graduated beneficiaries ÷ Total enrolled cohort) × 100`, grouped by starting academic year.

**FR-BUR-006:** The system shall support bulk import of bursary records via a standardised CSV template.

**FR-BUR-007:** The system shall allow Finance Officers to record individual disbursement transactions per bursary, including amount, date, payment method, and reference number.

**FR-BUR-008:** The system shall generate alerts when a beneficiary has not had their annual status confirmed after 60 days into the academic year.

---

### 3.3 Loans & Grants Management Module

This module tracks activities under **SDG 1 – No Poverty** and **SDG 8 – Decent Work**.

**FR-LOAN-001:** The system shall allow registration of loan/grant applications with the following fields:
- Applicant name, NRC, contact details, constituency
- Category: Youth, Women, Men, Person with Disability (PWD)
- Programme type: Loan or Grant
- Business name and sector (Agriculture, Trade, Manufacturing, Services, Other)
- Requested amount and approved amount
- Application date and approval date

**FR-LOAN-002:** The system shall track the full disbursement lifecycle: `Applied → Under Review → Approved → Partially Disbursed → Fully Disbursed → Active → Completed / Defaulted`.

**FR-LOAN-003:** The system shall calculate and display:
- Number of loans/grants disbursed per quarter and cumulatively
- Average loan/grant size = `Total disbursed amount ÷ Number of disbursements`
- Proportion of beneficiaries by category (Youth %, Women %, Men %, PWDs %)

**FR-LOAN-004:** For loans specifically, the system shall support repayment tracking:
- Record each repayment installment (date, amount, reference)
- Automatically calculate outstanding balance
- Calculate repayment rate = `(Total repaid ÷ Total due as of date) × 100`
- Flag overdue accounts (unpaid installments past due date)

**FR-LOAN-005:** The system shall track business survival. At 12 months post-disbursement, officers shall be prompted to record business status (`Active / Closed / Restructured`). Business survival rate = `(Active businesses ÷ Total funded businesses) × 100`.

**FR-LOAN-006:** The system shall allow recording of jobs created per funded enterprise, disaggregated by:
- Employment type (Full-time, Part-time, Seasonal)
- Gender (Female, Male)
- Age group (Youth 15–35, Adult 36+)
- Disability status (PWD, Non-PWD)

**FR-LOAN-007:** The system shall generate automatic follow-up reminders to Monitoring Officers when a beneficiary reaches the 6-month and 12-month mark post-disbursement.

---

### 3.4 Operational Efficiency Module

This module tracks activities under **SDG 16 – Strong Institutions**.

**FR-OPS-001:** Each disbursement record (bursary, loan, or grant) shall have an expected disbursement date. The system shall calculate timeliness as: `(Disbursements completed on/before scheduled date ÷ Total scheduled disbursements) × 100`.

**FR-OPS-002:** The system shall track administrative and M&E costs per quarter per constituency. Administrative cost ratio = `(Admin + M&E costs ÷ Total disbursed amount) × 100`.

**FR-OPS-003:** The system shall automatically calculate average processing time per application as: `Average(Disbursement date − Application submission date)` in calendar days, broken down by programme type.

**FR-OPS-004:** The system shall support a monitoring visit log with the following fields:
- Constituency, date of visit, officer conducting visit
- Beneficiaries visited (linked to records)
- Findings (text), recommendations (text)
- Evidence attachments (photos, documents, max 5 files, 10MB each)
- Follow-up action items with due dates and responsible officers

**FR-OPS-005:** The system shall display number of monitoring visits per constituency per quarter and flag constituencies that have not had a visit within 90 days.

**FR-OPS-006:** The system shall support community engagement session records:
- Session type: Dialogue, Workshop, Scorecard Distribution, Other
- Date, location, constituency, number of attendees (disaggregated by gender)
- Issues raised (text), actions committed (text)
- Attendance sheet upload

---

### 3.5 Community Engagement & Transparency Module

**FR-CE-001:** The system shall provide a public-facing **Citizen Scorecard Portal** where community members can:
- Select their constituency
- Rate service delivery across dimensions (1–5 scale): Accessibility, Timeliness, Fairness, Communication, Impact
- Submit free-text feedback and suggestions
- Optionally provide their name and contact details (anonymous submission allowed)

**FR-CE-002:** The system shall calculate a **Stakeholder Satisfaction Index** per constituency per quarter as the mean score across all scorecard submissions.

**FR-CE-003:** The system shall track community feedback incorporation: for each project/programme, officers shall record whether community feedback was acted upon (`Yes / No / Partial`). KPI = `(Projects with feedback incorporated ÷ Total projects) × 100`.

**FR-CE-004:** The system shall provide a **Public Disclosure Dashboard** showing:
- Published quarterly reports per constituency (PDF download)
- Disbursement summaries (aggregate, not individual beneficiary data)
- Satisfaction scores and trend graphs

**FR-CE-005:** The system shall enforce a quarterly reporting deadline. Constituencies that have not published their quarterly report by the deadline shall be flagged, and compliance rate = `(Constituencies published on time ÷ Total constituencies) × 100` shall be displayed.

**FR-CE-006:** The system shall send automated reminders to Constituency Officers 14 days and 3 days before quarterly report deadlines.

---

### 3.6 SDG Alignment & Cross-Cutting Indicators

**FR-SDG-001:** The system shall compute and display the following cross-cutting KPIs:

| SDG | Indicator | Calculation |
|-----|-----------|-------------|
| SDG 4 | % increase in school enrolment/retention linked to bursaries | `(Current year bursary beneficiaries in school ÷ Baseline) × 100` |
| SDG 1 | % of households reporting improved income due to grants/loans | Derived from follow-up survey responses at 12 months |
| SDG 8 | Number of decent jobs created | Sum of all job records linked to funded enterprises |
| SDG 16 | % of constituencies meeting transparency benchmarks | Based on disclosure compliance and community scorecard scores |

**FR-SDG-002:** The system shall allow National M&E Officers to set baseline values and targets for each SDG indicator per fiscal year.

**FR-SDG-003:** The system shall visualise progress toward SDG targets using traffic-light indicators (Red / Amber / Green) based on configurable thresholds.

---

### 3.7 Reporting & Dashboard

**FR-RPT-001:** The system shall provide a **National Dashboard** displaying:
- Aggregate KPIs across all five indicator domains
- Constituency-level heat map (colour-coded by performance)
- Trend charts (quarterly, annual) for each KPI
- SDG alignment scorecard

**FR-RPT-002:** The system shall provide a **Constituency Dashboard** displaying the same metrics scoped to a single constituency, accessible to the relevant officer.

**FR-RPT-003:** The system shall support generation of the following standard reports:
- Quarterly M&E Report (per constituency and national)
- Annual Impact Report (aggregated SDG progress)
- Disbursement Reconciliation Report (finance use)
- Loan Repayment Status Report
- Beneficiary Disaggregation Report

**FR-RPT-004:** All reports shall be exportable in PDF and Excel formats.

**FR-RPT-005:** The system shall support **ad hoc filtering** of all data by: constituency, date range, programme type, gender, beneficiary category, and disbursement status.

**FR-RPT-006:** The system shall support scheduled report delivery via email to configured recipients.

---

### 3.8 Notifications & Alerts

**FR-NOT-001:** The system shall send email and in-app notifications for:
- Application status changes (to applicant's registered contact where applicable)
- Overdue repayments (to Finance Officer and Constituency Officer)
- Upcoming monitoring visit deadlines
- Quarterly report submission deadlines
- Beneficiary 6-month and 12-month follow-up reminders
- Business survival survey prompts

**FR-NOT-002:** System Administrators shall be able to configure notification templates, recipients, and trigger conditions.

---

### 3.9 Audit Trail & Compliance

**FR-AUD-001:** The system shall maintain an immutable audit log for every create, update, and delete action, capturing: user, timestamp, module, record ID, field changed, old value, new value.

**FR-AUD-002:** Audit logs shall not be editable or deletable by any user role, including System Administrators.

**FR-AUD-003:** Auditors shall have a dedicated interface to search and filter audit logs by user, module, date range, and action type.

**FR-AUD-004:** The system shall enforce data retention policies: operational data retained for 7 years; audit logs retained for 10 years, in compliance with public finance regulations.

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Dashboard pages shall load within 3 seconds under normal load (≤200 concurrent users) |
| **Availability** | System shall target 99.5% uptime excluding scheduled maintenance windows |
| **Scalability** | Architecture shall support horizontal scaling to handle growth in constituencies and data volume |
| **Security** | All data in transit encrypted via TLS 1.2+; data at rest encrypted via AES-256 |
| **Accessibility** | Public portal shall comply with WCAG 2.1 Level AA |
| **Offline Support** | Field officers shall be able to record monitoring visits offline; data syncs when connectivity is restored |
| **Localisation** | System shall support English as the primary language, with architecture supporting future language additions |
| **Data Privacy** | Beneficiary PII shall be accessible only to authorised roles; public-facing data shall be aggregated only |
| **Backup** | Automated daily database backups with point-in-time recovery for the last 30 days |
| **Browser Support** | Support for Chrome, Firefox, Edge, and Safari (latest 2 versions); mobile-responsive design |

---

## 5. System Architecture

### 5.1 Architecture Overview

The system follows a **three-tier, domain-driven architecture** with a clear separation between presentation, business logic, and data layers. It is designed as a monolithic backend with a modular domain structure (allowing future migration to microservices if needed) and a single-page application (SPA) frontend.

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                           │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │  Internal SPA   │  │     Public Citizen Portal    │   │
│  │  (React)        │  │     (Static / React)         │   │
│  └────────┬────────┘  └──────────────┬───────────────┘   │
└───────────┼──────────────────────────┼───────────────────┘
            │ HTTPS / REST API          │ HTTPS / REST API
┌───────────┼──────────────────────────┼───────────────────┐
│           │      API GATEWAY         │                    │
│           │   (Rate Limiting, Auth)  │                    │
│  ┌────────▼──────────────────────────▼───────────────┐   │
│  │                  REST API SERVER                   │   │
│  │              (Node.js / Express)                   │   │
│  │                                                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │   │
│  │  │ Bursary  │ │  Loans & │ │   Community      │   │   │
│  │  │ Service  │ │  Grants  │ │   Engagement     │   │   │
│  │  │          │ │  Service │ │   Service        │   │   │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │   │
│  │  │ Ops &    │ │ Reporting│ │   Auth &         │   │   │
│  │  │ Efficiency│ │ Service  │ │   User Mgmt      │   │   │
│  │  │ Service  │ │          │ │   Service        │   │   │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │   │
│  └────────────────────────────────────────────────────┘   │
│                   APPLICATION LAYER                        │
└───────────────────────────────────────────────────────────┘
            │                   │                 │
┌───────────▼───────┐  ┌────────▼──────┐ ┌───────▼──────────┐
│    PostgreSQL      │  │  Redis Cache  │ │  File Storage    │
│  (Primary DB)      │  │  (Sessions,   │ │  (S3-compatible) │
│                    │  │   KPI Cache)  │ │  Documents,      │
│                    │  │               │ │  Evidence, PDFs  │
└───────────────────┘  └───────────────┘ └──────────────────┘

            Background Services:
┌───────────────────────────────────────────────────────────┐
│  Notification Worker │ Report Generator │ KPI Calculator  │
│  (Node.js + Queue)   │ (PDF/Excel)      │ (Scheduled Jobs)│
└───────────────────────────────────────────────────────────┘
```

---

### 5.2 Layer Breakdown

#### Presentation Layer

**Internal SPA (React)**
- Role-based navigation and component visibility
- Real-time dashboard with Chart.js / Recharts visualisations
- Forms with client-side validation (React Hook Form + Zod)
- Offline-capable data entry using Service Workers + IndexedDB

**Public Citizen Portal**
- Lightweight static React application
- Scorecard submission form
- Public transparency dashboard (read-only aggregated data)
- No authentication required for submission or viewing

#### API Layer

**API Gateway**
- Entry point for all HTTP traffic
- Handles SSL termination, rate limiting (per IP and per user), and CORS
- Routes requests to the REST API Server

**REST API Server (Node.js / Express)**
- Stateless RESTful API following OpenAPI 3.0 specification
- JWT-based authentication with refresh token rotation
- Input validation and sanitisation on every endpoint
- Modular domain services (one module per indicator domain)
- Centralised error handling and structured logging

#### Domain Services

Each domain service encapsulates its own business logic, validation rules, and KPI calculations. Services communicate only through defined interfaces — never directly accessing another service's data layer.

| Service | Responsibilities |
|---------|-----------------|
| **Auth & User Management** | Login, MFA, token issuance, RBAC enforcement, user CRUD |
| **Bursary Service** | Application CRUD, workflow state machine, retention/completion KPI calculation |
| **Loans & Grants Service** | Application CRUD, disbursement recording, repayment tracking, business survival tracking, job creation recording |
| **Operational Efficiency Service** | Disbursement timeliness calculation, admin cost tracking, processing time metrics, monitoring visit log |
| **Community Engagement Service** | Scorecard ingestion and aggregation, satisfaction index calculation, feedback incorporation tracking, disclosure compliance |
| **Reporting Service** | KPI aggregation queries, PDF/Excel report generation, scheduled report delivery |
| **Notification Service** | Event-driven notification dispatch via email and in-app channels |
| **Audit Service** | Middleware hook capturing all write operations to immutable audit log table |

#### Data Layer

**PostgreSQL (Primary Database)**
- Relational schema designed for referential integrity and auditability
- Separate schemas per domain (`bursary`, `loans`, `operations`, `community`, `reporting`, `auth`, `audit`)
- Row-level security policies enforcing constituency-scoped access at the database level

**Redis**
- Session store for JWT blocklist (logout invalidation)
- Cache layer for expensive KPI aggregation queries (TTL: 15 minutes)
- Job queue for background tasks (using Bull)

**File Storage (S3-compatible — MinIO on-premises or Zambian cloud provider)**
- Evidence attachments from monitoring visits
- Exported PDF reports
- Bulk import CSV templates

---

### 5.3 Domain Model

The core domain entities and their relationships:

```
Constituency
  ├── has many → BursaryApplications
  ├── has many → LoanGrantApplications
  ├── has many → MonitoringVisits
  ├── has many → CommunityEngagementSessions
  ├── has many → CitizenScorecards
  └── has many → QuarterlyReports

BursaryApplication
  ├── belongs to → Constituency
  ├── belongs to → Beneficiary
  ├── has many → DisbursementTransactions
  └── has many → AnnualStatusRecords (retention tracking)

LoanGrantApplication
  ├── belongs to → Constituency
  ├── belongs to → Beneficiary
  ├── has many → DisbursementTransactions
  ├── has many → RepaymentRecords (loans only)
  ├── has many → BusinessSurveyRecords
  └── has many → JobCreationRecords

Beneficiary
  ├── has many → BursaryApplications
  └── has many → LoanGrantApplications

FiscalPeriod (Year + Quarter)
  ├── has many → KPISnapshots
  └── defines → Reporting windows

SDGTarget
  ├── belongs to → FiscalPeriod
  └── has many → KPIResults
```

---

### 5.4 Data Model – Key Entities

#### `beneficiaries`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| nrc_number | VARCHAR(20) | Unique, indexed |
| full_name | VARCHAR(255) | |
| date_of_birth | DATE | |
| gender | ENUM | Female, Male, Other |
| disability_status | BOOLEAN | |
| disability_type | VARCHAR(100) | Nullable |
| constituency_id | UUID | FK → constituencies |
| phone | VARCHAR(20) | |
| created_at | TIMESTAMPTZ | |

#### `bursary_applications`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| beneficiary_id | UUID | FK → beneficiaries |
| constituency_id | UUID | FK → constituencies |
| school_name | VARCHAR(255) | |
| grade_level | VARCHAR(50) | |
| academic_year | INTEGER | e.g. 2025 |
| vulnerability_categories | TEXT[] | Array: orphan, PWD, rural |
| status | ENUM | Draft/Submitted/Approved/Disbursed/Active/Graduated/DroppedOut |
| approved_amount | DECIMAL(15,2) | |
| approved_by | UUID | FK → users |
| approved_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

#### `loan_grant_applications`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| beneficiary_id | UUID | FK → beneficiaries |
| constituency_id | UUID | FK → constituencies |
| programme_type | ENUM | Loan, Grant |
| beneficiary_category | ENUM | Youth, Women, Men, PWD |
| business_name | VARCHAR(255) | |
| business_sector | VARCHAR(100) | |
| requested_amount | DECIMAL(15,2) | |
| approved_amount | DECIMAL(15,2) | |
| application_date | DATE | |
| disbursement_date | DATE | Nullable until disbursed |
| expected_disbursement_date | DATE | For timeliness tracking |
| status | ENUM | Applied/UnderReview/Approved/PartiallyDisbursed/FullyDisbursed/Active/Completed/Defaulted |
| created_at | TIMESTAMPTZ | |

#### `repayment_records`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | |
| application_id | UUID | FK → loan_grant_applications |
| installment_due_date | DATE | |
| amount_due | DECIMAL(15,2) | |
| amount_paid | DECIMAL(15,2) | |
| payment_date | DATE | Nullable |
| payment_reference | VARCHAR(100) | |
| status | ENUM | Pending, Paid, Overdue, PartiallyPaid |

#### `citizen_scorecards`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | |
| constituency_id | UUID | FK → constituencies |
| fiscal_period_id | UUID | FK → fiscal_periods |
| accessibility_score | SMALLINT | 1–5 |
| timeliness_score | SMALLINT | 1–5 |
| fairness_score | SMALLINT | 1–5 |
| communication_score | SMALLINT | 1–5 |
| impact_score | SMALLINT | 1–5 |
| feedback_text | TEXT | Nullable |
| submitter_name | VARCHAR(255) | Nullable (anonymous allowed) |
| submitted_at | TIMESTAMPTZ | |

#### `audit_log`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | Primary key |
| user_id | UUID | FK → users |
| action | ENUM | CREATE, UPDATE, DELETE, LOGIN, EXPORT |
| module | VARCHAR(100) | e.g. bursary, loans |
| record_id | UUID | Affected record |
| field_name | VARCHAR(100) | Nullable (for UPDATE) |
| old_value | TEXT | Nullable |
| new_value | TEXT | Nullable |
| ip_address | INET | |
| timestamp | TIMESTAMPTZ | NOT NULL, no default trigger — set by app |

> Note: `audit_log` table grants INSERT only to the application role. No UPDATE or DELETE permissions are granted to any database role.

---

### 5.5 API Design

The API follows RESTful conventions with versioned endpoints under `/api/v1/`.

**Authentication**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/mfa/verify
```

**Bursary**
```
GET    /api/v1/bursaries                      # List (filtered)
POST   /api/v1/bursaries                      # Create
GET    /api/v1/bursaries/:id                  # Get single
PATCH  /api/v1/bursaries/:id/status           # Status transition
POST   /api/v1/bursaries/:id/disbursements    # Record disbursement
POST   /api/v1/bursaries/:id/annual-status    # Record retention status
GET    /api/v1/bursaries/kpis                 # KPI aggregates
```

**Loans & Grants**
```
GET    /api/v1/loans                          # List
POST   /api/v1/loans                          # Create
PATCH  /api/v1/loans/:id/status               # Status transition
POST   /api/v1/loans/:id/repayments           # Record repayment
POST   /api/v1/loans/:id/jobs                 # Record jobs created
POST   /api/v1/loans/:id/business-survey      # Record survival survey
GET    /api/v1/loans/kpis                     # KPI aggregates
```

**Reports**
```
GET    /api/v1/reports/dashboard              # National dashboard data
GET    /api/v1/reports/constituency/:id       # Constituency dashboard
POST   /api/v1/reports/generate               # Trigger report generation
GET    /api/v1/reports/:id/download           # Download report file
```

**Public (no auth required)**
```
POST   /api/v1/public/scorecards              # Submit citizen scorecard
GET    /api/v1/public/constituencies          # List constituencies
GET    /api/v1/public/disclosure/:constId     # Public transparency data
```

---

### 5.6 Security Architecture

**Transport Security**
- TLS 1.2+ enforced on all endpoints
- HTTP Strict Transport Security (HSTS) header
- Certificate pinning recommended for mobile applications

**Authentication & Authorisation**
- JWT access tokens (15-minute expiry) + refresh tokens (7-day expiry, rotated on use)
- Refresh token stored in HttpOnly, Secure, SameSite=Strict cookie
- RBAC enforced at the API middleware layer AND at the database row-level security (defence in depth)
- MFA via TOTP (Time-based One-Time Password)

**Data Protection**
- All PII fields encrypted at the application layer before database storage (AES-256)
- Field-level encryption keys managed via a secrets manager (HashiCorp Vault or AWS Secrets Manager equivalent)
- Database connection uses SSL; credentials never stored in environment files in production

**Input Security**
- Parameterised queries throughout (no string concatenation in SQL)
- Input validation and sanitisation on every API endpoint (Joi / Zod schemas)
- Rate limiting: 100 requests/minute per IP; 1000 requests/minute per authenticated user
- CORS whitelist to approved frontend domains only

---

### 5.7 Deployment Architecture

**Recommended Deployment (Government Data Centre / Cloud)**

```
Internet
    │
    ▼
[Load Balancer / Reverse Proxy — Nginx]
    │
    ├──▶ [Web App Server 1 — Node.js]  ─┐
    ├──▶ [Web App Server 2 — Node.js]  ─┤──▶ [PostgreSQL Primary]
    └──▶ [Static Files — Nginx CDN]    ─┘         │
                                                   ▼
                                         [PostgreSQL Replica]
                                              (read queries)
    [Redis Cluster]  ◀──  App Servers
    [MinIO / S3]     ◀──  App Servers (file storage)
    [Background Workers — Bull Queue]  ──▶ (notifications, report gen)
```

**Environments:** Development → Staging → Production (with database snapshots used to populate lower environments, with PII masked).

**CI/CD Pipeline:** GitHub Actions or GitLab CI → automated tests → Docker image build → deployment to staging → manual approval → production deployment.

---

## 6. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript | Component reuse, strong typing, large ecosystem |
| UI Library | Tailwind CSS + shadcn/ui | Rapid, accessible component development |
| Charts | Recharts | Declarative, composable data visualisation |
| State Management | React Query (TanStack) | Server state management with caching |
| Backend | Node.js 20 LTS + Express | JavaScript consistency, large ecosystem, async I/O |
| API Validation | Zod | Runtime validation + TypeScript type inference |
| ORM | Prisma | Type-safe database access, migration management |
| Primary DB | PostgreSQL 16 | ACID compliance, row-level security, JSON support |
| Cache / Queue | Redis 7 + Bull | Session management, background jobs, KPI caching |
| File Storage | MinIO (or AWS S3) | S3-compatible, can be self-hosted on government infrastructure |
| PDF Generation | Puppeteer / pdfkit | Server-side report rendering |
| Excel Export | ExcelJS | Structured Excel report generation |
| Authentication | Passport.js + JWT + TOTP | Flexible auth, MFA support |
| Email | Nodemailer + SMTP relay | Transactional notifications |
| Logging | Winston + structured JSON | Machine-readable logs for log aggregation |
| Monitoring | Prometheus + Grafana | Infrastructure and application metrics |
| Containerisation | Docker + Docker Compose | Environment consistency |
| Secret Management | HashiCorp Vault (or equivalent) | Secure credential storage |

---

## 7. Implementation Roadmap

### Phase 1 – Foundation (Months 1–3)
- Set up development environment, CI/CD pipeline, and database schema
- Implement Auth & User Management module (all roles, MFA, RBAC)
- Implement Bursary Management module (core CRUD + KPIs)
- Build base dashboard framework (national + constituency views)

### Phase 2 – Core Programmes (Months 4–6)
- Implement Loans & Grants Management module (full disbursement + repayment cycle)
- Implement job creation and business survival tracking
- Build Reporting module (quarterly report generation, PDF export)
- User acceptance testing with Constituency Officers

### Phase 3 – Engagement & Transparency (Months 7–9)
- Implement Community Engagement module
- Build Public Citizen Scorecard Portal
- Implement Public Disclosure Dashboard
- Notification system (email + in-app)
- Audit trail and compliance tooling

### Phase 4 – Analytics & Launch (Months 10–12)
- SDG cross-cutting indicator calculations and visualisations
- Advanced filtering and ad hoc reporting
- Performance optimisation and load testing
- Security penetration testing
- Pilot deployment with selected constituencies
- Staff training and documentation
- Full national rollout

---

*End of Document*
