---
status: Draft for implementation
target_platform: Desktop, tablet, and mobile web browsers
game_modes: Single-player campaign, local same-device multiplayer, hotseat/pass-and-play
visual_direction: Prehistoric arcade presentation with modern readability
---

# UGH! Web Game Product Requirements Specification

This document defines product requirements for a web-based adaptation inspired by the 1992 game *UGH!*. It intentionally excludes implementation details, code structure, technology choices, and internal design notes.

## 1. Purpose

The product shall deliver a browser-playable adaptation of *UGH!* that preserves the original game's core fantasy of transporting passengers through hazardous prehistoric environments while making the experience readable, responsive, and enjoyable on modern devices.

The product shall feel like a faithful arcade-style web clone in terms of player goals, risk, pacing, and replayability, while allowing present-day user experience improvements that do not change the essential game premise.

The product shall be approachable to a first-time player without requiring external documentation, yet deep enough to reward repeated play through level progression and mastery.

## 2. Scope

### 2.1 In scope

The product shall include:

- Single-player campaign or arcade play
- Local same-device multiplayer play
- Hotseat or pass-and-play style shared-device play where applicable
- Passenger pickup and delivery gameplay
- Prehistoric hazards such as terrain, hostile creatures, and environmental obstacles
- A resource or exertion pressure mechanic that limits sustained action and can be communicated to the player
- Level progression with increasing challenge
- Progress restoration through level codes or an equivalent local progress method
- Start, pause, restart, failure, and completion states
- On-screen guidance, status information, and score/progress feedback
- Audio and visual feedback for core gameplay events
- Accessibility support appropriate for browser-based play
- Automated tests that cover core gameplay and regressions

### 2.2 Out of scope

The following are out of scope for the current product:

- Online multiplayer, matchmaking, lobbies, or accounts
- Backend services or cloud-hosted persistence
- Implementation architecture, source layout, or framework choice
- Native app distribution or platform-exclusive installers
- Monetization, advertising, or commerce systems
- Exact recreation of every historical asset, sound, or screen if it conflicts with modern readability

## 3. Product Overview

The product shall present a prehistoric transport challenge in which the player pilots a stone-age helicopter or equivalent transport craft, picks up passengers, and delivers them to their destinations while avoiding damage and managing pressure from hazards and limited resources.

The experience shall emphasize:

- Clear objectives
- Fast, understandable feedback
- A fair but demanding arcade feel
- Cross-device playability
- Replayable progression
- A visual style that evokes the original era while remaining legible on modern screens

The game shall support both short sessions and longer campaign runs, and it shall not depend on the player knowing the original release to understand the goal.

## 4. Functional Requirements

### 4.1 Game flow and states

- The game shall provide a start or title state before active play begins.
- The start state shall present the core objective, supported modes, and how to begin play.
- The game shall provide an active gameplay state.
- The game shall provide a pause state when play is suspended.
- The game shall provide a level-complete state when the current objective is finished.
- The game shall provide a failure or game-over state when the player can no longer continue.
- The game shall provide a campaign-complete or end-of-run state when the full progression is finished.
- The player shall be able to restart a run without reloading the page.
- The player shall be able to return to the title or menu flow without refreshing the browser.
- State transitions shall be clear, deterministic, and free of ambiguous control loss.
- Local multiplayer sessions shall clearly indicate which player is active or how shared control is handled.

### 4.2 Core gameplay loop

- The player shall control a prehistoric transport craft that moves through hazardous terrain.
- The primary objective shall be to pick up passengers and deliver them to valid destinations.
- Passenger pickup and delivery shall be clearly signaled to the player.
- The game shall reward successful deliveries with visible progress or score feedback.
- The game shall include hazards that can damage the player, disrupt delivery, or end the current run.
- Hazard feedback shall be immediate and understandable.
- The game shall include a resource, stamina, fuel, or exertion pressure mechanic when the current mode requires sustained powered movement.
- The player shall be able to understand the current resource state through visible feedback.
- If the game includes an item or special-action mechanic for dealing with hazards, the action shall be clearly explained in-game.
- The game shall support safe landing or equivalent end-of-journey actions that matter to mission success.
- The game shall not require hidden rules for basic passenger transport, hazard avoidance, or level completion.

### 4.3 Level progression, scoring, and recovery

