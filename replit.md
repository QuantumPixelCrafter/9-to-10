# Workspace

## Overview

**Study Smart** - a full-stack student productivity web application with AI-powered quiz generation, notes management, study timetable, goals tracking, mood check-in, and calendar.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/study-smart)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/           # Express API server (port from env PORT)
│   └── study-smart/          # React + Vite frontend (previewPath: /)
├── lib/
│   ├── api-spec/             # OpenAPI spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks
│   ├── api-zod/              # Generated Zod schemas from OpenAPI
│   ├── db/                   # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server integration
│   └── integrations-openai-ai-react/   # OpenAI React integration
├── scripts/                  # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Features

1. **Notes & Subjects** - Organize notes by subject folders, create/edit/delete notes
2. **AI Quiz Generator** - Generate multiple-choice quizzes from notes (Easy/Normal/Difficult)
3. **Weekly Timetable** - Schedule study sessions by day, browser push notifications
4. **Goals** - Set goals with deadlines, descriptions, mark complete/incomplete
5. **Calendar** - Monthly view with schedules and goal deadlines
6. **Mood Check-in** - Daily mood tracking with history

## Database Schema

- `subjects` - Subject folders (name, color, icon)
- `notes` - Study notes (title, content, subjectId, lastUsedAt)
- `schedules` - Study schedules (subject, dayOfWeek, startTime, endTime, color, notificationEnabled, eventType)
- `goals` - Study goals (title, description, deadline, completed)
- `moods` - Mood check-ins (mood enum, note, createdAt)
- `scores` - Game/quiz leaderboard scores (userId, gameType, score, subject, userLevel)
- `user_achievements` - Earned achievements per user (userId, achievementKey, earnedAt)

## API Routes (all under /api)

- `GET/POST /subjects` — list/create subjects
- `PUT/DELETE /subjects/:id` — update/delete subject
- `GET/POST /notes` — list/create notes (optional ?subjectId query)
- `GET/PUT/DELETE /notes/:id` — get/update/delete note
- `POST /notes/:id/quiz` — AI quiz generation {difficulty, questionCount}
- `GET/POST /schedules` — list/create schedules
- `PUT/DELETE /schedules/:id` — update/delete schedule
- `GET/POST /goals` — list/create goals
- `PUT/DELETE /goals/:id` — update/delete goal
- `GET/POST /moods` — list/create mood check-ins

## TypeScript & Composite Projects

- `lib/*` packages are composite and emit declarations via `tsc --build`
- Root `tsconfig.json` lists all lib packages as project references
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
- DB push: `pnpm --filter @workspace/db run push`
