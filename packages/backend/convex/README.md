# @fomo/backend/convex

This package contains generated and helper functions for Convex.

## .

- `schema.ts` - blueprint for FOMO Convex dataframe; do not move to a subdirectory
- `seed.ts` - generates fake mock data; do not move to a subdirectory
- `auth.ts` - utilized by Clerk; potentially move to a 'frontend' dir (?)
- `auth.config.ts` - utilized by Clerk; potentially move to a 'frontend' dir (?)

## \_generated

Functions that are automatically created by Convex. Don't touch these.

## data_ml

Helper functions utilized by `@fomo/packages/data_ml`.
All files should correspond to a Convex datatable.

- `friendRecs.ts` - helper functions for `friendRecs` table
- `friends.ts` - helper functions for `friends` table
- `users.ts` - helper functions for `users` table
- `universal.ts` - special case; extracts from ANY data table
