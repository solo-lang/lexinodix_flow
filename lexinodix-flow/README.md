# Lexinodix Flow — Production MVP

The luxury ambient intelligence workspace. Built with Next.js, Supabase, and a modular AI provider layer.

---

## ✦ Quick Setup (5 Steps)

### Step 1 — Install dependencies

```bash
cd lexinodix-flow
npm install
```

### Step 2 — Create Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project
2. Go to **Settings → API** and copy:
   - Project URL
   - anon / public key
   - service_role / secret key

### Step 3 — Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GROK_API_KEY=your-grok-api-key
AI_PROVIDER=grok

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### Step 4 — Set up the database

1. In Supabase, go to **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Paste the entire file and click **Run**

This creates:
- All tables with proper schemas
- Row Level Security (RLS) policies
- Auto-profile creation trigger
- Storage bucket for file uploads

### Step 5 — Configure OAuth (optional but recommended)

In Supabase → **Authentication → Providers**:

**Google:**
1. Enable Google provider
2. Add your Google OAuth Client ID and Secret
3. (Get these from [Google Cloud Console](https://console.cloud.google.com))

**GitHub:**
1. Enable GitHub provider
2. Add your GitHub OAuth App credentials
3. (Get these from [GitHub Developer Settings](https://github.com/settings/developers))

Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

---

## 🚀 Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Architecture Overview

```
lexinodix-flow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/               # Login, Signup, OAuth callback
│   │   ├── dashboard/          # Home dashboard
│   │   ├── workspace/          # Workspace explorer + detail
│   │   ├── notes/              # Notes list + editor
│   │   ├── files/              # File manager
│   │   ├── chat/               # AI workspace chat
│   │   ├── search/             # Semantic search
│   │   ├── settings/           # User settings
│   │   └── api/                # Secure server-side API routes
│   │       ├── ai/             # AI provider (never exposes keys)
│   │       ├── files/          # File operations
│   │       ├── notes/          # Note CRUD
│   │       └── search/         # Search engine
│   ├── components/
│   │   ├── layout/             # Sidebar, TopBar, MobileNav
│   │   └── features/           # Chat, Files, Notes, Settings
│   ├── lib/
│   │   ├── ai/                 # AI provider abstraction layer
│   │   │   └── providers.ts    # Grok, OpenAI, Anthropic, Gemini
│   │   ├── supabase/           # Client, Server, Middleware
│   │   └── utils/              # Helpers and utilities
│   ├── types/                  # TypeScript definitions
│   └── middleware.ts           # Route protection
└── supabase/
    └── migrations/             # Database schema
```

---

## 🤖 AI Provider System

The app uses a modular AI abstraction layer. Switching providers requires **only one change** in `.env.local`:

```env
AI_PROVIDER=grok       # xAI Grok (default)
AI_PROVIDER=openai     # OpenAI GPT-4o
AI_PROVIDER=anthropic  # Anthropic Claude
AI_PROVIDER=gemini     # Google Gemini (coming soon)
```

Also add the corresponding API key:
```env
GROK_API_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

**Security:** All AI requests go through `/api/ai` (server-side). API keys are **never exposed** to the browser.

---

## 🔐 Security Features

- ✅ Row Level Security on all Supabase tables
- ✅ Explicit `user_id` checks in every API route
- ✅ Private storage bucket (signed URLs only)
- ✅ All AI requests server-side (keys never exposed)
- ✅ Input validation with Zod on all API routes
- ✅ XSS prevention via React's default escaping
- ✅ Protected routes via middleware
- ✅ Storage path isolation per user

---

## 📱 Responsive Design

- **Mobile**: Full bottom tab navigation, touch-friendly
- **Tablet**: Adaptive layout
- **Desktop**: Full sidebar navigation

---

## 🎨 Brand & Design System

| Token | Value |
|-------|-------|
| Primary Background | `#F5F1EE` |
| Dark Navy | `#011C26` |
| Deep Blue | `#072A40` |
| Neutral Gray | `#4F5459` |
| Warm Accent | `#BFACA4` |
| Font (Titles) | Sora |
| Font (Body) | Outfit |

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set all environment variables in Vercel dashboard under **Settings → Environment Variables**.

Update `NEXT_PUBLIC_APP_URL` to your production URL.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Backend | Supabase (Auth + DB + Storage) |
| Rich Text | TipTap |
| File Upload | react-dropzone |
| Validation | Zod |
| AI (Primary) | Grok (xAI) |
| AI (Future) | OpenAI, Anthropic, Gemini |

---

Built with precision. Designed for calm intelligence. ✦