- The game shall provide multiple levels or equivalent progressive stages.
- Challenge shall increase across progression in a way that is perceivable to the player.
- Each level shall have a clear objective state and a clear completion condition.
- The game shall show the player's current progress within the active level when such progress is relevant.
- The game shall provide visible score or performance feedback for successful play.
- The game shall support progress recovery through level codes or an equivalent local method.
- Progress recovery shall not require online services.
- The game shall preserve the player's meaningful campaign progress between sessions when local persistence is available.
- Optional collectibles or bonus interactions, when present, shall support the score or resource loop in a way that is understandable to the player.
- The game shall allow repeated replay of completed content without forcing a full reinstall or browser reset.

### 4.4 Controls and input

- The game shall support keyboard input on desktop devices.
- The game shall support pointer input on desktop devices where appropriate.
- The game shall support touch input on mobile and tablet devices.
- The same primary gameplay actions shall be available across supported input methods.
- The game shall support menu navigation using the same input families that are used for play.
- Starting a session, pausing, restarting, and confirming menu choices shall be possible using supported input methods.
- The game shall not require hover interactions, precise cursor placement, or multi-finger gestures to play.
- The control model shall remain understandable on small touchscreens as well as larger desktop displays.
- In local multiplayer or hotseat play, the game shall clearly separate player ownership or turn control.

### 4.5 User interface, HUD, and UX

- The game shall provide clear on-screen instructions for the first-time player.
- The game shall make the current objective visible during play.
- The HUD shall show the information needed to play successfully, including passenger status, progress, score or rewards, and any resource or damage state that affects the current run.
- The UI shall make it clear when the player is carrying a passenger, approaching a destination, taking damage, or completing a level.
- The UI shall make failure states understandable at a glance.
- The UI shall avoid clutter that obscures hazards, destinations, or critical status information.
- The UI shall remain readable on small mobile screens as well as larger desktop screens.
- Menus, prompts, and result screens shall use concise, legible language.
- The visual presentation shall evoke a retro arcade tone while remaining modern in clarity and contrast.
- The game shall not rely on the player memorizing hidden controls or undocumented state changes.

### 4.6 Audio and feedback

- The game shall provide audio feedback for key gameplay events.
- Audio cues shall exist for menu navigation, menu confirmation, pickup, delivery, damage, resource warnings, success, and failure.
- Music or an equivalent musical backdrop shall be available for at least menu or active gameplay contexts.
- Audio feedback shall support, not replace, visual feedback.
- Essential gameplay information shall remain understandable if audio is muted.
- Audio intensity shall not mask important warning cues or moment-to-moment game feedback.

### 4.7 Persistence and session continuity

- The game shall preserve player-facing settings when local persistence is available.
- The game shall preserve campaign progress or equivalent unlock state when local persistence is available.
- The game shall open to a safe entry state rather than resuming a partially completed run automatically.
- Restarting a run shall reset transient gameplay state while preserving allowed persistent state.
- Persisted progress shall be stable across normal browser sessions.
- The game shall not require server-side storage for core play continuity.

## 5. Accessibility Requirements

- Text and critical interface elements shall remain legible on supported screen sizes.
- Essential gameplay information shall not be conveyed by color alone.
- The game shall provide clear non-color cues for status changes such as damage, success, failure, and progress.
- The game shall support reduced-motion or reduced-effects behavior where possible.
- The game shall avoid visual effects that obscure the player character, passengers, hazards, or objective markers.
- Touch targets and interactive areas shall be large enough to be used comfortably on mobile devices.
- The game shall remain understandable and usable with common browser zoom levels where supported.
- The game shall avoid requiring fine motor precision beyond what is typical for a casual arcade browser game.
- The game shall provide a way to pause or recover from accidental interruption where supported by the current browser context.
- The game shall remain understandable when viewed in portrait or landscape orientation, subject to the device's capabilities.

## 6. Non-Functional Requirements

### 6.1 Device compatibility

- The game shall be fully playable on desktop, tablet, and mobile devices.
- The game shall adapt to a variety of screen sizes and aspect ratios without losing core functionality.
- The game shall remain usable in both portrait and landscape orientations where the device and browser support them.
- The game shall not rely on device-specific hardware features beyond standard browser input and rendering capabilities.

### 6.2 Browser compatibility

- The game shall function correctly in current major desktop browsers, including Chrome, Firefox, Edge, and Safari where available.
- The game shall function correctly in current major mobile browsers, including Safari on iOS and Chromium-based browsers on Android.
- Core gameplay, controls, progress, and restart behavior shall remain functionally consistent across supported browsers.
- Browser differences shall not prevent a player from completing a full session on a supported device.
- The game shall not require browser extensions, plugins, or nonstandard configuration to play.

