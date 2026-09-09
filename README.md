# FocusFlow (Clop) - Pomodoro Productivity App

FocusFlow (also known as Clop) is a modern, mobile-first productivity application designed around the Pomodoro Technique. It empowers users to manage tasks, focus on work sessions with customizable timers, track daily progress, and analyze productivity statistics over time.

---

## ✨ Features

- ⏱️ **Pomodoro Timer**: Interactive timer supporting Focus and Break sessions with custom durations, audio alerts, and progress visualization.
- 📋 **Task Management**: Create, categorize, organize, and complete daily tasks seamlessly.
- 📊 **Productivity Analytics & Streak Tracking**: Track total focus hours, session counts, daily goal progress, and active daily streaks.
- ⚙️ **Settings & Customization**: Customize display name, toggle push notifications and sound alerts, switch theme (Light/Dark mode), export backup data in JSON format, or clear history.
- 🔄 **Resilient Backend & Offline Storage Fallback**: Communicates with a backend API when online, and automatically falls back to local storage operations if the backend is unreachable or offline.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Radix UI Primitives](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/) (Unit/Integration) & [Playwright](https://playwright.dev/) (End-to-End)
- **Package Manager**: [pnpm](https://pnpm.io/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18.0.0` or higher
- `pnpm` (`v8` or `v10`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd my-v0-project
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   `.env.example` contents:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

4. **Start Development Server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

### Unit & Integration Tests (Vitest)

To run the unit and integration test suite covering `apiClient`, `AuthContext`, `Dashboard`, and `Onboarding`:

```bash
pnpm test
```

### End-to-End Tests (Playwright)

To execute the complete E2E test suite covering full user journeys (Splash screen, Onboarding, Authentication, Task creation, Timer controls, and Settings):

1. Start the application:
   ```bash
   pnpm build
   pnpm start
   ```

2. Run the E2E script:
   ```bash
   python3 __tests__/e2e.py
   ```

---

## 📦 Production Build

To build the application for production:

```bash
pnpm build
pnpm start
```

---

## 📄 License

MIT
