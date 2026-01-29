# Photo Core

A desktop photo management application built with Electron and React for organizing, tagging, and managing photography projects.

## Features

- **Multi-project Management** - Create and manage multiple photography projects
- **Image Organization** - Automatically organize images by type (RAW, JPG, Edited)
- **Memory Card Detection** - Detect memory cards and import images directly
- **Tagging System** - Global and per-image tagging for easy categorization
- **RAW File Support** - Extract thumbnails and preview RAW files (NEF, CR2, ARW, DNG)
- **Drag & Drop Import** - Easily import files via drag and drop
- **Advanced Filtering** - Filter images by type and tags
- **Folder Integration** - Quick access to project folders in file explorer

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, PostCSS |
| State Management | Zustand |
| Desktop Framework | Electron 28 |
| Photo Processing | exifr (EXIF metadata extraction) |
| File Watching | chokidar |

## Prerequisites

- Node.js 16 or higher
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/photo-core.git
cd photo-core
```

2. Install dependencies:

```bash
npm install
```

## Usage

### Development

Start the application in development mode with hot reload:

```bash
npm run start
```

Or use the alternative command:

```bash
npm run electron:dev
```

### Production Build

Build the application for production:

```bash
npm run build
```

The packaged application will be available in the `release/` directory.

### Preview

Preview the production build:

```bash
npm run preview
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server only |
| `npm run build` | Full production build |
| `npm run build:electron` | Compile Electron main process |
| `npm run preview` | Preview production build |
| `npm run electron:dev` | Development mode (Vite + Electron) |
| `npm run start` | Development with auto-launch |

## Project Structure

```
photo-core/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── stores/             # Zustand state management
│   ├── types/              # TypeScript interfaces
│   ├── styles/             # Global styles
│   ├── App.tsx             # Root component
│   └── main.tsx            # React entry point
├── electron/               # Electron main process
│   ├── main.ts             # Electron entry point
│   └── preload.ts          # IPC bridge
├── dist/                   # Built frontend (generated)
├── dist-electron/          # Built Electron (generated)
├── release/                # Packaged app (generated)
└── package.json
```

## How It Works

### Project Organization

Each project contains three subdirectories:

- `RAW/` - Original RAW format files
- `JPG/` - Converted/compressed versions
- `Editados/` - Post-processed/edited images

### RAW File Handling

Photo Core extracts embedded JPEG previews from RAW files for fast thumbnail display. Thumbnails are cached locally at `~/.photocore_cache/thumbnails/` using MD5-based cache invalidation.

**Supported RAW formats:** NEF, CR2, ARW, DNG, RAW

### State Management

The application uses Zustand for centralized state management, handling:

- Projects list and current project selection
- Image collections (recent and project-specific)
- Filter states
- Modal visibility
- Import progress tracking

## Build Targets

| Platform | Output Format |
|----------|--------------|
| Linux | AppImage, DEB |
| Windows | NSIS installer, Portable EXE |

## Configuration

### Tailwind Theme

The application uses a custom dark theme:

```javascript
{
  'app-bg': '#1a1a2e',        // Dark background
  'app-surface': '#16213e',   // Card/surface color
  'app-primary': '#0f3460',   // Primary UI color
  'app-accent': '#e94560',    // Accent color
}
```

### Path Aliases

TypeScript path alias `@/` maps to `src/` for cleaner imports:

```typescript
import { Component } from '@/components/Component'
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- [Electron](https://www.electronjs.org/) - Desktop framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [exifr](https://github.com/MikeKovaworked/exifr) - EXIF extraction
