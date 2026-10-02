# MedVault — Women's Health Companion

MedVault is a women-focused health record application built with React and Vite.

This stage intentionally focuses only on the core application experience. Additional modules can be added later one at a time.

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

## Current product scope

The current version does **not** include:

- AI chatbot or AI health assistant
- Doctor directory or nearby-doctor search
- Location services
- Cloud database or hosted authentication
- Other future modules

Those features will be added separately after the core application is stable.

## Data architecture

MedVault currently runs as a browser-local application.

- Account details are stored locally in the browser.
- Profile, prescription, and cycle data are stored locally.
- Uploaded health files are stored locally using IndexedDB.
- No external database, authentication service, API key, or cloud storage is required.

This means the data stays tied to the browser/device where it was created. Clearing browser site data or moving to another device will not move the records with it.

## Local development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

## Health-data notes

MedVault is a software project for organizing personal health information. It should not be described as HIPAA-compliant, end-to-end encrypted, or a medical device unless those claims are separately implemented and verified.

---

Last updated: October 1, 2026

## 🤖 Scheduled Project Maintenance

This repository has its own GitHub Actions maintenance workflow. It is **repository-local**, so it uses GitHub's built-in `GITHUB_TOKEN` instead of a personal access token or cross-repository secret.

### What the `.github/` folder is for

- `.github/workflows/daily-maintenance.yml` — runs the scheduled maintenance workflow.
- `.github/maintenance/schedule.json` — stores this repository's assigned dates and task names.
- `.github/maintenance/run_task.py` — contains the simple, predefined task logic.

The workflow runs at **09:00 IST (03:30 UTC)** and can also be started manually.

Assigned October 2026 dates:
- 2026-10-13
- 2026-10-22

> **No meaningful change = no commit and no pull request.**

The workflow does not use Claude, OpenAI, or another external AI coding service.
