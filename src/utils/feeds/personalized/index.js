const { allPostsFeedV2 } = require("..");
const interactPostSchema = require("../../../schemas/interactPostSchema");
const { checktime } = require("../../checktime");
const { embedSearch, getPostEmbedding } = require("../../search/embed");
const { cosineSimilarity } = require("../../search/searchV2");
const fs = require("fs");

const categories = [{
    name: "art",
    embedding: [],
}, {
    name: "design",
    embedding: [],
}, {
    name: "marketing",
    embedding: [],
}, {
    name: "business",
    embedding: [],
}, {
    name: "productivity",
    embedding: [],
}, {
    name: "other",
    embedding: [],
}, {
    name: "test",
    embedding: [],
}, {
    name: "development",
    embedding: [],
}, {
    name: "technology",
    embedding: [],
}, {
    name: "science",
    embedding: [],
}, {
    name: "artifical intelligence",
    embedding: [],
}];

// "development", "design", "marketing", "business", "productivity", "other"
async function categorizePosts({ posts }) {
    // c
    // get all posts
    // categorize them


    const categorizedPosts = [];
    const foundPosts = await interactPostSchema.find();
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
            if (cat.embedding.length == 0) {
                cat.embedding = await embedSearch({ content: cat.name });
            }
            allCatEmbeddings.push(cat.embedding.embedding.embedding);
            allCatNames.push(cat.name);
        }

        // console.log(categories);

        const foundSimlarities = cosineSimilarity(
            JSON.parse(foundEmbedding.embeddingPost?.embedding ?? "[]"), 
            allCatEmbeddings,
             allCatNames,
        );

        // console.log(foundSimlarities);
        const topCategory = foundSimlarities[0];
        postCategory.category = categories[topCategory.index].name;
        const pushToArr = {
            _id: post._id,
            category: topCategory.content,
            content: post.content,
        }
        categorizedPosts.push(pushToArr);
    }

    console.log(categorizedPosts);
    fs.writeFileSync(`categorizedPosts_${checktime()}.json`, JSON.stringify(categorizedPosts));
    return categorizedPosts;
}

async function buildPersonalizedFeed({ userID }) {
    if (!userID) return searchError("B009");

    // get embeddings
    const foundCategories = await categorizePosts({ posts: [] });

    
    const myFeed = await allPostsFeedV2({ userID });
    return myFeed;
}

module.exports = {
    buildPersonalizedFeed,
}