# Espanyol Academy Management System

A mobile-first, Arabic-language Progressive Web App (PWA) for football academy management.

## Tech Stack

- **Framework:** Next.js 16.x (App Router, React 19)
- **Database:** Neon PostgreSQL (serverless)
- **ORM:** Drizzle ORM
- **Authentication:** Clerk
- **UI:** shadcn/ui + Tailwind CSS 4.x
- **Language:** TypeScript 5.x
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Neon PostgreSQL database
- Clerk account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Configure environment variables:

```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | ✅ |
| `CLERK_SECRET_KEY` | Clerk secret key | ✅ |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in page URL | ✅ |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up page URL | ✅ |

### Development

```bash
# Start development server
pnpm dev

# Run linting
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

### Database Commands

```bash
# Push schema to database
pnpm db:push

# Generate migrations
pnpm db:generate

# Open Drizzle Studio
pnpm db:studio
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Protected route group
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   └── ui/                # shadcn/ui components
├── db/
│   ├── schema.ts          # Drizzle schema definitions
│   ├── relations.ts       # Drizzle relations
│   └── index.ts           # Database connection
├── lib/
│   ├── utils.ts           # Utilities (cn function)
│   └── validations/       # Zod schemas
├── types/                 # TypeScript types
└── middleware.ts          # Clerk auth middleware
```

## Documentation

- [Architecture Document](./_bmad-output/planning-artifacts/architecture.md)
- [Product Requirements](./_bmad-output/planning-artifacts/prd.md)
- [Epics & Stories](./_bmad-output/planning-artifacts/epics.md)

## License

Private - Espanyol Academy