### 6.3 Responsiveness, performance, and stability

- The game shall respond promptly to player input during active play.
- The game shall provide smooth and readable motion under normal gameplay conditions.
- Performance shall remain stable across repeated play sessions without requiring a page reload.
- The game shall remain playable and readable when the browser viewport changes size during a session.
- The game shall not enter a broken or ambiguous state after rapid repeated input.
- A completed or failed run shall not prevent a new run from starting normally.
- The game shall remain stable across repeated starts, pauses, restarts, level completions, and failures.

### 6.4 Usability and reliability

- The game shall be understandable to a new player without external documentation.
- The game shall present a clear and fair challenge curve.
- The game shall provide clear recovery paths after failure or interruption.
- The game shall not depend on network availability for core play.
- If local persistence is unavailable, the game shall still remain fully playable.

## 7. Automated Testing Requirements

- The product shall be covered by automated tests that validate the core gameplay rules and player-facing state transitions.
- Automated tests shall cover the start flow, active play flow, failure flow, restart flow, and completion flow.
- Automated tests shall cover passenger pickup and delivery behavior, hazard handling, score or progress updates, and resource or damage rules where present.
- Automated tests shall cover progress restoration behavior when such behavior is part of the product.
- Automated tests shall cover supported input families at a product level, including keyboard, pointer, and touch-oriented interaction where applicable.
- Automated tests shall cover responsiveness-related behaviors such as resizing, repeated restarts, and rapid input.
- Automated tests shall cover local same-device multiplayer or hotseat flow when that mode is included in the product.
- Automated tests shall be sufficient to detect regressions in the primary rules and the acceptance criteria listed in this document.
- This specification does not prescribe a particular test framework, test runner, or repository layout.

## 8. Acceptance Criteria

### 8.1 Core gameplay

- [ ] A player can start a single-player session from the title or start screen.
- [ ] The player can pick up passengers and deliver them to valid destinations.
- [ ] Hazard interactions can cause damage, failure, or other defined consequences.
- [ ] The player can complete at least one level and advance to the next progression state.
- [ ] The player can restart after failure without reloading the page.
- [ ] The game clearly communicates when a run is active, paused, failed, or complete.

### 8.2 Modes and controls

- [ ] Single-player play is available.
- [ ] Local same-device multiplayer is available where in scope.
- [ ] Hotseat or pass-and-play behavior, when included, clearly indicates shared control or turn ownership.
- [ ] Keyboard, pointer, and touch-supported input can all begin play on supported devices.
- [ ] The same essential gameplay actions are available across supported input methods.

### 8.3 UI, UX, and accessibility

- [ ] The start screen explains the objective and how to begin.
- [ ] The HUD shows the information needed to play successfully.
- [ ] The game remains readable on small mobile screens and larger desktop displays.
- [ ] Critical information is not conveyed by color alone.
- [ ] Reduced-effects or reduced-motion support is available where applicable.
- [ ] Result and failure screens make the next available action obvious.

### 8.4 Compatibility and stability

- [ ] The game remains playable on desktop, tablet, and mobile devices.
- [ ] The game functions in current major browsers on supported devices.
- [ ] Repeated start, restart, and resize flows remain stable.
- [ ] Rapid repeated input does not leave the game in a broken or ambiguous state.
- [ ] A completed or failed run does not block a new run from starting.

### 8.5 Persistence and testing

- [ ] Progress restoration works through level codes or an equivalent local method if included.
- [ ] Local settings and progress persist when persistence is available.
- [ ] The game opens to a safe entry state rather than resuming a partial run automatically.
- [ ] Automated tests exist and cover the core gameplay rules and state transitions.
- [ ] Automated tests cover the regression-prone behaviors named in this specification.

### 8.6 Presentation and audio

- [ ] The visual presentation evokes a prehistoric arcade tone while remaining readable on modern screens.
- [ ] Audio cues are present for menu navigation, pickup, delivery, damage, success, and failure.
- [ ] The game remains understandable when audio is muted.
- [ ] Visual and audio feedback do not obscure gameplay-critical information.

## 9. Future Considerations

The following features are not required by this specification but may be considered in future iterations:

1. Online multiplayer or asynchronous competitive features
2. Gamepad support
3. Expanded campaign content or additional level packs
4. Cosmetic themes or alternate visual skins
5. Replay viewing or ghost-run features
6. Achievement tracking or richer local statistics
7. Optional accessibility presets beyond the required reduced-effects support
