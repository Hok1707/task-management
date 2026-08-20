# DevVault.io — Developer Task & Environment Manager

A high-performance developer workspace built with React 19, TypeScript, Tailwind CSS, Zustand, and Recharts. Tailored for engineers to manage tickets, analyze workload distribution, record quick notes, and maintain multi-environment configurations and credentials.

---

## Key Features

1. **Task Management & Drag-and-Drop Kanban**:
   - Status stages: `To Do`, `In Progress`, `On Hold`, `Completed`.
   - Drag-and-drop column management using `@dnd-kit`.
   - Task classifications: `Incident`, `Change`, `Request`.
   - Priority severity levels: `Low`, `Medium`, `High`, `Critical`.
   - Free-text **Implementation Details** field for runbooks, code paths, and PR links.
   - Accidental modal closure recovery via auto-saved draft persistence.

2. **Advanced Filtering & Date Range Picker**:
   - Text search query across titles, ticket numbers, assigners, descriptions, and implementation details.
   - Multi-select filters for Task Status and Task Type.
   - Quick filters (`All`, `Active`, `Completed`).
   - Custom **Date Range Picker** with presets (*Today*, *Next 7 Days*, *Next 30 Days*, *This Month*) targeting `Due Date`, `Start Date`, or `Creation Date`.

3. **Analytics & Workload Dashboard**:
   - Live workload metrics: Total Tasks, In Progress, Critical Pending, Completion Rate.
   - **Recharts Donut Chart**: Workload distribution across lifecycle stages.
   - **Recharts Bar Chart**: Workload volume categorized by severity priority tiers.
   - **Recharts Stacked Bar Chart**: Type vs. Status distribution matrix.
   - Automated workload health recommendations and bottleneck detection.

4. **Environment Credentials Vault**:
   - Manage multi-tier environments (e.g. Staging, Production, US-East).
   - Masked-by-default secret keys with secure reveal toggles and one-click clipboard copying.
   - Inline credential editing and management.

5. **Quick Notes Panel**:
   - Persistent developer scratchpad drawer for saving code snippets, temporary reminders, and markdown notes.

---

## Documentation & Backend Specification

For full backend contracts, REST API endpoint schemas, and PostgreSQL database migrations, refer to:
- [`PROJECT_TRACKER.md`](./PROJECT_TRACKER.md): Complete backend API specification, data models, and database schema.

---

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Compile / Type Check
npm run build
npm run lint
```
