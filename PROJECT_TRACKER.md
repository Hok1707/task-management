# Developer Task & Environment Manager — Backend Implementation Specification & Project Tracker

## 1. Project Overview
A centralized developer workspace designed for engineers to manage operational work tickets (Incidents, Changes, Requests), track workload distribution, store quick snippet notes, and manage sensitive multi-environment credentials securely.

---

## 2. Frontend Status & Implemented Architecture

### 2.1 State Management (Zustand)
- **Auth Store** (`/src/stores/useAuthStore.ts`): User authentication session (`user`, `token`, `login`, `logout`, `isLoading`).
- **Task Store** (`/src/stores/useTaskStore.ts`):
  - CRUD operations: `addTask`, `updateTask`, `deleteTask`.
  - Filters: Text search (`searchQuery`), multi-status (`filterStatus`), multi-type (`filterType`), quick filter (`quickFilter`: `'all' | 'active' | 'completed'`), and date range (`dateFilter`: `{ startDate?, endDate?, field: 'dueDate' | 'startDate' | 'createdAt' }`).
  - View modes: `'kanban' | 'list' | 'analytics'`.
  - Draft persistence: Auto-saves in-flight modal input drafts to `localStorage['create-task-draft']`.
- **Vault Store** (`/src/stores/useVaultStore.ts`): Environment credentials management with client-side masking.
- **Notes Store** (`/src/stores/useNotesStore.ts`): Developer scratchpad for code snippets and quick notes.
- **Theme Store** (`/src/stores/useThemeStore.ts`): Dark / Light / Cyberpunk themes.

### 2.2 Views & Interactive Features
- **Kanban Board** (`@dnd-kit/core`): Drag-and-drop task movement between columns (`Todo`, `InProgress`, `OnHold`, `Completed`).
- **Task List View**: Detailed tabular view with ticket numbers, types, status badges, priorities, and dates.
- **Analytics & Workload Dashboard** (`recharts`):
  - Status Distribution (Donut Chart)
  - Priority Breakdown (Bar Chart)
  - Type vs. Status Matrix (Stacked Bar Chart)
  - Workload metrics and actionable health insights.
- **Custom Date Range Filter Component**: Interval filtering for custom start/due date ranges with presets (*Today*, *Next 7 Days*, *Next 30 Days*, *This Month*).
- **Credentials Vault**: Environment cards with masked secret key reveals, one-click copy, and inline editing.
- **Quick Notes Drawer**: Fly-out persistent notes drawer with quick creation, edit, and deletion.

---

## 3. Data Models & Schemas

### 3.1 Task Entity
```typescript
export enum TaskType {
  Incident = 'Incident',
  Change = 'Change',
  Request = 'Request',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum TaskStatus {
  Todo = 'Todo',
  InProgress = 'In Progress',
  OnHold = 'On Hold',
  Completed = 'Completed',
}

export interface Task {
  id: string;                      // UUID / Primary Key
  ticketNumber: string;            // e.g. "INC-1024", "CHG-0412", "REQ-0042"
  title: string;                   // Short ticket summary
  description: string;             // Detailed markdown description
  implementationDetails?: string;  // Free-text field for code references, PR links, runbooks
  taskType: TaskType;              // 'Incident' | 'Change' | 'Request'
  priority: TaskPriority;          // 'Low' | 'Medium' | 'High' | 'Critical'
  status: TaskStatus;              // 'Todo' | 'In Progress' | 'On Hold' | 'Completed'
  startDate?: string;              // ISO Date String (YYYY-MM-DD or ISO 8601)
  dueDate?: string;                // ISO Date String (YYYY-MM-DD or ISO 8601)
  assignedBy: string;              // Author or Assigner name/email
  createdAt: string;               // ISO 8601 Timestamp
  updatedAt: string;               // ISO 8601 Timestamp
}
```

