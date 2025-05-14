const { allPostsFeedV2 } = require("..");
const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { checktime } = require("../../checktime");
const { getPostWithData } = require("../../post/getPost");
const { embedSearch, getPostEmbedding } = require("../../search/embed");
const { cosineSimilarity } = require("../../search/searchV2");
const fs = require("fs");

// var { categories } = require("../../post/categories/startup/categories.json");
const { getCategoriesFromDB, getCategoryFromDB, getCategoryRuntimeInfo } = require("../../post/categories/startup");
// var categories = []

var categoryRuntimeInfo = null;

// "development", "design", "marketing", "business", "productivity", "other"
async function categorizePost({ postID }) {
    // get post by id and embedding
    if (!postID) return { error: true, msg: "No post ID provided" }; 

    const foundPost = await interactPostSchema.findOne({_id: postID});
    if (!foundPost) return { error: true, msg: "No post found" };

    // is categories filled
    if (!categoryRuntimeInfo) {
        const tempCategoryRuntimeInfo = await getCategoryRuntimeInfo();
        if (!tempCategoryRuntimeInfo || tempCategoryRuntimeInfo.error) return tempCategoryRuntimeInfo || { error: true, msg: "No categories found" };
        categoryRuntimeInfo = tempCategoryRuntimeInfo;
    }

    // post embeddings
    const foundEmbedding = await getPostEmbedding({ postID });
    if (!foundEmbedding) return { error: true, msg: "No embedding found for post" };
    if (!foundEmbedding || !foundEmbedding.embeddingPost || !foundEmbedding.embeddingPost.embedding) return { error: true, msg: "Missing Embedding data for post" };
    console.log("Found Embedding", foundEmbedding);
    // console.log(foundEmbedding.embeddingPost);
    // quick prediction
    const quickPrediction = findClosestCategory(JSON.parse(foundEmbedding.embeddingPost.embedding ?? "[]"), categoryRuntimeInfo.catEmbeddings, categoryRuntimeInfo.catNames);
    console.log("Predicted Category:", quickPrediction, foundPost.content);

    // compare each sentence to each category, then average the similarity
    const foundSimlarities = [];
    var amount = 1;
    var finalScores = {};

    // console.log("catrun cat embeddings", categoryRuntimeInfo.catEmbeddings);

    for (const sentence of foundEmbedding.sentences ?? []) {
        if (!sentence || !sentence.embedding) continue;

        const foundSimlaritySentence = cosineSimilarity(
            JSON.parse(sentence.embedding ?? "[]"), 
            categoryRuntimeInfo.catEmbeddings, categoryRuntimeInfo.catNames
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

    console.log("v2, ", finalScores, amount, foundSimlarities);
    // 



    // old CODE
    return { error: true, msg: "No category found" };
    for (const post of foundPosts) {


        const foundSimlarities = [];
        var amount = 1;
        var finalScores = {};
        // const 
        // compare each sentence to each category, then average the similarity
        for (const sentence of foundEmbedding.sentences ?? []) {
            console.log(sentence);
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
            console.log(score, finalScores[score]);
            finalScores[score].similarity = finalScores[score].similarity / amount;
            console.log(finalScores[score].similarity);
            if (finalScores[score].similarity < 0.5) continue;
            categoriesFound.push(finalScores[score]);
        }

        var topCategory = {}; // name, similarity
        var subCategories = [];

        categoriesFound.sort((a, b) => a.similarity - b.similarity);

        categoriesFound.reverse();
        topCategory = categoriesFound[0];

        subCategories = categoriesFound.slice(1, 6);
        
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

    fs.writeFileSync(`cat_tests/categorizedPosts_${checktime()}.json`, JSON.stringify(categorizedPosts));

    return categorizedPosts;
}

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