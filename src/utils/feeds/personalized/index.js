const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { getPostWithData } = require("../../post/getPost");
const { cosineSimilarity } = require("../../search/searchV2");

// var { categories } = require("../../post/categories/startup/categories.json");
const { getCategoryFromDB } = require("../../post/categories/startup");
const { getUserCategoryScores } = require("../../post/postScores/userAutoScore");
// var categories = []

// chatgpt quick closet category
function findClosestCategory(postEmbedding, allCatEmbeddings, allCatNames) {
    const similarities = cosineSimilarity(postEmbedding, allCatEmbeddings, allCatNames);
    return similarities.sort((a, b) => b.similarity - a.similarity)[0].content; // Top category
}

async function buildPersonalizedFeed({ userID }) {
    if (!userID) return searchError("B009");

    const ownUser = await interactUserSchema.findOne({_id: userID});
    // const foundPosts = await interactPostSchema.find({});

    var sendingData = {
        // nextIndexID: currentIndex.nextIndexID,
        // prevIndexID: currentIndex.prevIndexID,
        amount: 0,
        feedVersion: 2,
        posts: [ ]
    }

    const foundCategoriesForUser = await getUserCategoryScores({ userID });
    // console.log("Found categories for user", foundCategoriesForUser);

    for (const category of foundCategoriesForUser) {
        // console.log("Category for user", category);
        if (!category || !category.categoryID || category.score<=0) continue;

        const foundPosts = await interactPostSchema.find({ category: category.categoryData.name }).limit(category.score)
        // console.log("Found posts for category", category.categoryData.name, foundPosts);
        if (!foundPosts || foundPosts.length === 0) continue;
        // console.log("Found posts for category", category.categoryID, foundPosts)
        // var amountFound = 0;

        for (const post of foundPosts) {
            if (!post || !post._id/*|| amountFound>=category.score*/) continue;
            const postData = await getPostWithData({ userID, postID: post._id, ownUser });
            if (postData && !postData.error) {
                sendingData.posts.push(postData);
                // amountFound++;
            } else {
                console.log("Error getting post data for", post._id);
            }
        }
    }

    sendingData.amount = sendingData.posts.length;
    
    sendingData.posts.sort((a, b) => a.postData.timestamp - b.postData.timestamp);
    return sendingData;
}

module.exports = {
    buildPersonalizedFeed
}