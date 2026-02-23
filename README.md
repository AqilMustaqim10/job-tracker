# 🚀 JobTracker

A full-stack job application tracking app built with React, Supabase, and TanStack Query.

---

## ✨ Features

- 🔐 **Authentication** — Email/password login and signup via Supabase Auth
- 📋 **Table View** — Sortable columns (company, role, status, salary, date)
- 🗂️ **Kanban Board** — Visual pipeline grouped by job status
- 🔍 **Search & Filter** — Filter by company name, role, or status
- 📅 **Date Range Filter** — Filter jobs by applied date (From / To)
- 📤 **Export to CSV** — Download all your jobs as a spreadsheet
- 🔔 **Toast Notifications** — Feedback on every action
- 🎬 **Animations** — Smooth transitions with Framer Motion
- 📎 **Attachments** — View files attached to each job
- 📊 **Stats Dashboard** — Live counts per status

---

## 🛠️ Tech Stack

| Category           | Technology                      |
| ------------------ | ------------------------------- |
| Frontend           | React 18 + Vite                 |
| Styling            | Tailwind CSS v4 + Shadcn/ui     |
| Data Fetching      | TanStack Query (React Query v5) |
| Backend / Database | Supabase (PostgreSQL)           |
| Authentication     | Supabase Auth                   |
| Animations         | Framer Motion                   |
| Notifications      | Sonner                          |
| Deployment         | Vercel                          |

---

## 📦 Getting Started

### Prerequisites

- Node.js v20 or higher
- A Supabase account and project
- A GitHub account

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/job-tracker.git
cd job-tracker

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Find these in your Supabase dashboard → Settings → API

### Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Jobs table
CREATE TABLE jobs (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id),
  company_name text NOT NULL,
  job_title    text NOT NULL,
  status       text NOT NULL DEFAULT 'Applied',
  salary       text,
  location     text,
  job_url      text,
  notes        text,
  applied_date date,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Job attachments table
CREATE TABLE job_attachments (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id       uuid REFERENCES jobs(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_size    int4,
  file_type    text,
  storage_path text,
  created_at   timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_own_jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_jobs" ON jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_jobs" ON jobs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "select_own_attachments" ON job_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_attachments.job_id
    AND jobs.user_id = auth.uid()
  ));
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚀 Deployment

This app is deployed on **Vercel**. Every push to `main` triggers an automatic redeploy.

To deploy your own instance:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add your environment variables in Vercel's project settings
4. Click Deploy

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.js        # Supabase client
│   └── constants.js       # Status options, colors, empty form
├── hooks/
│   └── useJobs.js         # TanStack Query hooks (fetch, upsert, delete)
├── components/
│   ├── ui/                # Shadcn/ui components
│   ├── Auth.jsx           # Login / Signup screen
│   ├── Badge.jsx          # Status pill badge
│   ├── StatCard.jsx       # Dashboard stat card
│   ├── JobFormModal.jsx   # Add / Edit job form
│   ├── JobRow.jsx         # Table row
│   └── KanbanView.jsx     # Kanban board
└── App.jsx                # Main app component
```

---

## 👨‍💻 Developer

Built by **AqilMustaqim**

---

## 📄 License

MIT License — feel free to use this project for your own job search!
