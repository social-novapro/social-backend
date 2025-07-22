const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const interactPostIndexSchema = require("../../../schemas/postSchemas/interactPostIndexSchema");
const interactPostSeenSchema = require("../../../schemas/postSchemas/interactPostSeenSchema");
const { checktime } = require("../../checktime");
const { getPostWithData } = require("../../post/getPost");
const { getUserCategoryScores } = require("../../post/postScores/userAutoScore");
const { v4: uuidv4 } = require("uuid");

async function buildPersonalizedFeed({ userID }) {
    if (!userID) return searchError("B009");

    const ownUser = await interactUserSchema.findOne({_id: userID});
    // const foundPosts = await interactPostSchema.find({});

    var sendingData = {
        nextIndexID: null,
        prevIndexID: null,
        amount: 0,
        feedVersion: 2,
        posts: [ ]
    }

    // look for post index
    var currentUserIndex = await interactPostIndexSchema.findOne({ userID, current: true, shown: false, expired: false });
    // Index is to old, reset it
    if (currentUserIndex?.timestamp < checktime()-(1000*60*60)) {
        console.log("Current user index is too old, generating new one");
        const foundIndexes = await interactPostIndexSchema.find({ userID, shown: false });
        for (const index of foundIndexes) {
            index.current = false;
            index.expired = true;
            await index.save();
        }
        currentUserIndex = null;
    }

    // generate new index if not found
    if (!currentUserIndex) {
        console.log("No current user index found, generating new one");
        // generate new indexes
        const foundCategoriesForUser = await getUserCategoryScores({ userID });
        if (!foundCategoriesForUser || foundCategoriesForUser.length === 0) {
            return { error: "No categories found for user" };
        }
        
        const seenPosts = await interactPostSeenSchema.find({ userID });
        const seenPostIDs = seenPosts.map(post => post.postID);
        
        // const categoryNames = foundCategoriesForUser.map(category => category.categoryData.name);
        const foundPosts = [];

        for (const category of foundCategoriesForUser) {
            const categoryName = category.categoryData.name;
            const score = category.score;

            const posts = await interactPostSchema.find({
                _id: { $nin: seenPostIDs },
                $or: [
                    { category: categoryName },
                    { subCats: categoryName }
                ]
            }).limit(score).sort({ timestamp: +1 });

            foundPosts.push(...posts);
        }
        foundPosts.sort((a, b) => a.timestamp - b.timestamp);

        // organize into indexes
        // split into indexes of 20 posts
        const createdIndexes = [];
        const amountIndexesCreated = 0;
        const postsPerIndex = 20;
        let currentIndex = [];
        let indexCount = 0;

        for (let i = 0; i < foundPosts.length; i++) {
            if (indexCount < postsPerIndex) {
                currentIndex.push(foundPosts[i]);
                indexCount++;
            } else {
                // save current index
                const newIndex = await interactPostIndexSchema.create({
                    _id: uuidv4(),
                    timestamp: checktime(),
                    nextIndexID: null,
                    prevIndexID: amountIndexesCreated > 0 ? createdIndexes[amountIndexesCreated - 1]._id : null ,
                    amount: currentIndex.length,
                    current: amountIndexesCreated === 0 ? true : false,
                    shown: false,
                    expired: false,
                    userID,
                    postIDs: currentIndex.map(post => ({ _id: post._id }))
                });
                
                createdIndexes.push(newIndex);
                if (amountIndexesCreated > 0) {
                    const prevIndex = createdIndexes[amountIndexesCreated - 1];
                    prevIndex.nextIndexID = newIndex._id;
                    await prevIndex.save();
                }

                currentIndex = [];
                indexCount = 0;
            }
        }

        currentUserIndex = createdIndexes[0];
    } else {
        console.log("Current user index found, using it");
    }

    // set current index to shown true, current false
    currentUserIndex.shown = true;
    currentUserIndex.current = false;
    await currentUserIndex.save();
    await interactPostIndexSchema.findOneAndUpdate({ _id: currentUserIndex.nextIndexID }, { current: true });

    sendingData.nextIndexID = currentUserIndex.nextIndexID;
    sendingData.prevIndexID = currentUserIndex.prevIndexID;

    for (const post of currentUserIndex.postIDs) {
        if (!post || !post._id/*|| amountFound>=category.score*/) continue;
        const postData = await getPostWithData({ userID, postID: post._id, ownUser });
        // add to seen, even if error
        if (postData) {
            await interactPostSeenSchema.create({
                _id: uuidv4(),
                postID: post._id,
                userID,
                usuerPostIndexID: currentUserIndex._id,
                timestamp: checktime(),
            });

            if (!postData.error) {
                sendingData.posts.push(postData);
            }
        }
    }

    sendingData.amount = sendingData.posts.length;
    // sendingData.posts.sort((a, b) => a.postData.timestamp - b.postData.timestamp);
    return sendingData;
}

// build all, do first 10-20 posots
// then put next into an arrais with shown=false, current=false
// then as user scrolls, load next posts, with shown=true, current=false, and nextIndexID will be changned to current=true



module.exports = {
    buildPersonalizedFeed
}