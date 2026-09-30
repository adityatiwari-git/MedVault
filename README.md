# MedVault

MedVault is a simple, browser-based women’s health record project built with React and Vite.

It is intentionally local-only: there is no cloud backend and no external AI service.

## Features

- Local sign up and login
- Personal profile
- Health record management
- Local document storage in the browser
- Menstrual cycle tracking
- Prescription and reminder data
- Simple local health assistant
- Responsive dashboard

## How it works

All application data is stored in the current browser using:

- localStorage for accounts, profile data, records, cycles, prescriptions, and chat history
- IndexedDB for uploaded document files

This keeps the project easy to run as a normal frontend application.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

The production files are created in dist/.

## Deployment

This project is a static React/Vite application and can be deployed to any static-site host.

Typical settings:

Build command: npm run build

Publish directory: dist

## Important note

This is a local demo/prototype, not a medical-grade cloud system. Data is stored in the browser used to run the app. Clearing browser data can remove saved information, and the application does not provide cloud backup or medical-data compliance guarantees.

---

Last updated: October 1, 2026
