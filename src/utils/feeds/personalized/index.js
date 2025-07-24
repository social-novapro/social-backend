const { allPostsFeedV2 } = require("..");
const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const interactPostIndexSchema = require("../../../schemas/postSchemas/interactPostIndexSchema");
const interactPostSeenSchema = require("../../../schemas/postSchemas/interactPostSeenSchema");
const interactFollowIndexSchema = require("../../../schemas/user/interactFollowIndexSchema");
const { checktime } = require("../../checktime");
const { getPostWithData } = require("../../post/getPost");
const { getUserCategoryScores } = require("../../post/postScores/userAutoScore");
const { v4: uuidv4 } = require("uuid");
const { searchErrorV2 } = require("../../searchError");

// Add feature that will adjust weights if no posts were found --- temporarily, just so theres always posts 
// for now auto default to allposts
async function wipeUserIndexes({userID}) {
    if (!userID) return searchErrorV2("B009", { userID });

    const foundIndexes = await interactPostIndexSchema.find({ userID : userID });
    for (const index of foundIndexes) {
        if (index.userID) {
            await interactPostIndexSchema.findOneAndDelete({ _id: index._id });
            // if (foundAndDel) {
            //     console.log(`Deleted index: ${foundAndDel._id} for user: ${foundAndDel.userID}`);
            // }
        }
    }

    const foundSeenPosts = await interactPostSeenSchema.find( {userID: userID, current: true });
    for (const seenPost of foundSeenPosts) {
        await interactPostSeenSchema.findOneAndUpdate({ _id: seenPost._id},{ current: false });
        // if (foundAndDel) {
        //     console.log(`Deleted seen post: ${foundAndDel._id}`);
        // }
    }

    return { success: true, msg: "User indexes wiped successfully" };
}

