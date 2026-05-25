require('dotenv').config({ path: 'secret.env' });

const fs = require('fs/promises');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const mongoose = require('mongoose');
const config = require('../config.json');
const interactUserSchema = require('../src/schemas/interactUserSchema');
const interactUserPrivSchema = require('../src/schemas/interactUserPrivSchema');
const interactPostSchema = require('../src/schemas/interactPostSchema');
const interactAdminErrorSchema = require('../src/schemas/admin/interactAdminErrorSchema');
const interactAdminErrorIndexSchema = require('../src/schemas/admin/interactAdminErrorIndexSchema');
const { deleteUser } = require('../src/utils/user/deleteUser');
const { getCurrentErrorIndex, setCurrentErrorIndex } = require('../src/utils/admin/indexesAdmin');

const SPAM_CREATED_AFTER = 1779623724700;
const BATCH_SIZE = 1000;
const LOCAL_EXPORT_DIR = path.join(__dirname, '..', 'local-delete-exports', 'spam-users-after-1779623724700');
const dryRun = process.argv.includes('--dry-run');
const sendEmail = process.argv.includes('--send-email');
const deleteErrors = process.argv.includes('--delete-errors');

function getMongoURL() {
    const { MONGO_URL_PROD, MONGO_URL_DEV } = process.env;
    return config.current == 'prod' ? MONGO_URL_PROD : MONGO_URL_DEV;
}

async function connectDB() {
    const mongoURL = getMongoURL();
    if (!mongoURL) {
        throw new Error(`Missing Mongo URL for config.current=${config.current}`);
    }

    await mongoose.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    });
}

function toTimestamp(value) {
    if (!value) return null;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
        const parsedNumber = Number(value);
        if (Number.isFinite(parsedNumber)) return parsedNumber;

        const parsedDate = Date.parse(value);
        return Number.isFinite(parsedDate) ? parsedDate : null;
    }

    return null;
}

function objectIdTimestamp(value) {
    if (!value || typeof value !== 'string') return null;
    if (!/^[a-fA-F0-9]{24}$/.test(value)) return null;

    try {
        return mongoose.Types.ObjectId(value).getTimestamp().getTime();
    } catch (err) {
        return null;
    }
}

function getUserCreatedAt(user) {
    const fields = [
        { name: 'creationTimestamp', value: user.creationTimestamp },
        { name: 'createdAt', value: user.createdAt },
        { name: 'timestamp', value: user.timestamp }
    ];

    for (const field of fields) {
        const timestamp = toTimestamp(field.value);
        if (timestamp !== null) {
            return {
                source: field.name,
                timestamp,
                display: new Date(timestamp).toISOString()
            };
        }
    }

    const idTimestamp = objectIdTimestamp(String(user._id || ''));
    if (idTimestamp !== null) {
        return {
            source: '_id',
            timestamp: idTimestamp,
            display: new Date(idTimestamp).toISOString()
        };
    }

    return {
        source: 'unknown',
        timestamp: null,
        display: 'unknown'
    };
}

function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms < 0) return 'unknown';

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function safeFilePart(value) {
    return String(value || 'missing')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 80);
}

async function findPrivateUser(user) {
    const userID = String(user._id || '');
    if (userID) {
        const byID = await interactUserPrivSchema.findOne({ _id: userID }).lean();
        if (byID) return byID;
    }

    if (user.userToken) {
        return interactUserPrivSchema.findOne({ userToken: user.userToken }).lean();
    }

    return null;
}

async function countUserPosts(user) {
    const userID = String(user._id || '');
    if (!userID) return null;

    return interactPostSchema.countDocuments({
        userID,
        deleted: { $ne: true }
    });
}

async function countUserErrors(user) {
    const userID = String(user._id || '');
    if (!userID) return null;

    return interactAdminErrorSchema.countDocuments({ userID });
}

async function findSpamUsers() {
    const found = [];
    const cursor = interactUserSchema.find({}).lean().cursor();

    for await (const user of cursor) {
        const created = getUserCreatedAt(user);
        if (created.timestamp !== null && created.timestamp > SPAM_CREATED_AFTER) {
            const priv = await findPrivateUser(user);
            const postCount = await countUserPosts(user);
            const errorCount = deleteErrors ? await countUserErrors(user) : null;
            found.push({ user, priv, created, postCount, errorCount });
        }
    }

    return found;
}

