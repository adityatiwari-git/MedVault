# MedVault — Women's Health Records & AI Assistant

MedVault is a women's health record application for storing health documents, tracking menstrual cycles, managing prescriptions, and accessing educational AI-assisted health information.

## Current migration

MedVault has been migrated from its original Trickle runtime to a standalone React application.

Target architecture:

```
React + Vite
    ↓
Supabase Auth
    ↓
Supabase PostgreSQL + Row Level Security
    ↓
Supabase private Storage
    ↓
Server-side AI endpoints
```

The original Trickle implementation is preserved under `legacy/trickle/` as an archived reference. It is not loaded by the active application.

## Features

- Email/password authentication
- Personal health profile
- Health document upload and categorisation
- Menstrual cycle tracking
- Prescription and reminder data
- AI-assisted health information
- Responsive dashboard and navigation

## Technology

- React 18
- Vite
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Server-side AI API boundary

## Local setup

1. Install Node.js.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local`.
4. Add the Supabase project URL and anon key.
5. Apply the SQL migrations in `supabase/migrations/` to your Supabase project.
6. Start the development server:

   ```bash
   npm run dev
   ```

## Environment variables

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
AI_API_KEY=
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

Only public Supabase browser settings use the `VITE_` prefix. AI provider credentials must remain server-side.

## Security notes

- Application tables use Row Level Security so users can access only their own records.
- Medical files are designed for a private Supabase Storage bucket with user-scoped paths.
- AI credentials are not intended to be exposed to the browser.
- MedVault should not be described as HIPAA-compliant or end-to-end encrypted until those claims are independently implemented and verified.

## Project structure

```
src/
├── components/          # React UI components
├── services/            # Auth, database/storage, and AI boundaries
├── lib/                 # Supabase client
├── App.jsx
├── main.jsx
└── styles.css

supabase/
└── migrations/          # Database, RLS, and storage policies

legacy/
└── trickle/             # Archived original implementation
```

## Migration status

- [x] Vite application foundation
- [x] React components moved into `src/`
- [x] Trickle implementation archived
- [x] Supabase client boundary
- [x] Auth service boundary
- [x] Database schema and RLS
- [x] Private storage policies
- [x] Direct Supabase service usage in active UI
- [x] Real Supabase project configured with Auth, PostgreSQL, RLS, and private Storage
- [x] Server-side AI API boundary
- [x] Removed active Trickle compatibility layer and hardcoded search credential
- [x] Production CI build workflow
- [ ] Configure deployment secrets and AI provider key
- [ ] Complete live browser smoke test after deployment

---
Last updated: September 30, 2026
