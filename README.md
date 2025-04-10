# Gulp Build System

This project uses a Gulp-based build system for front-end development automation. It helps with tasks like image optimization, font conversion, file bundling, and project packaging.

## 📦 Available Commands

Below are the available Gulp commands you can run via the terminal.

### `gulp`

Runs the default Gulp build process. This usually includes compiling source files, copying assets, and launching the local development environment.

### `gulp open`

Starts the default Gulp process and opens the project in a new browser tab.

### `gulp start`

Runs a **full build from scratch**:
- Optimizes all images
- Converts fonts
- Processes source files
- Opens the project in a new browser tab

Use this when you want a clean build with all assets fully processed.

### `gulp clean`

Removes the `dist/` folder to ensure a clean build environment.

### `gulp folder`

Builds the entire project and compiles it into a ready-to-deploy **folder**.

### `gulp zip`

Builds the project and packages it into a **ZIP archive**. Useful for preparing the project for distribution or delivery.

## 🚀 Quick Start

```bash
npm install
gulp