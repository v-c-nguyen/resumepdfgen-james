# Migration from File-Based to Database Storage

This project has been migrated from file-based profile storage to PostgreSQL database using Prisma.

## What Changed

1. **Profile Storage**: Profiles are now stored in a PostgreSQL database instead of TypeScript files
2. **API Routes**: All CRUD operations now use Prisma to interact with the database
3. **Client-Side**: The main page now fetches profiles from an API endpoint instead of importing directly

## Setup Instructions

### 1. Database Configuration

Set up your PostgreSQL database connection string in a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

For Vercel Postgres, you can find the connection string in your Vercel dashboard under Storage > Postgres.

### 2. Run Database Migrations

```bash
npm run prisma:migrate
```

This will create the `profiles` table in your database.

### 3. Seed Existing Profiles

To migrate the existing profiles from files to the database:

```bash
npm run prisma:seed
```

This will:
- Clear any existing profiles in the database
- Import all profiles from `app/data/profiles/*.ts` files
- Store them in the database

### 4. Generate Prisma Client

After making schema changes, regenerate the Prisma client:

```bash
npm run prisma:generate
```

## File Structure

- `prisma/schema.prisma` - Database schema definition
- `prisma/seed.ts` - Seed script to migrate existing profiles
- `lib/prisma.ts` - Prisma client singleton instance
- `app/data/db.ts` - Database helper functions
- `app/api/profiles/route.ts` - Public API endpoint to fetch profiles
- `app/api/admin/profiles/route.ts` - Admin API endpoint (CRUD operations)

## API Endpoints

### Public Endpoints

- `GET /api/profiles` - Fetch all profiles (for client-side use)

### Admin Endpoints (require authentication)

- `GET /api/admin/profiles` - Fetch all profiles
- `POST /api/admin/profiles` - Create a new profile
- `PUT /api/admin/profiles` - Update an existing profile
- `DELETE /api/admin/profiles?name=<profile_name>` - Delete a profile

## Notes

- The old profile files in `app/data/profiles/` are kept for reference but are no longer used in production
- The `baseResumes.ts` file still exports the type definition but the actual data array is only used for seeding
- All profile operations now happen through the database, making it compatible with Vercel's serverless environment