### 3.2 Environment Vault Entity
```typescript
export interface EnvironmentVault {
  id: string;        // UUID / Primary Key
  envName: string;   // e.g. "Production US-East", "Staging-01"
  baseUrl: string;   // e.g. "https://api-staging.internal.net"
  username: string;  // Service account or dev login
  secretKey: string; // Sensitive credential (Must be encrypted at rest in DB)
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Quick Note Entity
```typescript
export interface Note {
  id: string;        // UUID / Primary Key
  content: string;   // Markdown / Plain text note content
  createdAt: string; // ISO 8601 Timestamp
  updatedAt: string; // ISO 8601 Timestamp
}
```

### 3.4 User Entity
```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;     // e.g. "Senior Engineer"
}
```

---

## 4. Recommended Database Schema (SQL / PostgreSQL)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Developer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TYPE task_type AS ENUM ('Incident', 'Change', 'Request');
CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE task_status AS ENUM ('Todo', 'In Progress', 'On Hold', 'Completed');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    implementation_details TEXT,
    task_type task_type NOT NULL DEFAULT 'Request',
    priority task_priority NOT NULL DEFAULT 'Medium',
    status task_status NOT NULL DEFAULT 'Todo',
    start_date DATE,
    due_date DATE,
    assigned_by VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_start_date ON tasks(start_date);

-- Environments / Credentials Vault Table
CREATE TABLE environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    env_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    encrypted_secret_key BYTEA NOT NULL, -- AES-256 encrypted payload
    secret_iv BYTEA NOT NULL,            -- Encryption Initialization Vector
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick Notes Table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. REST API Specifications

### 5.1 Authentication Endpoints
- `POST /api/v1/auth/register`
  - **Body**: `{ username, email, password }`
  - **Response**: `{ user: User, token: string }`
- `POST /api/v1/auth/login`
  - **Body**: `{ email, password }`
  - **Response**: `{ user: User, token: string }`
- `GET /api/v1/auth/me`
  - **Header**: `Authorization: Bearer <token>`
  - **Response**: `{ user: User }`

### 5.2 Task Management Endpoints
- `GET /api/v1/tasks`
  - **Query Parameters**:
    - `search`: string (matches title, ticketNumber, description, implementationDetails)
    - `status`: comma-separated `TaskStatus[]`
    - `type`: comma-separated `TaskType[]`
    - `priority`: comma-separated `TaskPriority[]`
    - `startDate`: string (`YYYY-MM-DD`)
    - `endDate`: string (`YYYY-MM-DD`)
    - `dateField`: `'dueDate' | 'startDate' | 'createdAt'`
  - **Response**: `Task[]`
- `POST /api/v1/tasks`
  - **Body**:
    ```json
    {
      "title": "Fix authentication flow",
      "description": "Users encountering 500 on login",
      "implementationDetails": "Refactor auth middleware and token validation",
      "taskType": "Incident",
      "priority": "Critical",
      "status": "Todo",
      "startDate": "2026-08-20",
      "dueDate": "2026-08-25",
      "assignedBy": "Jane Doe"
    }
    ```
  - **Response**: `Task` (including server-generated `id`, `ticketNumber`, `createdAt`, `updatedAt`)
- `GET /api/v1/tasks/:id`
  - **Response**: `Task`
- `PATCH /api/v1/tasks/:id`
  - **Body**: `Partial<Task>`
  - **Response**: `Task`
- `PATCH /api/v1/tasks/:id/status` (Optimized for drag-and-drop kanban updates)
  - **Body**: `{ "status": "In Progress" }`
  - **Response**: `Task`
- `DELETE /api/v1/tasks/:id`
  - **Response**: `{ "success": true, "id": string }`

### 5.3 Credentials Vault Endpoints
- `GET /api/v1/environments`
  - **Response**: `EnvironmentVault[]` (secretKey returned in encrypted/tokenized format)
- `POST /api/v1/environments`
  - **Body**: `{ "envName": string, "baseUrl": string, "username": string, "secretKey": string }`
  - **Response**: `EnvironmentVault`
- `PATCH /api/v1/environments/:id`
  - **Body**: `Partial<EnvironmentVault>`
  - **Response**: `EnvironmentVault`
- `DELETE /api/v1/environments/:id`
  - **Response**: `{ "success": true, "id": string }`

### 5.4 Quick Notes Endpoints
- `GET /api/v1/notes`
  - **Response**: `Note[]`
- `POST /api/v1/notes`
  - **Body**: `{ "content": string }`
  - **Response**: `Note`
- `PATCH /api/v1/notes/:id`
  - **Body**: `{ "content": string }`
  - **Response**: `Note`
- `DELETE /api/v1/notes/:id`
  - **Response**: `{ "success": true, "id": string }`

### 5.5 Analytics & Workload Endpoints
- `GET /api/v1/analytics/workload-summary`
  - **Response**:
    ```json
    {
      "totalTasks": 24,
      "inProgressTasks": 8,
      "criticalTasks": 3,
      "completionRate": 65,
      "overdueTasks": 2,
      "statusDistribution": [
        { "name": "Todo", "value": 6 },
        { "name": "In Progress", "value": 8 },
        { "name": "On Hold", "value": 2 },
        { "name": "Completed", "value": 8 }
      ],
      "priorityDistribution": [
        { "name": "Low", "count": 4 },
        { "name": "Medium", "count": 10 },
        { "name": "High", "count": 7 },
        { "name": "Critical", "count": 3 }
      ]
    }
    ```

### 5.6 Audit Trail & Incident Post-Mortem Endpoints
- `GET /api/v1/audit-logs`
  - **Query Parameters**:
    - `search`: string
    - `category`: `'tasks' | 'vault' | 'postmortem' | 'all'`
    - `severity`: `'info' | 'warning' | 'critical' | 'all'`
  - **Response**: `AuditLog[]`
- `POST /api/v1/audit-logs`
  - **Body**: `{ "action": string, "target": string, "details": string, "severity": "info" | "warning" | "critical" }`
  - **Response**: `AuditLog`
- `POST /api/v1/incidents/:id/postmortem`
  - **Body**: `PostMortemData`
  - **Response**: `{ "success": true, "markdown": string, "exportedAt": string }`

---

## 6. Next Steps for Backend Integration
1. **API Client & Hooks Setup**:
   - Create an Axios or Fetch client instance (`/src/lib/api.ts`) with Bearer token interceptors.
   - Introduce React Query (`@tanstack/react-query`) or SWR for caching, optimistic UI updates, and server synchronization.
2. **Environment Variable Configuration**:
   - Add `VITE_API_BASE_URL=http://localhost:3000/api/v1` to `.env.example`.
3. **Database & Auth Provisioning**:
   - Deploy backend service (Node.js/Express, Go, Fastify, or NestJS) with PostgreSQL.
   - Implement bcrypt hashing for passwords and AES-256-GCM encryption for environment credentials at rest.
