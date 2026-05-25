require('dotenv').config({ path: 'secret.env' });

const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const mongoose = require('mongoose');
const config = require('../config.json');
const interactUserSchema = require('../src/schemas/interactUserSchema');
const interactUserPrivSchema = require('../src/schemas/interactUserPrivSchema');
const interactPostSchema = require('../src/schemas/interactPostSchema');
const { deleteUser } = require('../src/utils/user/deleteUser');

const SPAM_CREATED_AFTER = 1779623724700;
const BATCH_SIZE = 10;
const dryRun = process.argv.includes('--dry-run');

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

async function findSpamUsers() {
    const found = [];
    const cursor = interactUserSchema.find({}).lean().cursor();

    for await (const user of cursor) {
        const created = getUserCreatedAt(user);
        if (created.timestamp !== null && created.timestamp > SPAM_CREATED_AFTER) {
            const priv = await findPrivateUser(user);
            const postCount = await countUserPosts(user);
            found.push({ user, priv, created, postCount });
        }
    }

    return found;
}

function printUser(candidate, index) {
    const { user, priv, created, postCount } = candidate;
    const accountAge = created.timestamp === null ? 'unknown' : formatDuration(Date.now() - created.timestamp);

    console.log(`${index}. username=${user.username || 'missing'}`);
    console.log(`   userpriv=${priv ? 'yes' : 'no'}`);
    console.log(`   posts=${postCount === null ? 'unknown' : postCount}`);
    console.log(`   created=${created.display} (${created.source}) - ${accountAge} ago`);
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

            await deleteUser({ userID, username: user.username });
            summary.deletedCount += 1;
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

    if (summary.failures.length > 0) {
        console.log('failed user IDs/errors:');
        for (const failure of summary.failures) {
            console.log(`- ${failure.userID}: ${failure.error}`);
        }
    } else {
        console.log('failed user IDs/errors: none');
    }
}

async function main() {
    const rl = readline.createInterface({ input, output });
    const summary = {
        foundCount: 0,
        deletedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        failures: []
    };

    try {
        console.log(`Loading environment from secret.env with config.current=${config.current}`);
        console.log(`Finding users created after ${SPAM_CREATED_AFTER} (${new Date(SPAM_CREATED_AFTER).toISOString()})`);

        if (dryRun) {
            console.log('DRY RUN ENABLED: no users will be deleted.');
        } else {
            console.warn('REAL RUN: this will delete users through the internal deleteUser cascade after each y confirmation.');
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
