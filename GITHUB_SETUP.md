# Push This Project to GitHub — Step-by-Step

Follow these steps to move your Browser extension projects (including Binance Execution Pro) to GitHub.

---

## Prerequisites

1. **Git** installed on your PC  
   - Check: open PowerShell and run `git --version`  
   - If missing: download from https://git-scm.com/download/win

2. **GitHub account**  
   - Sign up at https://github.com if you don’t have one.

---

## Option A: Push the whole "Browser extension" folder (all extensions)

### Step 1: Create a new repository on GitHub

1. Go to https://github.com/new  
2. **Repository name:** e.g. `browser-extensions` or `chrome-extensions`  
3. **Description:** optional (e.g. "Chrome extensions – Binance Execution Pro, AfriCart, etc.")  
4. Choose **Public** (or Private if you prefer).  
5. **Do not** check "Add a README", "Add .gitignore", or "Choose a license" — you already have files.  
6. Click **Create repository**.

### Step 2: Set your Git identity (one-time on this PC)

If you haven’t set Git user name/email before, run (use your real name and GitHub email):

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### Step 3: Initialize Git locally (if not done yet)

Git is already initialized in this folder. In PowerShell, run:

```powershell
cd "c:\Users\okeke\OneDrive\Desktop\PROGRAMS\Browser extension"

git add .
git commit -m "Initial commit: Browser extensions (Binance Execution Pro, AfriCart, etc.)"
```

### Step 4: Connect to GitHub and push

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and the repo name you chose (e.g. `browser-extensions`):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

- If GitHub asks for login, use **Personal Access Token** as password (not your GitHub account password).  
- Create a token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic), enable `repo`, then paste the token when Git asks for password.

---

## Option B: Push only "Binance Execution Pro"

If you want a **separate repo** just for the Binance extension:

### Step 1: Create a new repo on GitHub

1. Go to https://github.com/new  
2. **Repository name:** e.g. `binance-execution-pro`  
3. Leave "Add README" etc. **unchecked**.  
4. Click **Create repository**.

### Step 2: Set Git identity (if not done)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### Step 3: Initialize Git inside Binance Execution Pro

```powershell
cd "c:\Users\okeke\OneDrive\Desktop\PROGRAMS\Browser extension\Binance Execution Pro"

git init
git add .
git commit -m "Initial commit: Binance Execution Pro Chrome extension"
```

### Step 4: Add remote and push

Replace `YOUR_USERNAME` and `binance-execution-pro` with your details:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/binance-execution-pro.git
git branch -M main
git push -u origin main
```

---

## After the first push

- **Clone on another PC:**  
  `git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`

- **Later changes:**  
  ```powershell
  git add .
  git commit -m "Describe what you changed"
  git push
  ```

- **Ignore `node_modules`:**  
  Your `.gitignore` already has `node_modules/` — they won’t be pushed.

---

## Quick reference (whole folder, one-time setup)

| Step | Command |
|------|--------|
| 0. Set identity (once per PC) | `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"` |
| 1. Go to folder | `cd "c:\Users\okeke\OneDrive\Desktop\PROGRAMS\Browser extension"` |
| 2. First commit | `git add .` then `git commit -m "Initial commit"` |
| 3. Add GitHub remote | `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git` |
| 4. Push | `git branch -M main` then `git push -u origin main` |

Use **Option A** to have one repo for all extensions; use **Option B** for a repo that contains only Binance Execution Pro.
