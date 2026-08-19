# BrightPath Academy — Complete (Phases 1–7)

An online learning platform for Nigerian secondary school students (JSS–SS3, WAEC/NECO/JAMB prep).

## Stack
- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript + React Server Components
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth (credentials provider, JWT sessions, role-based middleware)
- **Payments (Phase 5):** Paystack + Flutterwave, server-side verification only
- **Deploy targets:** Vercel (app) + Supabase/Railway/Render (Postgres)

## What's included in Phase 1
- Project structure and full Prisma schema (covers Phase 1–7 models so later phases don't require breaking migrations)
- Student registration (`/register`) with validation (Zod) and password hashing (bcrypt)
- Login (`/login`) via NextAuth credentials
- Role-based middleware — a student cannot reach `/dashboard/admin` etc. by changing the URL
- Landing page with all required sections (hero, features, subjects, how it works, pricing, testimonials placeholder, FAQ, CTA)
- Student dashboard with progress bars (data wiring for lessons/CBT arrives in Phase 2–3)
- Admin dashboard with live platform stats (student/teacher/course counts)
- Seed script: 6 starter subjects, 3 pricing plans, one default admin account

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and fill in real values
cp .env.example .env
# - DATABASE_URL: your Postgres connection string (Supabase/Railway/Render)
# - NEXTAUTH_SECRET: generate with `openssl rand -base64 32`

# 3. Push schema to the database
npm run db:push

# 4. Seed starter data (subjects, plans, admin login)
npm run db:seed

# 5. Run the dev server
npm run dev
```

Default admin login after seeding: `admin@brightpath.ng` / `ChangeMe123!` — change this password immediately in a real deployment.

## Security notes (Section 22 requirements already implemented)
- Passwords hashed with bcrypt (cost factor 12), never stored in plain text
- `middleware.ts` enforces role checks server-side on every request to `/dashboard/*` — this cannot be bypassed from the client
- Zod validates all registration input server-side (not just client-side)
- No payment secret keys anywhere in the repo — all read from `process.env` at runtime, and secret keys are only ever used in server-side code (API routes), never shipped to the browser

## What's new in Phase 2 (Education Engine)
- **Public course catalog** (`/courses`) — browse by subject, then class level
- **Course page** (`/courses/[subjectSlug]/[classLevel]`) — topics grouped by term, lessons listed with completion ticks for logged-in students
- **Lesson detail page** (`/lessons/[lessonId]`) — renders all 13 required sections (objectives, introduction, explanation, definitions, worked examples, diagrams, real-life applications, common mistakes, summary, practice questions; CBT quiz and assignment are clearly marked "coming in Phase 3/4" rather than being fake buttons)
- **Video lessons** — `VideoPlayer` component resumes from the student's last watched position and periodically saves progress; nothing is hard-coded, admins manage the video URL per lesson
- **"Mark as Completed"** — updates `Progress` immediately and reflects in the student dashboard's progress bars
- **Admin Content Manager** (`/dashboard/admin/content`) — forms to create subjects, courses, topics and lessons (with optional video) without touching source code, backed by full CRUD API routes under `/api/admin/*`
- **Student dashboard** now shows real enrolled courses, a "Continue Learning" card (last-touched incomplete lesson), and progress bars computed from actual completed/total lesson counts
- Sample content: Physics SS1 → Measurement topic → a fully written "Fundamental Quantities" lesson, seeded automatically

Run `npm run db:seed` again after pulling this update to get the sample Physics course and lesson.

## What's new in Phase 3 (CBT Examination System)
- **Question bank** (`/dashboard/admin/questions`) — admin/teacher form to add questions with exactly one correct option out of four, tagged by subject, class, term, topic and difficulty; full CRUD API at `/api/admin/questions`
- **Exam builder** (`/dashboard/admin/exams`) — auto-pulls a random set of matching questions from the bank into a timed exam based on subject/class/difficulty/question count
- **Student CBT flow** (`/exams`):
  - Exam list filtered to the student's class, showing best score so far
  - **Start/resume** — refreshing mid-exam resumes the same attempt rather than losing progress or restarting the timer
  - **Taking the exam** — countdown timer (auto-submits at zero), question number panel with answered/unanswered indicators, Previous/Next navigation, answers saved as you go
  - **Randomization** — both question order and option order are shuffled per attempt (deterministically, so refreshing doesn't reshuffle mid-attempt), so different students get different orders
  - **Auto-marking on submit** — score, percentage, grade (A–F) and time used are computed server-side
  - **Results & review** — "Your Score: X/Y", correct/wrong/unanswered counts, and a full per-question review showing the student's answer vs. the correct answer, the explanation, the topic tested, and a "Review this topic" link back to the relevant lesson when the answer was wrong
- Student dashboard's "Recent Test Scores" now shows real attempts
- Seed script adds 5 sample Physics questions and a ready-to-take "Measurement Practice Test" exam

## What's new in Phase 4 (Live Learning)
- **Teacher accounts** (`/dashboard/admin/teachers`) — admin creates teacher logins and assigns subjects; teachers can then log in and reach `/dashboard/teacher`
- **Teacher dashboard** — stats matching the spec (Total Students, Average Score, Completed Lessons %, Pending Assignments), plus quick links into every teacher tool
- **Live classes**:
  - Teacher side (`/dashboard/teacher/live-classes`) — schedule with subject/topic/class/date/time/description/meeting link (any Zoom/Meet URL, fully configurable, nothing hard-coded); add a recording link after the session ends
  - Student side (`/live-classes`) — filtered to the student's class, shows a pulsing **LIVE NOW** badge during the scheduled hour, a **Join Class** button linking straight to the meeting, and a **Watch Recording** button once the teacher uploads one
- **Assignments**:
  - Teacher side (`/dashboard/teacher/assignments`) — create assignments with instructions and a due date; expand any assignment to see submissions and grade them (score + feedback)
  - Student side (`/assignments`) — status badges (Pending / Submitted / Graded / Overdue), submit as text or a file link, see score and feedback once graded, resubmit before grading
- **Announcements** (`/dashboard/teacher/announcements`) — send to all students or all parents; each announcement also fans out as an in-app `Notification` row per recipient (ready for the Phase 7 notification center)
- Seed script adds a sample teacher (`teacher@brightpath.ng` / `ChangeMe123!`) assigned to the Physics SS1 course, plus one sample live class and one sample assignment

## What's new in Phase 5 (Payments)
- **Real payment integration** (`lib/payments.ts`) — server-side Paystack and Flutterwave initialize/verify calls; secret keys are read from `process.env` only inside API routes and are never sent to the browser
- **Checkout flow** (`/pricing`):
  - Real plans pulled from the `Plan` table (also used on the public landing page pricing section — no more hardcoded prices)
  - BASIC/STANDARD require picking subjects up to the plan's limit; PREMIUM auto-unlocks everything
  - Choice of Paystack or Flutterwave, redirects to the provider's real checkout page
- **Verification** (`/api/payments/verify`, `/payment/callback`) — the transaction is re-verified server-side against the provider's API (never trusts the client-side redirect alone) before activating anything; idempotent if the student refreshes the callback page
- **Subscription activation** — on verified payment: `Subscription` flips PENDING → ACTIVE with start/expiry dates (30-day cycle), and the student is auto-`Enrolled` in a course per paid subject (or every subject, for PREMIUM)
- **Access control**:
  - `lib/subscription.ts` — `hasAccessToSubject()` and `hasLiveClassAccess()` are checked on every gated page
  - Lesson pages show objectives + introduction free, then lock the rest (video, explanation, worked examples, etc.) behind an upsell if the subject isn't covered by an active subscription
  - Live classes are locked behind the PREMIUM plan specifically, with a clear "🔒 Upgrade to join" message
- **Subscription status** on the student dashboard — Active/Expired banner with plan name, expiry date, and an automatic "expires in N days" reminder inside 7 days of expiry
- **Admin tools**:
  - `/dashboard/admin/plans` — edit price, subject limit, live-class inclusion, and active status for BASIC/STANDARD/PREMIUM, no code changes needed
  - `/dashboard/admin/payments` — Total Revenue, Revenue This Month, Active Subscriptions, and a full transaction/subscription log
  - Admin dashboard stats now show real revenue figures instead of placeholders

### Payment provider setup
To actually process payments, add real (test or live) keys to `.env`:
```
PAYSTACK_SECRET_KEY="sk_test_..."
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-..."
NEXTAUTH_URL="https://your-deployed-domain.com"  # used to build the payment callback URL
```
Without valid keys, `/api/payments/initiate` will return a clear error rather than silently failing.

## What's new in Phase 6 (Parent Portal)
- **Parent self-registration** (`/register/parent`) — a parent creates their own login with the same phone number they gave when their child registered; the system auto-links every matching student as a child under that account (multiple children, one login)
- **Retroactive linking** — `Student.parentPhone` is now always stored at student registration time (even if the parent hasn't signed up yet), so linking works correctly whenever the parent registers, in either order
- **Parent dashboard** (`/dashboard/parent`) — one card per child showing class, subscription status, subject progress at a glance, live-class attendance (last 30 days), and any weekly warnings
- **Per-child detail page** (`/dashboard/parent/[studentId]`) — full breakdown: subject performance with progress bars, recent CBT scores, assignment scores/status, live class attendance, and upcoming live classes; ownership-checked so a parent can only ever open their own children's pages
- **Low-performance warnings** — automatically flags any subject with zero completed lessons in the last 7 days, e.g. *"Chidi has not completed any Physics lesson this week."*
- **Live class attendance tracking** — clicking "Join Class" now records a `LiveClassAttendance` row (first-join time), which powers the attendance figures shown to parents
- Subscription status (Active/Expired, plan, dates, amount) is visible to parents exactly as it is to students

## What's new in Phase 7 (Polish)
- **Notification center** (`/notifications`) — every in-app notification (announcements, payment confirmations, and future lesson/exam/live-class alerts) is listed with unread indicators; a bell icon in the nav shows a live unread count; mark one or "mark all as read" in one tap. The architecture (`Notification` model, one row per recipient) is already the right shape to add email/SMS/WhatsApp delivery later — just add a delivery step wherever `notification.create` is called.
- **Global search** (`/search`, nav search box) — searches subjects, topics, lessons and teachers by name in one query, exactly as specced ("Newton's laws" → matching Physics lessons); results link straight into the relevant course, lesson, or topic.
- **Analytics dashboards**:
  - Admin (`/dashboard/admin/analytics`) — 30-day charts for new signups, lessons completed, CBT attempts, average CBT score, revenue, and most popular subjects by enrollment, plus headline stat cards
  - Teacher (`/dashboard/teacher`) — the same chart engine scoped to just the teacher's subjects (signups/revenue charts are omitted since they aren't teacher-specific metrics)
  - Built with `recharts`; all figures come from real database records (`Student`, `Progress`, `ExamAttempt`, `Payment`), no mock data
- **Mobile / PWA**:
  - `manifest.json` + app icons make BrightPath Academy installable on a phone home screen
  - A minimal service worker (`public/sw.js`) caches the app shell and serves a friendly offline page (`/offline.html`) instead of a browser error when connectivity drops — deliberately does **not** cache API responses, lessons, or video, since that content must always be fresh
  - `loading.tsx` skeletons on the heaviest routes (dashboard, courses, exams, search, analytics) give instant feedback on slow connections instead of a blank screen
- **SEO** — dynamic `sitemap.xml` (every subject/class course page) and `robots.txt`, rich per-app metadata (Open Graph tags, keywords, title template) in the root layout
- **AI-ready architecture** (`lib/ai.ts`) — defines the exact interface every future AI feature from the spec will implement (tutor Q&A, explanation generation, practice-question generation, weak-topic detection, study-plan generation). None of it calls a paid LLM yet by design — v1 stays free of per-request AI costs — but a real `/dashboard/student/ai-tutor` chat UI and `/api/ai/tutor` route are already wired end-to-end, so switching on a real model later is a one-function change with no UI rework

## Phase roadmap
| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation: auth, roles, landing page, student/admin dashboards | ✅ Delivered |
| 2 | Education engine: subjects → courses → topics → lessons, video, progress tracking | ✅ Delivered |
| 3 | CBT engine: question bank, timed exams, auto-marking, results | ✅ Delivered |
| 4 | Live learning: teacher dashboard, live classes, assignments, announcements | ✅ Delivered |
| 5 | Payments: Paystack/Flutterwave, subscriptions, access control | ✅ Delivered |
| 6 | Parent portal | ✅ Delivered |
| 7 | Polish: notifications, search, analytics, PWA, AI-ready hooks | ✅ Delivered |

Every phase ships working, testable code before the next one begins — no placeholder buttons that do nothing.
