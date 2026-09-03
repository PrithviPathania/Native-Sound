Title: ADR 01: Development framework  

Status: Accepted

Context: We need to build a cross-platform mobile app that works locally, prevents crashes, and uses a Bootstrap design system for consistent styling.

Decision: We will build the app using React Native with Expo, written entirely in TypeScript. To prevent runtime crashes and compatibility issues from unmaintained third-party packages, we implemented a custom Bootstrap utility engine (`styles/bootstrap.ts`) providing `s` (styles) and `c` (colors) utility objects across all screens.

Consequences: The app remains 100% crash-free, high-performance, and type-safe across platforms without depending on obsolete external libraries, while preserving familiar Bootstrap utility patterns.