function printUser(candidate, index) {
    const { user, priv, created, postCount, errorCount } = candidate;
    const accountAge = created.timestamp === null ? 'unknown' : formatDuration(Date.now() - created.timestamp);

    console.log(`${index}. username=${user.username || 'missing'}`);
    console.log(`   userpriv=${priv ? 'yes' : 'no'}`);
    console.log(`   posts=${postCount === null ? 'unknown' : postCount}`);
    if (deleteErrors) console.log(`   admin errors=${errorCount === null ? 'unknown' : errorCount}`);
    console.log(`   created=${created.display} (${created.source}) - ${accountAge} ago`);
}

async function saveLocalDeleteJSON({ candidate, deleteResult }) {
    const { user, priv, created, postCount, errorCount } = candidate;
    const userID = user && user._id ? String(user._id) : 'missing';
    const username = user && user.username ? user.username : 'missing';
    const deletedAt = new Date();
    const fileName = `${deletedAt.toISOString().replace(/[:.]/g, '-')}_${safeFilePart(username)}_${safeFilePart(userID)}.json`;
    const filePath = path.join(LOCAL_EXPORT_DIR, fileName);

    await fs.mkdir(LOCAL_EXPORT_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({
        deletedAt: deletedAt.toISOString(),
        sourceScript: 'scripts/deleteSpamUsersAfter.js',
        threshold: {
            createdAfter: SPAM_CREATED_AFTER,
            createdAfterISO: new Date(SPAM_CREATED_AFTER).toISOString()
        },
        preview: {
            username,
            userID,
            userprivExists: Boolean(priv),
            userToken: priv && priv.userToken ? priv.userToken : null,
            created,
            postCount,
            errorCount
        },
        preDeleteData: {
            user,
            userpriv: priv
        },
        deleteResult
    }, null, 2));

    return filePath;
}

async function deleteUserAdminErrors({ userID }) {
    const errors = await interactAdminErrorSchema.find({ userID }).select('_id').lean();
    const errorIDs = errors.map((error) => error._id);
    if (errorIDs.length === 0) {
        return {
            deletedCount: 0,
            indexIDsTouched: [],
            indexIDsDeleted: []
        };
    }

    const indexes = await interactAdminErrorIndexSchema.find({
        'errorIssues._id': { $in: errorIDs }
    });
    const indexIDsTouched = [];
    const indexIDsDeleted = [];

    for (const index of indexes) {
        const before = index.errorIssues.length;
        index.errorIssues = index.errorIssues.filter((issue) => !errorIDs.includes(issue._id));
        index.amount = index.errorIssues.length;

        if (index.errorIssues.length !== before) {
            indexIDsTouched.push(index._id);
            if (index.errorIssues.length === 0) {
                if (index.prevIndexID) {
                    await interactAdminErrorIndexSchema.findOneAndUpdate(
                        { _id: index.prevIndexID },
                        { nextIndexID: index.nextIndexID || null }
                    );
                }

                if (index.nextIndexID) {
                    await interactAdminErrorIndexSchema.findOneAndUpdate(
                        { _id: index.nextIndexID },
                        { prevIndexID: index.prevIndexID || null }
                    );
                }

                await interactAdminErrorIndexSchema.deleteOne({ _id: index._id });
                indexIDsDeleted.push(index._id);

                const currentErrorIndexID = await getCurrentErrorIndex();
                if (currentErrorIndexID === index._id) {
                    await setCurrentErrorIndex({ indexID: index.nextIndexID || index.prevIndexID || null });
                }
            } else {
                await index.save();
            }
        }
    }

    const deleted = await interactAdminErrorSchema.deleteMany({
        _id: { $in: errorIDs }
    });

    return {
        deletedCount: deleted.deletedCount || deleted.n || 0,
        indexIDsTouched,
        indexIDsDeleted
    };
}

async function promptBatch(rl, batch, batchNumber) {
    console.log('');
    console.log(`Batch ${batchNumber} (${batch.length} user${batch.length === 1 ? '' : 's'})`);
    batch.forEach((candidate, index) => printUser(candidate, index + 1));
    console.log('');

    if (dryRun) {
        console.log('DRY RUN: choosing y will not delete anything.');
    } else {
        console.warn('WARNING: choosing y will permanently run the internal deleteUser cascade for this batch.');
    }

    while (true) {
        const answer = (await rl.question('Delete this batch? y=delete, s=skip, q=quit: ')).trim().toLowerCase();
        if (['y', 's', 'q'].includes(answer)) return answer;
        console.log('Please enter y, s, or q.');
    }
}

