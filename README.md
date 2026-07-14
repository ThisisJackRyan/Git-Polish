# Git-Polish

## AI-powered tool to polish your GitHub repositories — generate READMEs, descriptions, and improvement checklists in seconds.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Usage](#usage)
  - [Web App](#web-app)
  - [CLI](#cli)
- [Architecture](#architecture)

---

## Overview

Git-Polish is a full-stack web application and CLI tool that connects to your GitHub account and uses Google Gemini AI to automatically improve your repositories. It analyzes your codebase and generates polished README files, concise repository descriptions, and actionable improvement checklists — all without leaving the browser or your terminal.

---

## Features

### 📄 README Generation
Analyzes your repository's source code, configuration files, and existing documentation to produce a professional, well-structured README in GitHub-flavored Markdown. You can preview the result, regenerate it with custom suggestions, and commit it directly to your repository.

### 🏷️ Repository Description
Reads your existing README and generates a concise, accurate one-liner description suitable for the GitHub repository "About" field. You can accept it and push it instantly, or regenerate until it fits.

### ✅ Improvement Checklist
Scans your repository and produces a prioritized Markdown checklist of improvements — missing documentation, structural issues, best practice violations, and more. Download it or copy it to your clipboard.

### 🖥️ CLI Support
Every feature available in the web app is also available via the `git-polish` CLI. Authenticate with GitHub, list your repositories, and run any of the AI tools directly from your terminal.

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **AI:** Google Gemini (`@google/genai`) via Firebase Cloud Functions
- **Auth:** Firebase Authentication with GitHub OAuth
- **Backend Functions:** Firebase Cloud Functions v2 (Node.js 22), two separate codebases — `readme` and `checklist`
- **Secrets:** Google Cloud Secret Manager
- **Markdown Rendering:** `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-raw`, `rehype-sanitize`, `github-markdown-css`
- **CLI:** Commander.js, Ora

---

## How It Works

1. **Connect** — Sign in with your GitHub account via Firebase Authentication. Git-Polish requests `repo` and `read:user` scopes to read and update your repositories.
2. **Select** — Browse your repositories with filtering by visibility and owner. Click **Polish** on any repo to open the action panel.
3. **Generate** — Choose an action (README, Description, or Checklist). Git-Polish calls a Firebase Cloud Function, which downloads your repository as a ZIP, extracts key files, and sends them to Gemini for analysis.
4. **Review & Apply** — Preview the AI-generated content in a modal with full Markdown rendering. Accept, regenerate with custom suggestions, download locally, or commit directly to GitHub.

---

## Usage

### Web App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Sign in with GitHub and navigate to your repositories to get started.

### CLI

Install globally or use directly after cloning:

```bash
npm install -g .
```

**Available commands:**

```bash
# Authenticate with GitHub
git-polish login

# List your repositories
git-polish list

# Generate a README for a repository
git-polish readme

# Generate a repository description
git-polish description

# Generate an improvement checklist
git-polish checklist

# Log out
git-polish logout
```

The CLI stores your GitHub token securely at `~/.git-polish-token` with `600` permissions. All commands that require authentication will prompt you to log in if no token is found.

---

## Architecture

```
git-polish/
├── src/
│   ├── app/
│   │   ├── api/              # Next.js API routes (proxy to Firebase functions)
│   │   ├── cli/              # CLI entry point and commands
│   │   ├── repos/            # Repository browser UI and modals
│   │   └── services/         # GitHub and Firebase service helpers
│   ├── components/           # Shared UI components (Navigation, Hero, Features, etc.)
│   └── contexts/             # React contexts for Auth and Theme
└── functions/
    ├── readme/               # Firebase function: ZIP download + Gemini README generation
    └── checklist/            # Firebase function: ZIP download + Gemini checklist generation
```

The two Firebase Cloud Functions each independently download the target repository as a ZIP archive via the GitHub API, extract and collect key source files, and submit them to Gemini with a tailored prompt. Results are returned as JSON to the Next.js API routes, which proxy them to the frontend or CLI.