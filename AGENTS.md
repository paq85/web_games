# Project Guidelines

## Repository Scope
- This repository contains a static launcher at the root and standalone web apps in subdirectories such as `pong/` and `flappy_bird/`.
- Keep each app's code, assets, docs, and tests inside that app's directory.

## App Independence (Critical)
- **Every app is completely independent.** There are no shared conventions, shared libraries, shared build tooling, or shared patterns between apps.
- When creating a new app, do NOT look at how other apps were built. Do NOT copy patterns, structures, or tooling from existing apps. Each app should be designed from scratch using whatever approach best fits that specific app.
- When working on an existing app, only consider that app's own code and documentation. Do not assume conventions from sibling apps apply.
- An app's README or specification document is the sole source of truth for how that app works. App-specific behavior documents (for example `pong/PONG_SPECIFICATION.md`, `flappy_bird/FLAPPY_BIRD_DOCUMENTATION.md`, and `ugh/UGH_SPECIFICATION.md`) take precedence over anything else.

## Device and Browser Compatibility
- Every user-facing app in this project must work properly on desktop and mobile devices.
- Build responsive layouts that remain usable across common phone, tablet, laptop, and desktop viewports.
- Support the input methods the app needs across platforms, including keyboard, mouse, and touch interactions where relevant.
- Maintain compatibility with current major browsers: Chrome, Edge, Firefox, and Safari, including mobile browser variants when relevant.
- Avoid browser-specific APIs unless a documented fallback or graceful degradation path is provided.

## Build and Test Expectations
- Each app should remain easy to run locally without unnecessary build complexity.
- Run tests from the affected app's directory using that app's own local scripts and tooling.
- Any app that does not yet have automated coverage should gain it as part of ongoing work.

## Automated Testing Requirements
- Every app must have its own dedicated automated test suite that covers its logic, UI behavior, and app-specific regressions.
- Every app must also include automated acceptance or end-to-end tests that run in a headless browser.
- **Chrome-only testing is sufficient.** There is no need to set up or run tests against Firefox, WebKit/Safari, or any other browser engine. Use whatever tooling runs against headless Chrome (Playwright with Chromium, Puppeteer, etc.).
- When changing gameplay, UI, responsiveness, or input handling, add or update automated tests in the affected app.
- A new app is not considered complete until its automated tests and headless acceptance tests are included.

## Delivery Rules
- Do not ship changes that break mobile support, regress major-browser compatibility, or remove dedicated automated coverage for an app.
- Keep each app's README or specification updated with controls, platform considerations, and test instructions.
