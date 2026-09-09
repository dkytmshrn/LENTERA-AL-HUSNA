# LENTERA Documentation

LENTERA is the MTS Al-Husna Lentera academic platform for registration, curriculum, lessons, classrooms, examinations, scoring, AI-assisted essay grading, and student report cards.

## 1. Requirements

- Node.js 18 or newer
- npm
- PostgreSQL 12 or newer
- A PostgreSQL database named `lentera-al-husna`
- Google Cloud Storage credentials for lesson and examination files
- SMTP credentials for registration, temporary-password, and MFA emails
- A Gemini API key for essay grading and AI practice/question generation

## 2. Installation

From the repository root:

```bash
npm install
```

Create `apps/backend/.env` from `apps/backend/.env.example` and configure the database, JWT, SMTP, GCS, and Gemini values. Keep secrets only in local environment files or a deployment secret manager.

Important variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=lentera-al-husna

JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=10h

APP_PORT=3001
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=replace_me
```

`apps/backend/.env` is ignored by Git. Never commit API keys, database passwords, SMTP passwords, JWT secrets, or GCS private keys.

## 3. Database

Create the database if necessary:

```bash
createdb lentera-al-husna
```

Run all migrations:

```bash
npm run db:migrate -w apps/backend
```

The migration set creates and maintains:

- Accounts and registration requests
- Curriculums, lessons, and examinations
- Classrooms, classroom students, and classroom curriculum assignments
- Examination questions and approval locking
- One examination attempt per student per examination
- Per-question grading, score percentage, raw score, maximum score, and randomized question order
- Classroom uniqueness by grade, class code, and academic period
- Homeroom uniqueness per teacher and academic period

## 4. Running the Application

Run backend and frontend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run start:dev -w apps/backend
npm run dev -w apps/frontend
```

Default addresses:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- API base: `http://localhost:3001/api`

Production builds:

```bash
npm run build:backend
npm run build:frontend
```

## 5. Initial Data

Create the bootstrap SysAdmin account:

```bash
npm run seed -w apps/backend
```

Use the SysAdmin account to approve registration requests and assign the initial role and badge. A user's role is assigned during approval and cannot later be changed through User Management. The Wali Kelas badge is managed by assigning a Guru as a classroom homeroom teacher.

## 6. Roles and Access

### SysAdmin

- Full application administration
- Registration approval
- User and badge administration
- Classroom and curriculum management
- Examination authoring and approval
- Application statistics

### Principal

- School report dashboard
- Curriculum and classroom curriculum assignment
- Examination review and approval/un-approval
- Read-only examination question review
- No User Management or Classroom Management menu
- Cannot create, edit, or delete examinations/questions

### Teacher

- Access only assigned subjects
- Manage lessons and examinations for assigned subjects
- Access Kelas Saya only when the Wali Kelas badge is assigned
- Manage assigned-class monitoring
- View teaching assignments

### Student

- Dashboard with class, subjects, agenda, and upcoming examinations
- Subject study page with YouTube/PDF lessons
- Temporary AI practice sessions
- Approved live examinations
- Report card by grade with PDF download

## 7. Classroom Rules

- A classroom is unique by `gradeLevel + classCode + academicPeriod`.
- The same code may be used in another grade or academic period.
- A teacher can be homeroom teacher for only one classroom in the same academic period.
- A student cannot belong to two classrooms in the same academic period.
- A student cannot move to a higher grade in an earlier academic period than a previously assigned classroom.
- Classroom results are ordered by academic year descending, grade ascending, then class code ascending.

## 8. Examination Lifecycle

1. A Teacher or SysAdmin creates an examination and its questions.
2. The schedule must have an end time later than its start time.
3. A Principal or SysAdmin approves the examination.
4. Approval locks the schedule and question set.
5. A Principal or SysAdmin may unlock an approved examination through the warning dialog.
6. Exams whose scheduled end has passed cannot be edited or deleted.
7. Students may enter the lounge ten minutes before start time.
8. Questions become available only at the scheduled start time.
9. Each student receives a persistent randomized question and option order.
10. Only one attempt is allowed per student per examination.

Question images are resized before storage and signed URLs are regenerated when live questions are fetched.

## 9. Scoring and AI

Multiple-choice answers are graded automatically. Essay answers are evaluated by Gemini using the question, reference answer, and student answer. The prompt asks Gemini to evaluate meaning, factual correctness, completeness, and relevance rather than literal string similarity.

Essay score formula:

```text
awarded points = maximum question points × semantic match percentage / 100
```

Final examination score:

```text
percentage score = raw score / maximum possible score × 100
```

The final score is not released until all essay grading requests complete successfully. Failed or unavailable Gemini grading prevents final submission.

AI practice questions are temporary. They are generated and graded through the API but are not stored as examination questions or attempts.

## 10. Student Report Cards

The Student report card:

- Groups results by subject
- Aggregates all examinations within each subject
- Calculates subject percentage from total raw points and total maximum points
- Supports filtering by grade
- Provides a formal MTS Al-Husna Lentera PDF download

## 11. Security and Session Behavior

- Access and refresh tokens are HttpOnly cookies.
- Invalid refresh tokens clear the server session and cookies.
- The client clears cached identity data on logout and refreshes the current profile after login.
- Live examinations disable common copy, selection, print, and context-menu actions as browser-level deterrents. Browser security cannot prevent screenshots made with another device.
- Gemini keys and other credentials must be rotated if exposed.

## 12. Testing and Troubleshooting

Build both applications:

```bash
npm run build:backend
npm run build:frontend
```

If a route appears to use an old method or old UI, stop all development servers, restart `npm run dev`, and perform a hard browser refresh.

Common issues:

- **PostgreSQL connection failure:** verify `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME`.
- **Gemini 404:** query the available models for the API key and use a model supporting `generateContent`.
- **Expired GCS image:** reload the examination; signed URLs are regenerated from stored file IDs.
- **Cannot create classroom:** check the grade, class code, academic period, teacher homeroom assignment, and student period conflicts.
- **PDF download failure:** verify the backend is running, the student session is valid, and the selected grade has report data.

## 13. Project Layout

```text
apps/backend/   NestJS API, Sequelize models, migrations, seeders, GCS and AI services
apps/frontend/  Next.js pages, components, API client, role-based navigation
packages/shared Shared package area
```

This file is the primary project documentation. The older guides remain in the repository as historical and topic-specific references.
