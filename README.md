# MedVault — Women's Health Companion

MedVault is a women-focused health record web application built with React and Vite.

The project is being developed as a real product foundation rather than a throwaway prototype. The current release focuses on the core health-record experience, while the architecture is being prepared for a backend, doctor directory, AI assistant, and eventual mobile distribution.

## Core features

- Account sign up and login
- Personal health profile
- Body and health details
- Emergency contact information
- Health document upload and local file access
- Document categories and search
- Prescription and medicine records
- Medication reminder status
- Menstrual cycle tracking
- Cycle history, symptoms, flow, and notes
- Responsive dashboard and sidebar navigation

## Product roadmap

MedVault will be developed incrementally toward a broader women's health platform:

1. **Web foundation** — polish the current records, profile, prescription, cycle, document, validation, and responsive UI flows.
2. **Backend and database** — introduce secure server-side persistence, authentication, and user-controlled data management.
3. **Doctor directory** — structure and import a sourced doctor dataset and provide city/specialty search.
4. **AI health assistant** — add a backend-mediated AI service so API credentials stay outside the public frontend and GitHub repository.
5. **AI + MedVault context** — allow the assistant to work with appropriate user-provided health information while clearly avoiding unsupported diagnosis claims.
6. **Privacy and security hardening** — strengthen access control, secret management, validation, data deletion/export, and privacy documentation.
7. **Mobile-ready architecture** — keep the web product responsive and structured for a future Android application and Play Store release.

## Current data architecture

MedVault currently runs as a browser-local application.

- Account details are stored locally in the browser.
- Profile, prescription, and cycle data are stored locally.
- Uploaded health files are stored locally using IndexedDB.
- No external database or hosted authentication service is currently required.

This means the data stays tied to the browser/device where it was created. Clearing browser site data or moving to another device will not move the records with it.

When external services are introduced, secrets such as AI or database credentials will be supplied through local .env files and deployment environment variables. They must never be committed to GitHub.

## Local development

Install dependencies:

    npm install

Start the development server:

    npm run dev

Build the application:

    npm run build

## Health-data notes

MedVault is a software project for organizing personal health information. It should not be described as HIPAA-compliant, end-to-end encrypted, or a medical device unless those claims are separately implemented and verified.

---

Last updated: October 3, 2026

## 🤖 Scheduled Project Maintenance

This repository has its own GitHub Actions maintenance workflow. It is **repository-local**, so it uses GitHub's built-in GITHUB_TOKEN instead of a personal access token or cross-repository secret.

### What the .github/ folder is for

- .github/workflows/daily-maintenance.yml — runs scheduled repository maintenance.
- .github/maintenance/schedule.json — stores this repository's assigned dates and task names.
- .github/maintenance/run_task.py — contains the small, predefined task logic.

Assigned October 2026 work:

- **October 4** — document the current data/privacy model.
- **October 12** — document the development and verification workflow.
- **October 21** — document the backend boundary and secret-handling plan for AI and doctor-directory integrations.
- **October 29** — document the full product roadmap and completion direction.

The schedule is expressed in IST for planning. GitHub Actions converts the scheduled times through UTC cron internally.

> **No meaningful change = no commit and no pull request.**

The workflow does not use Claude, OpenAI, or another external AI coding service to generate repository changes.
