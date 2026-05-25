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

### Flags Can Be Combined

```bash
node scripts/deleteSpamUsersAfter.js --delete-errors --send-email
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
