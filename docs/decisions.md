# Decisions

## Tech
- Expo + React Native + TypeScript
- expo-router for navigation
- SQLite (expo-sqlite)
- Jest for unit tests (domain logic first)

## Domain decisions
- "軽めでもカウント" => didActivity is true if ANY workout exists on that day.
- Stage is recomputed from a timeline to avoid inconsistency when editing past days.
- Day boundary uses local date (YYYY-MM-DD). (Future: allow configurable cutoff time)
