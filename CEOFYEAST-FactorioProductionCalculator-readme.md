# fpc-app

## A web application for calculating and managing Factorio production chains, focusing on its client-side implementation.

## Table of Contents
*   [About](#about)
*   [Features](#features)
*   [Technology Stack](#technology-stack)
*   [Project Structure](#project-structure)
*   [Usage](#usage)
    *   [Installation](#installation)
    *   [Development Server](#development-server)
    *   [Building for Production](#building-for-production)
    *   [Linting](#linting)
    *   [Debugging](#debugging)

---

## About
This repository contains the client-side web application for the Factorio Production Calculator (FPC), part of a larger `fpc-app` project. It provides an interactive and user-friendly interface designed to assist players in planning and optimizing their Factorio factory production chains. Users can create accounts, manage saved factory configurations, and perform complex calculations to achieve their production goals.

## Features
*   **Production Chain Calculation:** Core functionality to define desired outputs and calculate necessary inputs, raw materials, and factory setups for Factorio.
*   **User Account Management:** Supports user registration, login, and secure session management.
*   **Save Slot System:** Allows authenticated users to save, load, and manage multiple distinct factory configurations across different save slots.
*   **Dynamic Navigation:** Features a top navigation bar (`TheTopNav`) and a side navigation bar (`TheSideNav`) for easy access to different views and tools within the application.
*   **Responsive Layout:** Adapts its interface to various screen sizes (small, medium, large) to ensure usability across different devices.

## Technology Stack
The client-side application is built using a modern JavaScript ecosystem:

*   **Frontend Framework:** [Vue.js 3](https://vuejs.org/) for building reactive user interfaces.
*   **State Management:** [Pinia](https://pinia.vuejs.org/) for intuitive and type-safe state management across components.
*   **Routing:** [Vue Router 4](https://router.vuejs.org/) for declarative routing within the single-page application.
*   **HTTP Client:** [Axios](https://axios-http.com/) for making API requests to the backend, including authentication and save slot interactions.
*   **Core Logic:** Integrates `@ceofyeast/prodchaincalculators` for complex production chain computations.
*   **Styling:** Utilizes plain CSS with custom CSS variables (`Global.css`) for consistent theming, alongside component-scoped styles (indicated by `[data-v-...]` attributes).
*   **Build Tooling:** [Vue CLI](https://cli.vuejs.org/) (powered by Webpack) for project scaffolding, development server, and production builds. Includes `NodePolyfillPlugin` for browser compatibility.
*   **Transpilation:** [Babel](https://babeljs.io/) to ensure broad browser compatibility for modern JavaScript features.

## Project Structure
The client application, referred to as `@ceofyeast/fpc-client`, follows a standard Vue CLI project structure:

*   `.vscode/`: Contains VS Code specific configurations, including `launch.json` for debugging.
*   `public/`: Static assets such as `index.html` (the main entry point) and `favicon.ico`.
*   `src/`: The main source directory for the Vue.js application.
    *   `assets/`: Stores global stylesheets, like `Global.css`.
    *   `components/`: Reusable Vue components (e.g., `TheTopNav`, `TheMain`).
    *   `scripts/`: Contains utility JavaScript files, API service modules (`accountsAPI.js`, `saveSlotsAPI.js`, `axios.js`), global constants (`globals.module.js`), and the application's routing logic (`router.js`).
    *   `store/`: Pinia store modules for managing application state (`loadedFactory.js`, `user.js`).
    *   `views/`: Top-level components representing distinct pages or views (e.g., `AccountAccessView`, `ProductionCalculatorView`, `AboutView`).
    *   `main.js`: The application's entry file, responsible for bootstrapping the Vue app.
*   `babel.config.js`: Babel configuration.
*   `jsconfig.json`: JavaScript language service configuration for VS Code.
*   `vue.config.js`: Vue CLI configuration for custom Webpack settings.

## Usage

This section provides comprehensive instructions on how to set up, run, build, and interact with the `fpc-app` client-side application.

### Installation
To set up the client-side application for development or production, you'll first need to ensure you have Node.js and a package manager (npm or Yarn) installed on your system. It's recommended to use a recent LTS (Long Term Support) version of Node.js.

1.  **Clone the repository:** If you haven't already, clone the entire `fpc-app` repository.
2.  **Navigate to the client directory:** This client application is designed to be part of a larger `fpc-app` monorepo. Assuming you are in the monorepo root, navigate to the `client/` subdirectory where this Vue.js application resides:
    ```bash
    cd client # Replace 'client' with the actual directory name if different
    ```
3.  **Install dependencies:** Once inside the client directory, install all necessary project dependencies using your preferred package manager:
    ```bash
    npm install
    # or
    yarn install
    ```
    This command downloads and installs all the packages listed in `package.json`, making the application ready for development or build.

### Development Server
To run the application in development mode, which provides a local server with hot-reloading capabilities, execute the following command:

```bash
npm run serve
```

This command will:
*   Start a development server, typically accessible at `http://localhost:3001` (as configured in `package.json` and `.vscode/launch.json`).
*   Compile the application with source maps for easier debugging.
*   Enable Hot Module Replacement (HMR), meaning that changes you make to the source code will automatically refresh in the browser without needing a full page reload, significantly speeding up development.
*   Provide detailed error messages in the console.

### Building for Production
When you're ready to deploy the application, you need to build it for production. This process optimizes the application for performance and size.

```bash
npm run build
```

Upon successful completion, this command will:
*   Compile and minify all JavaScript, CSS, and HTML assets.
*   Perform tree-shaking to remove unused code.
*   Generate static files (HTML, CSS, JavaScript bundles, images, etc.) into the `dist/` directory in the project root.
*   These optimized static files are ready to be served by any static web server (e.g., Nginx, Apache, or a cloud storage bucket like S3).

### Linting
To maintain code quality and consistency across the project, you can run the linter:

```bash
npm run lint
```

This command will:
*   Analyze your source code for programmatic errors, stylistic issues, and adherence to predefined coding standards (e.g., ESLint rules).
*   Report any identified issues in the console, helping you to catch potential bugs and ensure a consistent codebase.
*   It's highly recommended to run this command before committing changes.

### Debugging
The repository includes pre-configured debugging settings for Visual Studio Code (`.vscode/launch.json`), enabling a streamlined debugging experience.

To utilize these configurations, ensure you have the necessary VS Code extensions installed, such as "Debugger for Chrome" (often built-in or easily installable).

Here's how to use the provided launch configurations:

*   **`Launch Chrome against localhost`**:
    *   **Purpose:** This is the most common way to debug your running application. It automatically launches a new instance of Google Chrome, navigates it to the development server URL (`http://localhost:3001`), and attaches the VS Code debugger.
    *   **Usage:**
        1.  First, start the development server using `npm run serve` in a terminal.
        2.  In VS Code, go to the "Run and Debug" view (Ctrl+Shift+D or Cmd+Shift+D).
        3.  Select "Launch Chrome against localhost" from the dropdown menu at the top of the pane.
        4.  Click the green play button.
        5.  You can then set breakpoints in your Vue components and JavaScript files, inspect variables, and step through your code directly from VS Code.

*   **`Attach to Chrome`**:
    *   **Purpose:** This configuration allows you to attach the VS Code debugger to an *already running* Chrome instance that has been launched with remote debugging enabled. This is useful if you want to use your existing browser session or specific Chrome profiles for debugging.
    *   **Usage:**
        1.  Launch Chrome with the remote debugging port enabled. From your terminal, you can do this by running:
            ```bash
            "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\ChromeDebug" # Windows example
            # /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=~/ChromeDebug # macOS example
            ```
            (Adjust the path to your Chrome executable as needed, and `user-data-dir` to a temporary directory to avoid conflicts with your main profile).
        2.  Navigate your manually launched Chrome instance to `http://localhost:3001` (or wherever your development server is running).
        3.  In VS Code, select "Attach to Chrome" from the "Run and Debug" dropdown and click the green play button.
        4.  The debugger will attach to the Chrome instance, allowing you to debug as usual.

*   **`Debug Vue.js App`**:
    *   **Purpose:** This configuration is designed for debugging the `vue-cli-service serve` process itself, which runs as a Node.js process. This is less commonly needed for typical frontend debugging but can be useful for stepping through the build configuration, Vue CLI plugins, or any server-side logic if your `vue.config.js` contains complex server-side hooks or API proxy configurations.
    *   **Usage:** Select "Debug Vue.js App" from the "Run and Debug" dropdown and click the green play button. This will start the `serve` command in Node.js debug mode, and you can set breakpoints in files related to the Vue CLI service or `vue.config.js`.