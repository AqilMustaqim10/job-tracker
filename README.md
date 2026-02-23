# 🚀 JobTracker

A full-stack job application tracking app built from scratch with React, Supabase, and TanStack Query.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase&logoColor=white&style=flat-square)
![TanStack Query](https://img.shields.io/badge/TanStack-Query-ff4154?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss&logoColor=white&style=flat-square)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-black?logo=framer&logoColor=white&style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel&logoColor=white&style=flat-square)

---

## ✨ Features

### 📋 Job Management

- Add, edit, and delete job applications
- Track status through the full pipeline: **Wishlist → Applied → Interview → Offer → Accepted / Rejected**
- Add notes, salary, location, job URL, and applied date per job

### 🗂️ Views

- **Table View** — sortable columns (company, role, status, salary, date)
- **Kanban Board** — visual pipeline with **drag and drop** between columns

### 🔍 Search & Filter

- Search by company name or job title
- Filter by status
- Filter by applied date range (From / To)

### 📎 Attachments

- Upload files (PDF, Word, Excel, Images) per job
- View and download attachments
- Delete attachments

### 🔐 Authentication

- Email and password login / signup
- Each user sees only their own data (Row Level Security)
- Logout from anywhere

### 🎨 UI & UX

- Smooth animations with Framer Motion
- Toast notifications for every action
- Empty state illustrations
- Styled violet scrollbar on kanban
- Export all jobs to CSV

---

## 🛠️ Tech Stack

| Category           | Technology                  |
| ------------------ | --------------------------- |
| Frontend           | React 18 + Vite             |
| Styling            | Tailwind CSS v4 + Shadcn/ui |
| Data Fetching      | TanStack Query v5           |
| Backend / Database | Supabase (PostgreSQL)       |
| Authentication     | Supabase Auth               |
| File Storage       | Supabase Storage            |
| Animations         | Framer Motion               |
| Drag & Drop        | dnd-kit                     |
| Notifications      | Sonner                      |
| Deployment         | Vercel                      |

---

## 📦 Getting Started

### Prerequisites

- Node.js v20 or higher
- A Supabase account and project
- A Vercel account (for deployment)

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

### Storage Setup

1. Go to Supabase → Storage → New Bucket
2. Name it `job-attachments`
3. Enable **Public bucket**
4. Run these policies in SQL Editor:

```sql
CREATE POLICY "upload_own_files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "read_own_files"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "delete_own_files"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
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
3. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel's environment variables
4. Click Deploy
5. Go to Supabase → Authentication → URL Configuration and add your Vercel URL as the Site URL

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.js           # Supabase client
│   └── constants.js          # Status options, colors, empty form
├── hooks/
│   └── useJobs.js            # All TanStack Query hooks
│                               (useJobs, useUpsertJob, useDeleteJob,
│                                useAttachments, useUploadAttachment,
│                                useDeleteAttachment, useUpdateJobStatus)
├── components/
│   ├── ui/                   # Shadcn/ui components
│   ├── Auth.jsx              # Login / Signup screen
│   ├── Badge.jsx             # Status pill badge
│   ├── StatCard.jsx          # Dashboard stat card
│   ├── JobFormModal.jsx      # Add / Edit job form
│   ├── AttachmentsPanel.jsx  # Upload, view, delete attachments
│   ├── JobRow.jsx            # Table row
│   └── KanbanView.jsx        # Kanban board with drag and drop
├── App.jsx                   # Main app + JobDetailModal
├── main.jsx                  # Entry point + QueryClient
└── index.css                 # Tailwind + custom scrollbar
```

---

## 👨‍💻 Developer

Built by **AqilMustaqim**

---

## 📄 License

MIT License — feel free to use this project for your own job search!
