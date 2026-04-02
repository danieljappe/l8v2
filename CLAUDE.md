# L8v2 Project

## Project Structure

```
l8v2/
├── course/          ← COURSE CONTEXT — read this first
├── L8v2_BE/         ← Backend (Node.js, Express, TypeScript, MongoDB)
└── L8V2_FE/         ← Frontend (React, TypeScript, Vite, Tailwind CSS)
```

## Course Context

> **Always read the `course/` folder before making architectural or implementation decisions.**
> This project is developed in the context of two academic courses whose objectives directly shape what should be demonstrated:

- `course/Database_Course_Objectives.md` — Database course: covers database type selection, physical/logical data modelling, optimization, transactions, scaling, and security.
- `course/SoftwareQuality_Course_Objectives.md` — Software Quality course.

When suggesting solutions, prioritize approaches that satisfy the learning objectives in these files (e.g. database optimization, transaction handling, appropriate DB type selection).

## Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Backend  | Node.js, Express, TypeScript, TypeORM, MongoDB |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Auth     | JWT                                       |

## Key Conventions

- Backend runs on port `3000`, frontend on `5173` (Vite default).
- Environment config lives in `.env` files (never commit these).
- Migrations are managed via TypeORM; see `L8v2_BE/MIGRATIONS.md`.
