# Ramesh BG - Developer Portfolio

A modern, responsive, and interactive developer portfolio built with React, TypeScript, and Vite. This portfolio showcases my skills, experience, and projects with a focus on clean code, performance, and engineering aesthetics.

## 🚀 Features

-   **Modern Tech Stack**: Built with React 19, TypeScript, and Vite for blazing fast performance.
-   **Engineering Aesthetic**: "Matrix/Engineering" inspired theme with a dynamic grid background.
-   **Dark Mode Default**: Optimized for developer ergonomics with a deep green/black color palette.
-   **Interactive Animations**:
    -   **Framer Motion**: Smooth hover effects on navigation and cards.
    -   **GSAP ScrollTrigger**: Sections fade in and slide up gracefully on scroll.
    -   **Glitch Effect**: Custom decoding animation on the logo.
    -   **Animated Icons**: Usage of Lucide React for dynamic visual elements.
-   **Responsive Design**: Fully responsive layout using Tailwind CSS.
-   **SEO Optimized**: Semantic HTML and comprehensive meta tags for better discoverability.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS, Shadcn UI (components)
-   **Animations**: Framer Motion, GSAP (GreenSock)
-   **Icons**: Lucide React
-   **Package Manager**: pnpm (recommended)

## 🏃‍♂️ Getting Started

### Prerequisites

-   Node.js (v18+ recommended)
-   pnpm (v9+ recommended)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/folio.git
    cd folio
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Run the development server**:
    ```bash
    pnpm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🚢 Deployment

This project is configured for easy deployment to **GitHub Pages**.

### Deploying to GitHub Pages

1.  Ensure you have commited all your changes.
2.  Run the deploy script:
    ```bash
    pnpm run deploy
    ```
    This command acts as a shortcut for: `pnpm run build && npx gh-pages -d build -t`

    -   It builds the project to the `build` directory (or `dist` depending on Vite config, usually `dist` but script says `build`, ensuring config matches). *Note: Standard Vite builds to `dist`. The script uses `build`, so ensure your vite config output dir matches or the script points to `dist`. Default Vite uses `dist`.*

    *(Correction: The provided script uses `build`. If standard Vite is used, it outputs to `dist`. If you haven't changed verify `vite.config.ts`. If it defaults to `dist`, update the script or config.)*

## 📁 Project Structure

```
src/
├── components/         # React components
│   ├── layout/         # Layout components (Navbar, Background)
│   ├── sections/       # Page sections (Hero, About, Experience...)
│   ├── ui/             # Reusable UI components (Buttons, Cards...)
│   └── theme-provider.tsx
├── data/              # Static data for portfolio (resume, skills, etc.)
├── hooks/             # Custom React hooks (useScrollAnimation)
├── lib/               # Utilities (classes, helpers)
└── App.tsx            # Main application entry
```

## 📄 License

MIT © [Ramesh BG](https://github.com/rameshbg)
