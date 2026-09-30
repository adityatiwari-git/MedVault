# MedVault — Women's Health Records & AI Assistant

MedVault is a women's health record application for storing health documents, tracking menstrual cycles, managing prescriptions, and accessing educational AI-assisted health information.

## Current architecture

MedVault has been migrated from its original Trickle runtime to a standalone React application.

Target architecture:

```
React + Vite
    ↓
Netlify
    ↓
Supabase Auth
    ↓
Supabase PostgreSQL + Row Level Security
    ↓
Supabase private Storage
    ↓
Netlify serverless AI function
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
- Netlify
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Netlify serverless function for AI requests

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

## Netlify deployment

1. Import the GitHub repository into Netlify.
2. Use the repository root as the project directory.
3. Netlify will use `netlify.toml` for the build command, publish directory, serverless function directory, and AI route.
4. Add the following environment variables in Netlify:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
AI_API_KEY=
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

5. Deploy the `main` branch.
6. Set `AI_API_KEY` before testing the AI assistant. The server-side AI function will remain unavailable until an AI provider key is configured.
7. Complete the live browser smoke test for authentication, records, cycle tracking, and AI features.

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are browser-visible configuration values. The AI provider credentials must remain server-side.

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

netlify/
└── functions/
    └── ai.cjs           # Server-side AI function

supabase/
└── migrations/          # Database, RLS, and storage policies

legacy/
└── trickle/             # Archived original implementation
```

## Migration and deployment status

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
- [x] Netlify deployment configuration
- [x] Netlify AI serverless function
- [ ] Configure Netlify environment variables and AI provider key
- [ ] Complete live browser smoke test after deployment

---
Last updated: October 1, 2026
