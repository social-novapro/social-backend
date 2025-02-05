const { allPostsFeedV2 } = require("..");
const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { checktime } = require("../../checktime");
const { getPostWithData } = require("../../post/getPost");
const { embedSearch, getPostEmbedding } = require("../../search/embed");
const { cosineSimilarity } = require("../../search/searchV2");
const fs = require("fs");

// var { categories } = require("../../post/categories/startup/categories.json");
const { getCategoriesFromDB, getCategoryFromDB } = require("../../post/categories/startup");
// var categories = []

var categories = null;

// "development", "design", "marketing", "business", "productivity", "other"
async function categorizePost({ postID }) {
    // c
    // get all posts
    // categorize them


    var foundPosts = [];
    const categorizedPosts = [];
    if (postID) {
        foundPosts = await interactPostSchema.find({_id: postID})//{_id: "27e7e43c-422b-4a6b-b899-384dee1affbc"});
        
    } else {
        foundPosts = await interactPostSchema.find()//{_id: "27e7e43c-422b-4a6b-b899-384dee1affbc"});
    }

    if (!categories) {
        categories = await getCategoriesFromDB();
    }

    for (const post of foundPosts) {
        const postCategory = {
            content: post.content,
            category: "other",
        }

        const allCatEmbeddings = [];
        const allCatNames = [];
        const foundEmbedding = await getPostEmbedding({ postID: post._id });
        if (!foundEmbedding) continue;

        // console.log(foundEmbedding);
        for (const cat of categories) {
            // if (!cat.embedding || cat.embedding.length == 0) {
            //     cat.embedding = await embedSearch({ content: cat.name });
            // }
            allCatEmbeddings.push(JSON.parse(cat.embedding ?? "[]"));
            allCatNames.push(cat.name);
        }

    //  /* chatgpt quick closet category
        function findClosestCategory(postEmbedding, allCatEmbeddings, allCatNames) {
            const similarities = cosineSimilarity(postEmbedding, allCatEmbeddings, allCatNames);
            return similarities.sort((a, b) => b.similarity - a.similarity)[0].content; // Top category
        }

        if (!foundEmbedding || !foundEmbedding.embeddingPost || !foundEmbedding.embeddingPost.embedding) continue;
        const postCategory2 = findClosestCategory(JSON.parse(foundEmbedding.embeddingPost.embedding ?? "[]"), allCatEmbeddings, allCatNames);
        // console.log("Predicted Category:", postCategory2, post.content);
        // continue;
        // */

        const foundSimlarities = [];
        var amount = 1;
        var finalScores = {};
        // const 
        // compare each sentence to each category, then average the similarity
        for (const sentence of foundEmbedding.sentences ?? []) {
            if (!sentence || !sentence.embedding) continue;

            const foundSimlaritySentence = cosineSimilarity(
                JSON.parse(sentence.embedding ?? "[]"), 
                allCatEmbeddings,
                allCatNames,
            );
            
            foundSimlarities.push(foundSimlaritySentence);
            
            for (const similarity of foundSimlaritySentence) {
                if (!similarity.content || !similarity.similarity || isNaN(similarity.similarity)) continue;

                if (!finalScores[similarity.content]) {
                    finalScores[similarity.content] = similarity;
                } else {
                    finalScores[similarity.content].similarity += similarity.similarity;
                }
            }

            amount++;
        }
        
        var categoriesFound = [];
        for (const score in finalScores) {
            finalScores[score].similarity = finalScores[score].similarity / amount;
            if (finalScores[score].similarity < 0.5) continue;
            categoriesFound.push(finalScores[score]);
        }

        var topCategory = {}; // name, similarity
        var subCategories = [];

        categoriesFound.sort((a, b) => a.similarity - b.similarity);

        console.log(categoriesFound)
        categoriesFound.reverse();
        topCategory = categoriesFound[0];

        subCategories = categoriesFound.slice(1, 6);
        console.log(finalScores);
        
        if (!topCategory || !topCategory.similarity) continue;
        if (topCategory.similarity < 0.5) continue;
        const pushToArr = {
            _id: post._id,
            category: topCategory.content,
            subCats: subCategories.map((sub) => sub.content),
            content: post.content,
            simliarityScore: topCategory.similarity,
            predicted: postCategory2
        }

        categorizedPosts.push(pushToArr);
    }

    console.log(categorizedPosts);
    fs.writeFileSync(`cat_tests/categorizedPosts_${checktime()}.json`, JSON.stringify(categorizedPosts));

    return categorizedPosts;
}

async function buildPersonalizedFeed({ userID }) {
    if (!userID) return searchError("B009");

    const ownUser = await interactUserSchema.findOne({_id: userID});
    const foundPosts = await categorizePost({});

    var sendingData = {
        // nextIndexID: currentIndex.nextIndexID,
        // prevIndexID: currentIndex.prevIndexID,
        amount: 0,
        feedVersion: 2,
        posts: [ ]
    }

    for (const post of foundPosts) {
        const category = post.category;
        const foundCategory = await getCategoryFromDB({ categoryName: category  });
        
        var compareCat = category;
        if (foundCategory.parentCategoryID) {
            const parentCategory = await getCategoryFromDB({ categoryID: foundCategory.parentCategoryID  });
            compareCat = parentCategory.name;
        }

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
    buildPersonalizedFeed,
    categorizePost
}