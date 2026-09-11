# Helix

<div align="center">

**A modern, fast Git desktop client built for clarity, speed, and developers.**

[![Electron](https://img.shields.io/badge/Electron-31.x-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## Overview

**Helix** is a cross-platform desktop Git client engineered to make repository exploration, branching, staging, and history visualization intuitive and fast. Combining the native power of **Electron**, the reactivity of **React 18** with **Zustand**, and the performance of `simple-git`, Helix provides a streamlined Git workflow with zero clutter.

---

## Key Features

- **Interactive Commit Graph**  
  Visualize branch topologies, merge commits, commit details, authors, and tag references with a clean visual tree.

- **Dedicated Working Tree Sidebar**  
  Dedicated right-panel working tree for staging, unstaging, and inspecting modified or untracked files with a built-in commit composer.

- **Unified & Split Diff Viewer**  
  Inspect file changes side-by-side or unified with syntax highlighting and hunk navigation.

- **Remote & Upstream Management**  
  Configure remote repositories (such as `origin`), fetch updates, pull branches, and handle upstream tracking effortlessly. Automatic confirmation pop-in prompts and configures `git push --set-upstream` whenever an untracked branch is pushed.

- **Real-Time Auto-Refresh**  
  Automatic repository synchronization powered by `chokidar` file watchers and window focus detection—no manual refresh button needed.

- **Multi-Tab Workspaces**  
  Open and switch between multiple local Git repositories seamlessly using tabbed workspaces.

- **Dark-Themed Modern UI**  
  Built with Radix UI accessible primitives and Tailwind CSS for a refined developer experience.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Desktop Shell** | [Electron 31](https://www.electronjs.org/) |
| **Frontend Framework** | [React 18](https://react.dev/) with [TypeScript 5](https://www.typescriptlang.org/) |
| **Build Tooling** | [electron-vite](https://electron-vite.org/) & [Vite 5](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) & [Lucide Icons](https://lucide.dev/) |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) |
| **Git Engine** | [simple-git](https://github.com/steveukx/git-js) |
| **Testing** | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) |
| **Packaging** | [electron-builder](https://www.electron.build/) |

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)
- **Git**: `v2.30.0` or higher installed and accessible in your system `PATH`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/helix.git
cd helix
npm install
```

---

## Development

Run Helix in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

This launches the Electron application with Vite dev servers for both renderer and main processes.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the app in development mode with live reload / HMR |
| `npm run build` | Compiles TypeScript and builds production bundles via `electron-vite` |
| `npm run preview` | Previews the production build locally |
| `npm test` | Runs unit and integration tests with Vitest |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:e2e` | Runs end-to-end tests using Playwright |
| `npm run package` | Builds and packages the app for the current operating system |
| `npm run package:win` | Packages the application for Windows (`.exe` installer / portable) |
| `npm run package:mac` | Packages the application for macOS (`.dmg`, `.zip`) |
| `npm run package:linux` | Packages the application for Linux (`.AppImage`, `.deb`) |

---

## Project Structure

```text
helix/
├── electron/                 # Electron main & preload processes
│   ├── main/                 # Main process entry, window management & IPC handlers
│   │   ├── index.ts          # Main process lifecycle
│   │   └── ipc/              # Typed IPC handlers (git, fs, etc.)
│   └── preload/              # Secure contextBridge API exposing gitAPI & fsAPI
├── src/                      # Renderer process (React application)
│   ├── components/           # Reusable UI components (Dialog, Button, Modals)
│   │   ├── modals/           # Modal dialogs (RemoteManager, SetUpstream, etc.)
│   │   └── ui/               # Design system primitives (Radix-based)
│   ├── features/             # Core application views
│   │   ├── repository/       # Toolbar, Graph view, Diff panel
│   │   └── working-tree/     # Working Tree sidebar, file staging & commit box
│   ├── hooks/                # Custom React hooks (useGit, useDiff, etc.)
│   ├── stores/               # Zustand stores (gitStore, repoStore)
│   ├── shared/               # Shared TypeScript types, schemas & IPC channels
│   └── utils/                # Graph algorithms, ref parsers & formatters
├── electron.vite.config.ts   # Electron-Vite multi-target build configuration
└── package.json              # Project dependencies, scripts and metadata
```

---

## Testing

Helix uses **Vitest** for unit and integration testing, and **Playwright** for end-to-end Electron validation:

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e
```

---

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
