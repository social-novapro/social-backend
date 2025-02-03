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
    name: "statement",
    embedding: [],
}, {
    name: "i understand",
    embedding: [],
},{
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
}, {
    name: "life",
    embedding: [],
}, {
    name: "music",
    embedding: [],
}, {
    name: "javascript",
    embedding: [],
}, {
    name: "software",
    embedding: [],
}, {
    name: "finance",
    embedding: [],
}];

// "development", "design", "marketing", "business", "productivity", "other"
async function categorizePosts({ posts }) {
    // c
    // get all posts
    // categorize them


    const categorizedPosts = [];
    const foundPosts = await interactPostSchema.find({_id: "27e7e43c-422b-4a6b-b899-384dee1affbc"});

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
            console.log(sentence.sentence)

            foundSimlarities.push(foundSimlaritySentence);
            console.log(foundSimlaritySentence);
            
            for (const similarity of foundSimlaritySentence) {
                console.log(similarity)
                if (!similarity.content || !similarity.similarity || isNaN(similarity.similarity)) continue;
                // similarity.similarity = Math.round(similarity.similarity*100);
                if (!finalScores[similarity.content]) {
                    finalScores[similarity.content] = similarity;
                } else {
                    finalScores[similarity.content].similarity += similarity.similarity;
                }
                // if (!finalScores[similarity.content]) finalScores[similarity.content] = similarity;
                // else {
                //     finalScores[similarity.content].similarity += similarity.similarity;
                // }

                // console.log(finalScores[similarity.content]);

                // finalScores[similarity.content].similarity = finalScores[similarity.content].similarity / amount;
                console.log(finalScores[similarity.content].similarity / amount, finalScores[similarity.content].similarity, amount, similarity.similarity);
            }

            amount++;

            // for (const similarity of foundSimlarities) {
            //     if (similarity.similarity == NaN) continue;
            //     if (similarity.similarity < 0.5) continue;
            //     if (similarity.content == categories[0].name) {
            //         console.log(post);
            //         console.log("ERROR: ", similarity);
            //         continue;
            //     } else {
            //         console.log(similarity.content);
            //     }
            // }
        }
        
        // var finalScore
        // for (const similarity of foundSimlarities) {
            
        // }

//         const topCategory = foundSimlarities[0]
        /*
        // compares the entire post embedding to each category
        if (!foundEmbedding.embeddingPost?.embedding) continue;
        const foundSimlarities = cosineSimilarity(
            JSON.parse(foundEmbedding.embeddingPost?.embedding ?? "[]"), 
            allCatEmbeddings,
            allCatNames,
        );

        // console.log(foundSimlarities);
        const topCategory = foundSimlarities[0];

        if (topCategory.content == categories[0].name) {
            console.log(post);
            console.log("ERROR: ", topCategory);
            continue;
        } else {
            console.log(topCategory.content);
        }

        if (topCategory.similarity == NaN) {
            console.log(post);
            console.log("ERROR: ", topCategory);
            continue;
        }
        */

        var topCategory = {}; // name, similarity

        for (const score in finalScores) {
            console.log( finalScores[score])
            if (!topCategory.similarity) {
                topCategory = finalScores[score];
                
            } else if (finalScores[score].similarity > topCategory.similarity) {
                topCategory = finalScores[score];
            }
        }
        
        // // find the index of the category, temp fix
        // for (const cat of categories) {
        //     console.log(cat.name, topCategory.content);
        //     if (cat.name == topCategory.content) {
        //         topCategory.index = categories.indexOf(cat);
        //     }
        // }

        if (topCategory.similarity < 0.5) continue;
        // postCategory.category = categories[topCategory.index].name;
        const pushToArr = {
            _id: post._id,
            category: topCategory.content,
            content: post.content,
            simliarityScore: topCategory.similarity,
        }
        categorizedPosts.push(pushToArr);
        console.log(finalScores);
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