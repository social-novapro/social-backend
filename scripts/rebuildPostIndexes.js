require('dotenv').config({ path: 'secret.env' });

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const config = require('../config.json');
const interactPostSchema = require('../src/schemas/interactPostSchema');
const interactUserSchema = require('../src/schemas/interactUserSchema');
const interactPostIndexSchema = require('../src/schemas/postSchemas/interactPostIndexSchema');
const interactUserPostIndexSchema = require('../src/schemas/postSchemas/interactUserPostIndexSchema');
const { updatePostIndex } = require('../src/utils/indexes');
const { checktime } = require('../src/utils/checktime');

const GLOBAL_INDEX_SIZE = 50;
const USER_INDEX_SIZE = 30;
const apply = process.argv.includes('--apply');
const globalOnly = process.argv.includes('--global-only');
const userOnly = process.argv.includes('--user-only');

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

function sortPostsOldestFirst(posts) {
    return posts.sort((a, b) => {
        const aTime = Number.isFinite(a.timestamp) ? a.timestamp : 0;
        const bTime = Number.isFinite(b.timestamp) ? b.timestamp : 0;
        return aTime - bTime;
    });
}

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

async function createPostIndexChain({ posts, userID=null, indexSize, IndexModel }) {
    const chunks = chunkArray(posts, indexSize);
    const createdIndexes = [];
    let prevIndexID = null;

    for (const chunk of chunks) {
        const indexID = uuidv4();
        const indexDoc = {
            _id: indexID,
            timestamp: checktime(),
            amount: chunk.length,
            prevIndexID,
            nextIndexID: null,
            postIDs: chunk.map((post) => ({ _id: post._id }))
        };

        if (userID) indexDoc.userID = userID;

        if (apply) {
            await IndexModel.create(indexDoc);
            if (prevIndexID) {
                await IndexModel.findOneAndUpdate(
                    { _id: prevIndexID },
                    { nextIndexID: indexID }
                );
            }
        }

        createdIndexes.push(indexDoc);
        prevIndexID = indexID;
    }

    return createdIndexes;
}

async function rebuildGlobalPostIndexes({ posts }) {
    const summary = {
        posts: posts.length,
        deletedExistingIndexes: 0,
        createdIndexes: 0,
        currentIndexID: null
    };

    const existingIndexCount = await interactPostIndexSchema.countDocuments({});
    summary.deletedExistingIndexes = existingIndexCount;

    if (!apply) {
        summary.createdIndexes = Math.ceil(posts.length / GLOBAL_INDEX_SIZE);
        return summary;
    }

    await interactPostIndexSchema.deleteMany({});
    await interactPostSchema.updateMany({}, { indexID: null });

    const indexes = await createPostIndexChain({
        posts,
        indexSize: GLOBAL_INDEX_SIZE,
        IndexModel: interactPostIndexSchema
    });

    summary.createdIndexes = indexes.length;
    summary.currentIndexID = indexes.length > 0 ? indexes[indexes.length - 1]._id : null;

    for (const index of indexes) {
        await interactPostSchema.updateMany(
            { _id: { $in: index.postIDs.map((post) => post._id) } },
            { indexID: index._id }
        );
    }

    await updatePostIndex({ indexID: summary.currentIndexID });

    return summary;
}

async function rebuildUserPostIndexes({ posts }) {
    const summary = {
        usersWithPosts: 0,
        deletedExistingIndexes: 0,
        createdIndexes: 0,
        posts: posts.length
    };

    const existingIndexCount = await interactUserPostIndexSchema.countDocuments({});
    summary.deletedExistingIndexes = existingIndexCount;

    const postsByUser = new Map();
    for (const post of posts) {
        if (!post.userID) continue;
        if (!postsByUser.has(post.userID)) postsByUser.set(post.userID, []);
        postsByUser.get(post.userID).push(post);
    }
    summary.usersWithPosts = postsByUser.size;

    if (!apply) {
        for (const userPosts of postsByUser.values()) {
            summary.createdIndexes += Math.ceil(userPosts.length / USER_INDEX_SIZE);
        }
        return summary;
    }

    await interactUserPostIndexSchema.deleteMany({});
    await interactPostSchema.updateMany({}, { userPostIndexID: null });
    await interactUserSchema.updateMany({}, { postIndexID: null });

    for (const [userID, userPosts] of postsByUser.entries()) {
        const indexes = await createPostIndexChain({
            posts: sortPostsOldestFirst(userPosts),
            userID,
            indexSize: USER_INDEX_SIZE,
            IndexModel: interactUserPostIndexSchema
        });

        summary.createdIndexes += indexes.length;

        for (const index of indexes) {
            await interactPostSchema.updateMany(
                { _id: { $in: index.postIDs.map((post) => post._id) } },
                { userPostIndexID: index._id }
            );
        }

        const currentUserIndexID = indexes.length > 0 ? indexes[indexes.length - 1]._id : null;
        await interactUserSchema.findOneAndUpdate(
            { _id: userID },
            { postIndexID: currentUserIndexID }
        );
    }

    return summary;
}

function printSummary({ globalSummary, userSummary }) {
    console.log('');
    console.log(apply ? 'Rebuild complete' : 'Dry run only');

    if (globalSummary) {
        console.log('Global post indexes:');
        console.log(`  live posts: ${globalSummary.posts}`);
        console.log(`  existing indexes ${apply ? 'deleted' : 'that would be deleted'}: ${globalSummary.deletedExistingIndexes}`);
        console.log(`  indexes ${apply ? 'created' : 'that would be created'}: ${globalSummary.createdIndexes}`);
        if (globalSummary.currentIndexID) console.log(`  current postsIndex: ${globalSummary.currentIndexID}`);
    }

    if (userSummary) {
        console.log('User post indexes:');
        console.log(`  live posts: ${userSummary.posts}`);
        console.log(`  users with posts: ${userSummary.usersWithPosts}`);
        console.log(`  existing indexes ${apply ? 'deleted' : 'that would be deleted'}: ${userSummary.deletedExistingIndexes}`);
        console.log(`  indexes ${apply ? 'created' : 'that would be created'}: ${userSummary.createdIndexes}`);
    }
}

async function main() {
    if (globalOnly && userOnly) {
        throw new Error('Use only one of --global-only or --user-only.');
    }

    console.log(`Loading environment from secret.env with config.current=${config.current}`);
    console.log(apply ? 'APPLY MODE: existing post indexes will be deleted and rebuilt.' : 'DRY RUN: no database changes will be made. Use --apply to rebuild.');

    await connectDB();

    const posts = sortPostsOldestFirst(await interactPostSchema.find({
        deleted: { $ne: true }
    }).select('_id userID timestamp').lean());

    const globalSummary = userOnly ? null : await rebuildGlobalPostIndexes({ posts });
    const userSummary = globalOnly ? null : await rebuildUserPostIndexes({ posts });

    printSummary({ globalSummary, userSummary });
}

main()
    .catch((err) => {
        console.error(err && err.stack ? err.stack : err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close();
    });
