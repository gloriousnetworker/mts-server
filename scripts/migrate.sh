#!/bin/bash
# Run this after deploy to sync schema changes
# Uses DATABASE_PUBLIC_URL which is accessible from anywhere
echo "Pushing schema to database..."
DATABASE_URL="${DATABASE_PUBLIC_URL:-$DATABASE_URL}" npx prisma db push --skip-generate
echo "Done."
