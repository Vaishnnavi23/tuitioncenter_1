# Tuition Center Portal — Setup Guide

Everything here is free. No paid API, no build tools — plain HTML/CSS/JS + Supabase.

## 1. Set up Supabase

1. Go to supabase.com → create a free project.
2. Open **SQL Editor** → paste the entire contents of `sql/schema.sql` → Run.
3. Go to **Authentication → Providers** → make sure "Email" is enabled.
   - Recommended for testing: **turn OFF "Confirm email"** (Authentication → Settings → Email Auth) so new accounts can log in immediately without clicking a confirmation link. You can turn it back on later.
4. Create your first Admin account:
   - Go to **Authentication → Users → Add user** → enter your email + a password.
   - Copy that user's UUID.
   - Back in SQL Editor, run:
     ```sql
     insert into profiles (id, role, name) values ('PASTE-UUID-HERE', 'admin', 'Your Name');
     ```
5. Go to **Settings → API** → copy your **Project URL** and **anon public key**.

## 2. Connect the frontend

Open `js/supabaseClient.js` and replace:
```js
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```
with the values from step 1.5.

## 3. Run it

This is a static site — no server needed. Easiest options:

- **VS Code**: install the "Live Server" extension, right-click `index.html` → "Open with Live Server"
- **Or**: `npx serve .` from inside the project folder (requires Node, still free)
- **To go live for free**: drag-and-drop the whole folder into Netlify Drop (netlify.com/drop), or use GitHub Pages

## 4. Log in

Use the admin email/password you created in step 1.4. From the Admin dashboard you can:
- Add teachers and students (creates their login + profile in one step)
- Assign students to teachers
- Create classes (each gets a unique Jitsi video room automatically)

Teachers can then mark attendance and post homework — each action generates a
WhatsApp message you copy and paste manually. No WhatsApp account/API needed,
so there's no cost.

## Notes & limits
- Supabase free tier: project pauses after 1 week of inactivity (just reopen it in the dashboard to wake it up), 500MB database — plenty for a small tuition center.
- Video calls use the free public Jitsi server (`meet.jit.si`) — no account needed, unlimited use.
- If you outgrow the "copy-paste WhatsApp" flow later, the message-generation functions in `js/whatsapp.js` are already written — you'd just add a paid WhatsApp Business API call instead of the copy button.
