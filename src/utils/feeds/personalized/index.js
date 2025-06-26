const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { getPostWithData } = require("../../post/getPost");
const { cosineSimilarity } = require("../../search/searchV2");

// var { categories } = require("../../post/categories/startup/categories.json");
const { getCategoryFromDB } = require("../../post/categories/startup");
// var categories = []

// chatgpt quick closet category
function findClosestCategory(postEmbedding, allCatEmbeddings, allCatNames) {
    const similarities = cosineSimilarity(postEmbedding, allCatEmbeddings, allCatNames);
    return similarities.sort((a, b) => b.similarity - a.similarity)[0].content; // Top category
}

async function buildPersonalizedFeed({ userID }) {
    if (!userID) return searchError("B009");

    const ownUser = await interactUserSchema.findOne({_id: userID});
    const foundPosts = await interactPostSchema.find({});

    var sendingData = {
        // nextIndexID: currentIndex.nextIndexID,
        // prevIndexID: currentIndex.prevIndexID,
        amount: 0,
        feedVersion: 2,
        posts: [ ]
    }


    for (const post of foundPosts) {
        if (!post || !post._id) continue;
        if (!post.category) continue;
        else console.log("Post category", post.category);
        const category = post.category;
        const foundCategory = await getCategoryFromDB({ categoryName: category  });
        
        var compareCat = category;
        if (foundCategory.parentCategoryID) {
            const parentCategory = await getCategoryFromDB({ categoryID: foundCategory.parentCategoryID  });
            compareCat = parentCategory.name;
        }

        // implement subcategories here too, this is just comparing the main category

        console.log(compareCat, category)

        if (!post || !post._id) continue;
        if (compareCat != "technology" && compareCat != "development") continue;

        const postData = await getPostWithData({ userID, postID: post._id, ownUser });
        if (postData && !postData.error) {
            sendingData.posts.push(postData);
        } else {
            console.log("errr");
        }
    }

    sendingData.amount = sendingData.posts.length;
    
    sendingData.posts.sort((a, b) => a.postData.timestamp - b.postData.timestamp);
    return sendingData;
}

module.exports = {
    buildPersonalizedFeed
}