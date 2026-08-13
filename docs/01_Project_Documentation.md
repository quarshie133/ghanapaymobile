# Project Documentation — GhanaPay Mobile

CSCD602 Advanced Software Engineering Capstone Project
University of Ghana

**Project Title**: GhanaPay Mobile
**Group Number/Name**: `TO BE COMPLETED BY PROJECT TEAM`
**Group Members**: `TO BE COMPLETED BY PROJECT TEAM`

## 1. Introduction

GhanaPay Mobile is a full-stack mobile-money wallet web application built
to demonstrate the complete software engineering lifecycle covered by
this capstone: requirements, design, implementation, testing, deployment,
and maintenance planning. It is explicitly an academic sandbox — it never
claims to move real money, verify a real bank/telecom account, or perform
real fraud detection where no such capability was actually built.

## 2. Problem statement

Ghana's mobile money ecosystem is a major driver of financial inclusion,
but building a production-grade wallet system touches nearly every
concern in software engineering: authentication, atomic financial
transactions, identity verification, role-based access control, and
regulatory-adjacent documentation. This project builds a functionally
real (though sandboxed) version of such a system to demonstrate mastery
of these concerns.

## 3. Aim and objectives

**Aim**: build a genuinely functional (not merely mocked) mobile wallet
application with real authentication, a real atomic transaction ledger,
and real role-based administration, backed by Firebase and deployed via
Netlify.

**Objectives**:
1. Replace an initial UI-only scaffold with real Firebase Authentication.
2. Implement a server-side, atomic wallet ledger that never trusts the
   client for balance calculations.
3. Build a real KYC document upload and admin review workflow with
   privacy-preserving document access.
4. Build a role-based admin console with real data, consistent across
   summary and detail views.
5. Establish honest documentation practices — clearly distinguishing
   implemented features from sandboxed/simulated ones from genuinely
   unbuilt future work, at every stage.

## 4. Stakeholder analysis

| Stakeholder | Interest |
|---|---|
| Course instructor/grader | Evidence of genuine software engineering practice, not just a working demo |
| Project team | A functioning, presentable, honestly-documented deliverable |
| End users (hypothetical) | A usable, trustworthy wallet experience — even though this is a sandbox, the UX and security patterns are real |
| Future maintainers | Clear documentation of what's real vs. simulated, so nobody mistakes sandbox behavior for production readiness |

## 5. Document index

All 26 documents from the original project brief are now produced, plus
two additional records specific to this project's AI-assisted development
process.

| # | Document | Covers |
|---|---|---|
| 01 | `01_Project_Documentation.md` | Overview, this file |
| 02 | `02_SRS.md` | Functional/non-functional requirements |
| 03 | `03_System_Analysis.md` | AS-IS/TO-BE analysis, feasibility |
| 04 | `04_System_Design.md` | Design patterns, module design |
| 05 | `05_Architecture.md` | Real Mermaid diagrams |
| 06 | `06_Database_Design.md` | Firestore collections, ER diagram |
| 07 | `07_UI_UX_Design.md` | Design system, real patterns used |
| 08 | `08_Implementation_Report.md` | Code statistics, phase narrative |
| 09 | `09_Testing_Report.md` | Automated test coverage |
| 10 | `10_User_Manual.md` | End-user guide |
| 11 | `11_System_Administration_Guide.md` | Admin operations guide |
| 12 | `12_Security_Architecture.md` | Real security measures |
| 13 | `13_Maintenance_and_Future_Evolution.md` | Maintenance strategy, roadmap |
| 14 | `14_Deployment_Guide.md` | Overview + checklist |
| 15 | `15_FIREBASE_GUI_SETUP_GUIDE.md` | Firebase Console setup |
| 16 | `16_NETLIFY_DEPLOYMENT_GUIDE.md` | Netlify deployment |
| 17 | `17_API_Documentation.md` | All 37 real API routes |
| 18 | `18_Database_Security_Rules.md` | Full rules + reasoning |
| 19 | `19_Requirements_Traceability_Matrix.md` | Requirement → status |
| 20 | `20_Test_Cases.md` | 20 manual test cases (planned, unexecuted) |
| 21 | `21_Defect_Log.md` | 12 real defects, root causes |
| 22 | `22_Risk_Register.md` | 12 real, scored risks |
| 23 | `23_Change_Log.md` | Real version history by phase |
| 24 | `24_Individual_Contribution_Report.md` | Per-student template |
| 25 | `25_References.md` | Real sources used |
| 26 | `26_README.md` | Setup, known limitations |
| — | `PROJECT_AUDIT.md` | Full 17-phase build history (the source most other docs draw from) |
| — | `SECURITY_TEST_REPORT.md` | Tested vs. reviewed vs. untested, explicitly distinguished |

## 6. How this project was actually built

Unlike a typical solo/team development process, this project was built
across an extended AI-assisted development session, in 16 distinct
phases, each verified (typecheck, build, and where possible, automated or
logic tests) before moving to the next. `docs/PROJECT_AUDIT.md` is the
complete, honest record of this — including phases where AI-generated
scaffold code was found to contain fabricated data (fake KYC verification
scores, invented admin names in an activity log) and was corrected, not
just extended. This is disclosed deliberately, per the project's own
academic-integrity requirements around AI-assisted development.

## 7. Conclusion

GhanaPay Mobile demonstrates a genuinely functional wallet application
architecture — real auth, real atomic transactions, real role-based
access control — built with explicit, maintained honesty about which
pieces are sandboxed (payment provider integration, fraud detection) and
which are simply not yet built (bulk payments, most admin reports,
savings goals). The project's most distinctive characteristic across its
documentation is a consistent refusal to blur "working" with "looks like
it's working" — evidenced concretely in the Defect Log's record of
fabricated data being found and removed, not merely features being added.
