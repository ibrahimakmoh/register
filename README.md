# Register

Mobile-first attendance and payment tracking. Upload a student list (Excel/CSV from Microsoft Forms or anywhere), tick off attendance on your phone, export a filled-in Excel at the end.

---

## Deploy to GitHub Pages → install on your phone

The goal: your app lives at something like `https://<your-github-username>.github.io/register/`, and you add it to your phone's home screen so it opens like a native app.

### Step 1 — Put the code on GitHub

1. Go to **[github.com/new](https://github.com/new)** (sign up if you haven't).
2. Repository name: `register` (or whatever you like).
3. Set it **Public**. Leave everything else as default. Click **Create repository**.
4. On the empty repo page, click **"uploading an existing file"** (it's a link in the quick-start text).
5. Drag **every file and folder from this project** into the upload area — `src/`, `public/`, `.github/`, `index.html`, `package.json`, `vite.config.js`, `.gitignore`, and this `README.md`. The hidden `.github` folder is important — that's what makes GitHub auto-build the app. If your OS hides dotfiles, enable "show hidden files" before dragging.
6. Scroll down and click **Commit changes**.

### Step 2 — Turn on Pages

1. In your repo, click **Settings** (top-right tab).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**. (Don't pick "Deploy from a branch".)
4. Done. No save button — the dropdown saves itself.

### Step 3 — Watch it build

1. Click the **Actions** tab at the top of your repo.
2. You should see a workflow called "Deploy to GitHub Pages" running (yellow dot) or already complete (green tick). First build takes ~1–2 minutes.
3. When it's done, go back to **Settings → Pages**. Your URL is at the top: `https://<your-username>.github.io/<repo-name>/`. Copy it.

### Step 4 — Install on your phone

**iPhone (Safari):**
1. Open the URL in **Safari** (not Chrome — Add to Home Screen only works properly from Safari on iOS).
2. Tap the **Share** button (square with up-arrow).
3. Scroll down, tap **Add to Home Screen**.
4. Tap **Add**. The Register icon now sits on your home screen and opens full-screen like a real app.

**Android (Chrome):**
1. Open the URL in Chrome.
2. Tap the **⋮** menu, then **Install app** (or **Add to Home screen**).
3. Confirm. Icon lands on your home screen.

---

## Making changes later

Edit any file directly on github.com (click a file → pencil icon → edit → commit). Every commit triggers a fresh build and auto-deploys within a minute or two. Your phone's installed version picks up the new code next time you open it (force-refresh if needed).

---

## How the app actually works

- **Data lives on your device.** The app uses the browser's local storage, so sessions you create on your phone won't appear on another phone. To move a session between devices: export Excel from device A → upload it on device B (the app remembers attendance/payment state on re-import).
- **Round-trippable Excel.** The exported file has two sheets: the full register (original columns + attendance, paid-on-day, payment status) and a Summary sheet with totals and a gender breakdown. Re-uploading it reconstructs the state.
- **Offline-friendly.** Once loaded, the app works without internet. Your next visit is instant.
- **No backend.** No accounts, no servers, no API keys, no cost. Just a static HTML/JS bundle on GitHub's CDN.

---

## Alternative: Vercel (easier if GitHub Actions feels fiddly)

If the GitHub Pages setup gives you trouble:

1. Push the code to GitHub as above (Steps 1 only — skip Pages).
2. Go to **[vercel.com](https://vercel.com)**, sign in with your GitHub account.
3. Click **Add New → Project → Import** your repo.
4. Accept all defaults, click **Deploy**. Done in 30 seconds.
5. You'll get a URL like `register-yourname.vercel.app`. Use that on your phone instead.

Vercel handles auto-deploys the same way on every commit, and gives you a nicer URL.

---

## Running it locally (optional)

If you want to tinker on your computer first:

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173/`). Edit `src/App.jsx` — the page hot-reloads.

To check the production build:

```bash
npm run build
npm run preview
```

---

## Tech

- **Vite** — build tool
- **React 18** — UI
- **[@e965/xlsx](https://www.npmjs.com/package/@e965/xlsx)** — Excel/CSV read and write (SheetJS fork on npm)
- **lucide-react** — icons
- **Instrument Serif + Instrument Sans** — fonts, loaded from Google Fonts
- No service worker yet — the app is installable as a PWA but doesn't cache offline. Add one if you need true offline support.

## Licence

Use however you like within your institute.