async function buildPersonalizedFeed({ userID, indexID=null }) {
    // await wipeUserIndexes();
    if (!userID) return searchErrorV2("B009", {userID: "unknown"});

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
    var currentUserIndex = await interactPostIndexSchema.findOne({ userID, isUserSpecific: true, current: true, shown: false, expired: false });
    if (indexID) {
        // commented later so allPosts will still work if running out of posts
        currentUserIndex = await interactPostIndexSchema.findOne({ _id: indexID})//, userID, isUserSpecific: true });

        if (currentUserIndex && currentUserIndex.isUserSpecific === false) {
            const allPostsReturn = await allPostsFeedV2({ userID });
            return allPostsReturn;
        }
    }

    // Index is to old, reset it
    if (!indexID && currentUserIndex?.timestamp < checktime()-(1000*60*60)) {
        searchErrorV2("D030", { userID });
        const foundIndexes = await interactPostIndexSchema.find({ userID, isUserSpecific: true, shown: false });
        for (const index of foundIndexes) {
            index.current = false;
            index.expired = true;
            await index.save();
        }
        currentUserIndex = null;
    }

    // generate new index if not found
    if (!currentUserIndex) {
        // generate new indexes
        const foundCategoriesForUser = await getUserCategoryScores({ userID });
        if (!foundCategoriesForUser || foundCategoriesForUser.length === 0 || foundCategoriesForUser.error) {
            return searchErrorV2("Q033")
        }
        const seenPosts = await interactPostSeenSchema.find({ userID, current: true});
        const seenPostIDs = seenPosts.map(post => post.postID);
        // const categoryNames = foundCategoriesForUser.map(category => category.categoryData.name);
        const foundPosts = [];
        const addedPostIDs = [];

        // Getting posts from categories and subcategories
        for (const category of foundCategoriesForUser) {
            const categoryName = category.categoryData.name;
            const score = category.score;

            const posts = await interactPostSchema.find({
                _id: { $nin: [...seenPostIDs, ...addedPostIDs] },
                $or: [
                    { category: categoryName },
                    { subCats: categoryName }
                ]
            }).limit(score).sort({ timestamp: +1 });

            foundPosts.push(...posts);
            addedPostIDs.push(...posts.map(post => post._id));
        }

        // Posts who replied or quoted the user
        const postsRepliesQuotes = await interactPostSchema.find({
            _id: { $nin: [...seenPostIDs, ...addedPostIDs] },
            $or: [
                { "replyData.userID": userID },
                { "quoteData.userID": userID }
            ]
        }).limit(20).sort({ timestamp: +1 });
        foundPosts.push(...postsRepliesQuotes);
        addedPostIDs.push(...postsRepliesQuotes.map(post => post._id));

        // Add posts from user following
        const userFollowingPosts = [];
        var endReached = false;
        
        var userFollowingIndex = await interactFollowIndexSchema.findOne({ userID: userID, type: 0, current: true });
        if (!userFollowingIndex) endReached = true;
        while (userFollowingPosts.length <= 0 && endReached == false) {
            for (const follow of userFollowingIndex.follows) {
                const userPosts = await interactPostSchema.find({
                    _id: { $nin: [...seenPostIDs, ...addedPostIDs] },
                    userID: follow._id 
                }).limit(20).sort({ timestamp: +1 });
                userFollowingPosts.push(...userPosts);
                addedPostIDs.push(...userPosts.map(post => post._id));
            }
            if (userFollowingPosts.length <= 0) {
                if (!userFollowingIndex || !userFollowingIndex.nextIndexID){
                    endReached = true;
                } else {
                    userFollowingIndex = await interactFollowIndexSchema.findOne({ _id: userFollowingIndex.nextIndexID, userID, type: 0 });
                }
            }
        }
        foundPosts.push(...userFollowingPosts);
        // addedPostIDs.push(...userFollowingPosts.map(post => post._id));

        // console.log(`Found ${foundPosts.length} posts for user: ${userID}`);
        // console.log(`Found ${userFollowingPosts.length} posts from user following`);
        // console.log(`Found ${postsRepliesQuotes.length} posts who replied or quoted the user`);
        foundPosts.sort((a, b) => a.timestamp - b.timestamp);

        // organize into indexes
        // split into indexes of 20 posts
        const createdIndexes = [];
        const postsPerIndex = 20;
        let amountIndexesCreated = 0;
        let currentIndex = [];
        let indexCount = 0;

        for (let i = 0; i < foundPosts.length; i++) {
            if (indexCount < postsPerIndex) {
                if (foundPosts[i]._id) currentIndex.push({_id: foundPosts[i]._id});
                else searchErrorV2("Q031", { userID, options: [{name: "postData", data: JSON.stringify(foundPosts[i])}]});
                indexCount++;
            } else {
                // save current index
                const newIndex = await interactPostIndexSchema.create({
                    _id: uuidv4(),
                    timestamp: checktime(),
                    nextIndexID: null,
                    prevIndexID: amountIndexesCreated > 0 ? createdIndexes[amountIndexesCreated - 1]._id : null ,
                    amount: currentIndex.length,
                    isUserSpecific: true,
                    current: false, //amountIndexesCreated === 0 ? true : false,
                    shown: false,
                    expired: false,
                    userID,
                    postIDs: [...currentIndex] //.map(post => ({ _id: post._id }))
                });

                createdIndexes.push(newIndex);

                if (amountIndexesCreated > 0) {
                    const prevIndex = createdIndexes[amountIndexesCreated - 1];
                    prevIndex.nextIndexID = newIndex._id;
                    await prevIndex.save();
                }
                currentIndex = [];
                indexCount = 0;
                amountIndexesCreated++;
            }
        }


        currentUserIndex = createdIndexes[amountIndexesCreated-1];
        if (currentUserIndex) {
            currentUserIndex.current = true;
            await currentUserIndex.save();
            // return { error: "No posts found for user" };
            // removed this so will proceed to next steps, and return allPostsFeedV2 if no posts found
        }
    }

    if (!currentUserIndex || !currentUserIndex.postIDs || currentUserIndex.postIDs.length === 0) {
        // default to allposts
        searchErrorV2("Q032", { userID });
        const allPostsFeed = await allPostsFeedV2({ userID });
        return allPostsFeed;
    }
    // set current index to shown true, current false
    await interactPostIndexSchema.findOneAndUpdate({ _id: currentUserIndex._id}, { current: false, shown: true })
    await interactPostIndexSchema.findOneAndUpdate({ _id: currentUserIndex.nextIndexID }, { current: true });

    sendingData.nextIndexID = currentUserIndex.nextIndexID;
    sendingData.prevIndexID = currentUserIndex.prevIndexID;

    for (const post of currentUserIndex.postIDs) {
        if (!post || !post._id/*|| amountFound>=category.score*/) continue;
        const postData = await getPostWithData({ userID, postID: post._id, ownUser });
        // add to seen, even if error
        if (postData) {
            // check if seen
            const seenPost = await interactPostSeenSchema.findOne({ postID: post._id, userID, current: true });
            if (!seenPost) {
                // create seen post
                await interactPostSeenSchema.create({
                    _id: uuidv4(),
                    postID: post._id,
                    userID,
                    userPostIndexID: currentUserIndex._id,
                    timestamp: checktime(),
                    current: true
                });
            }

            if (!postData.error) {
                sendingData.posts.push(postData);
            }
        }
    }

    sendingData.amount = sendingData.posts.length;

    if (sendingData.amount <=0 && sendingData.prevIndexID ) {
        console.log(`No posts found for user: ${userID} in index: ${currentUserIndex._id}, trying to get next index...`);
        const gettingFeedAgain = await buildPersonalizedFeed({ userID });
        return gettingFeedAgain;
    }
    return sendingData;
}

// build all, do first 10-20 posots
// then put next into an arrais with shown=false, current=false
// then as user scrolls, load next posts, with shown=true, current=false, and nextIndexID will be changned to current=true

module.exports = {
    buildPersonalizedFeed,
    wipeUserIndexes
}