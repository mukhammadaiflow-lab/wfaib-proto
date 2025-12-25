#!/bin/sh
set -e

if [ ! -d "node_modules" ]; then
  npm install
fi

npx prisma generate

# Day-0: push schema on boot (no migrations yet)
npx prisma db push --accept-data-loss

exec npm run dev

