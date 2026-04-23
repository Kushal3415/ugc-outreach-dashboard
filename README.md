# UGC Outreach Dashboard

Full-stack bulk email outreach dashboard for UGC creators to manage brand leads and send outreach campaigns.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS (deploy to Vercel)
- **Backend**: Node.js + Express (deploy to Render)
- **Database**: MongoDB Atlas
- **Email**: Gmail SMTP via Nodemailer

---

## Local Development

### 1. Clone & setup

```bash
git clone <repo>
cd ugc-outreach-dashboard
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Fill in your values (see below)
npm install
npm run dev     # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev     # starts on http://localhost:5173
```

Open http://localhost:5173 — no login required.

---

## Environment Variables (backend/.env)

```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ugc-outreach
JWT_SECRET=any_random_secret_string
CLIENT_URL=http://localhost:5173

GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_16_char_app_password
```

---

## MongoDB Atlas Setup

1. Create free account at https://cloud.mongodb.com
2. Create a new cluster (free M0 tier)
3. Database Access → Add user with read/write permissions
4. Network Access → Add IP `0.0.0.0/0` (allow all) or your server IP
5. Connect → Drivers → copy the connection string into `MONGODB_URI`

---

## Gmail SMTP Setup (App Password)

1. Enable 2-Step Verification on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a new app password (select "Mail" / "Other")
4. Copy the 16-character password into `GMAIL_PASS`

> Regular Gmail passwords will NOT work — you must use an App Password.

---

## CSV Upload Format

Upload a `.csv` file with these exact column headers:

```
Brand Name, Contact Name, Email, Website, Product Type
```

Duplicate emails are updated (upsert). Invalid emails are skipped.

---

## Deployment

### Backend → Render

1. Push code to GitHub
2. Create new **Web Service** on https://render.com
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all environment variables from `.env`

### Frontend → Vercel

1. Create new project on https://vercel.com
2. Root directory: `frontend`
3. Framework: Vite
4. Add environment variable: `VITE_API_URL=https://your-render-app.onrender.com/api`
5. Deploy

---

## Features

| Feature | Description |
|---------|-------------|
| Lead Funnel | 5 stages: Ready → Email Sent → Replied → Interested → Client |
| CSV Import | Bulk import leads with email validation |
| Email Templates | Create templates with `{Brand Name}`, `{Contact Name}`, `{Product Type}` placeholders |
| Bulk Email | Send to all Ready leads, max 50/batch, 60–120s random delay |
| Follow-Up | Auto-detect leads not replied in 3+ days and send follow-up |
| Email Logs | Full log of every email sent with search + date filters |
| Analytics | Dashboard with charts: emails per day + funnel conversion |

---

## Project Structure

```
ugc-outreach-dashboard/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/auth.js
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── components/   Sidebar, Navbar
        ├── context/      AuthContext (unused — no auth)
        ├── pages/        Dashboard, Leads, Templates, EmailLogs, Settings
        └── services/     api.js
```
