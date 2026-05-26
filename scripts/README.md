# Scripts

## Delete Spam Users After Timestamp

Script:

```bash
node scripts/deleteSpamUsersAfter.js
```

This finds users created after `1779623724700`, previews them in batches, and asks before deleting each batch.

The script uses the real Mongo connection config, real Mongoose models, and the internal `deleteUser` function used by account deletion. It does not call `confirmDelete` or password/email verification.

### Recommended First Run

```bash
node scripts/deleteSpamUsersAfter.js --dry-run
```

Dry run lists matching users and lets you walk through the same batch prompts, but it does not delete users, delete errors, send emails, or write local delete exports.

### Real Deletion

```bash
node scripts/deleteSpamUsersAfter.js
```

By default, real deletion:

- deletes confirmed batches through the internal `deleteUser` cascade
- does not send completion emails
- writes one local JSON export per successfully deleted user to `local-delete-exports/`
- leaves admin error records alone

The `local-delete-exports/` folder is ignored by git.

### Delete Admin Errors Too

```bash
node scripts/deleteSpamUsersAfter.js --delete-errors
```

This deletes admin error records for each user that is actually deleted. It removes matching records from `interact-admin-error` and removes their IDs from `interact-admin-error-index`.

If an error index becomes empty, the script deletes that index and reconnects neighboring `prevIndexID` / `nextIndexID` links.

### Send Completion Emails

```bash
node scripts/deleteSpamUsersAfter.js --send-email
```

Completion emails are disabled by default for this emergency script to avoid email quota issues. Use this flag only if you intentionally want the normal completion email behavior.

### Delete Empty Feed Indexes

```bash
node scripts/deleteSpamUsersAfter.js --delete-empty-feed-indexes
```

This scans global feed indexes (`interact-post-index`) and user feed indexes (`interact-user-post-index`). Stale post IDs for deleted/missing posts are pruned first. Empty indexes are deleted, neighboring `prevIndexID` / `nextIndexID` links are reconnected, and current index pointers are moved to a live index or `null`.

Use dry run first:

```bash
node scripts/deleteSpamUsersAfter.js --dry-run --delete-empty-feed-indexes
```

Dry run reports which stale post IDs would be pruned, which empty feed indexes would be deleted, which index counts would be corrected, and where the system `postsIndex` pointer would move.

### Flags Can Be Combined

```bash
node scripts/deleteSpamUsersAfter.js --delete-errors --delete-empty-feed-indexes --send-email
```

### Prompt Controls

For each batch:

- `y` deletes the shown batch
- `s` skips the shown batch
- `q` quits immediately

### Backup Reminder

Before real deletion, make a Mongo backup. Example:

```bash
mongodump --uri='mongodb://USER:PASSWORD@HOST:27017/DBNAME' --out=../mongo-backups/YYYY-MM-DD
```

## Rebuild Post Indexes

Script:

```bash
node scripts/rebuildPostIndexes.js
```

Dry run is the default. It reports how many existing indexes would be deleted and how many rebuilt indexes would be created.

### Rebuild Global and User Post Indexes

```bash
node scripts/rebuildPostIndexes.js --apply
```

This deletes and rebuilds:

- global feed indexes in `interact-post-index`
- user post indexes in `interact-user-post-index`
- post `indexID` and `userPostIndexID` fields
- user `postIndexID` fields
- system `interact-indexes.production.postsIndex`

The rebuilt current indexes point to the newest non-empty index chunk. No empty placeholder index is created.

### Rebuild Only One Index Type

```bash
node scripts/rebuildPostIndexes.js --apply --global-only
node scripts/rebuildPostIndexes.js --apply --user-only
```