async function deleteBatch(batch, summary) {
    for (const candidate of batch) {
        const { user } = candidate;
        const userID = user && user._id ? String(user._id) : null;

        if (!userID) {
            summary.failedCount += 1;
            summary.failures.push({ userID: 'missing', error: 'User has no _id/userID' });
            continue;
        }

        try {
            if (dryRun) {
                summary.skippedCount += 1;
                continue;
            }

            const deleteResult = await deleteUser({
                userID,
                username: user.username,
                shouldSendCompletionEmail: sendEmail
            });
            summary.deletedCount += 1;

            if (deleteErrors) {
                const deletedErrors = await deleteUserAdminErrors({ userID });
                summary.deletedErrorCount += deletedErrors.deletedCount;
                deleteResult.deletedAdminErrors = deletedErrors;
            }

            try {
                const localExportPath = await saveLocalDeleteJSON({ candidate, deleteResult });
                summary.localExports.push(localExportPath);
            } catch (exportErr) {
                summary.localExportFailures.push({
                    userID,
                    error: exportErr && exportErr.stack ? exportErr.stack : String(exportErr)
                });
            }
        } catch (err) {
            summary.failedCount += 1;
            summary.failures.push({
                userID,
                error: err && err.stack ? err.stack : String(err)
            });
        }
    }
}

function printSummary(summary) {
    console.log('');
    console.log('Final summary');
    console.log(`found count: ${summary.foundCount}`);
    console.log(`deleted count: ${summary.deletedCount}`);
    console.log(`skipped count: ${summary.skippedCount}`);
    console.log(`failed count: ${summary.failedCount}`);
    console.log(`deleted admin errors: ${summary.deletedErrorCount}`);
    console.log(`local JSON exports: ${summary.localExports.length}`);
    console.log(`local JSON export failures: ${summary.localExportFailures.length}`);

    if (summary.failures.length > 0) {
        console.log('failed user IDs/errors:');
        for (const failure of summary.failures) {
            console.log(`- ${failure.userID}: ${failure.error}`);
        }
    } else {
        console.log('failed user IDs/errors: none');
    }

    if (summary.localExports.length > 0) {
        console.log(`local export directory: ${LOCAL_EXPORT_DIR}`);
    }

    if (summary.localExportFailures.length > 0) {
        console.log('local JSON export failures:');
        for (const failure of summary.localExportFailures) {
            console.log(`- ${failure.userID}: ${failure.error}`);
        }
    }
}

async function main() {
    const rl = readline.createInterface({ input, output });
    const summary = {
        foundCount: 0,
        deletedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        failures: [],
        localExports: [],
        localExportFailures: [],
        deletedErrorCount: 0
    };

    try {
        console.log(`Loading environment from secret.env with config.current=${config.current}`);
        console.log(`Finding users created after ${SPAM_CREATED_AFTER} (${new Date(SPAM_CREATED_AFTER).toISOString()})`);

        if (dryRun) {
            console.log('DRY RUN ENABLED: no users will be deleted.');
        } else {
            console.warn('REAL RUN: this will delete users through the internal deleteUser cascade after each y confirmation.');
            if (!sendEmail) console.warn('Completion emails are disabled. Use --send-email to opt back in.');
            if (deleteErrors) console.warn('Admin errors for deleted users will also be deleted from interact-admin-error and indexes.');
            console.warn(`Local JSON backups will be written to ${LOCAL_EXPORT_DIR}`);
        }

        await connectDB();
        const candidates = await findSpamUsers();
        summary.foundCount = candidates.length;

        if (candidates.length === 0) {
            console.log('No matching users found.');
            return;
        }

        for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
            const batch = candidates.slice(i, i + BATCH_SIZE);
            const answer = await promptBatch(rl, batch, Math.floor(i / BATCH_SIZE) + 1);

            if (answer === 'q') {
                summary.skippedCount += candidates.length - i;
                break;
            }

            if (answer === 's') {
                summary.skippedCount += batch.length;
                continue;
            }

            await deleteBatch(batch, summary);
        }
    } finally {
        rl.close();
        await mongoose.connection.close();
        printSummary(summary);
    }
}

main().catch((err) => {
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
});
