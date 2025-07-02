const interactCategoryUser = require("../../../schemas/categories/interactCategoryUser");
const interactPostSchema = require("../../../schemas/interactPostSchema");
const { checktime } = require("../../checktime");
const { getPostEmbedding, embedSearch } = require("../../search/embed");
const { cosineSimilarity } = require("../../search/searchV2");
const { getCategoriesFromDB, getCategoriesEmbeddingsFromDB, getCategoryRuntimeInfo } = require("./startup");
const { v4: uuidv4 } = require("uuid");
const { searchError, searchErrorV2 } = require("../../searchError");
const interactCategory = require("../../../schemas/categories/interactCategory");
const { createPoll } = require("../../polls");
var categories = null;
var sortedCategories = [];
const DEFAULT_CAT_VALUE = 5;

var categoryRuntimeInfo = null;

// check out feeds/personalized, why is there a repeat of simlar code
async function categorizePost({ postID, userID }) {
    if (!postID) return searchErrorV2("B009", { userID: "Unknown" });
    if (!userID) return searchErrorV2("D006", { userID: "Unknown" });
    if (!categoryRuntimeInfo) {
        const tempCategoryRuntimeInfo = await getCategoryRuntimeInfo();
        if (!tempCategoryRuntimeInfo || tempCategoryRuntimeInfo.error) return tempCategoryRuntimeInfo || searchErrorV2("Q018", { userID: userID });
        categoryRuntimeInfo = tempCategoryRuntimeInfo;
    }

    // get post 
    const postData = await interactPostSchema.findOne({_id: postID});
    if (!postData) return searchError("Q003", { userID: userID });

    // Get the embedding for the post, already stored
    const foundEmbedding = await getPostEmbedding({ postID });
    if (!foundEmbedding) return searchErrorV2("Q019", {userID: userID });
    if (!foundEmbedding || !foundEmbedding.embeddingPost || !foundEmbedding.embeddingPost.embedding) return searchErrorV2("Q019", {userID: userID });
    
    // compare entire post embedding to each category example
    // full examples vs full post embedding
    const categoriesFound = cosineSimilarity(
        JSON.parse(foundEmbedding.embeddingPost.embedding ?? "[]"),
        categoryRuntimeInfo.catEmbeddings,
        categoryRuntimeInfo.catNames,
        categoryRuntimeInfo.exampleIDs
    );
    categoriesFound.sort((a, b) => a.similarity - b.similarity);
    categoriesFound.reverse();

    // filter out categories 
    const filteredCategories = filterOutDuplicates(categoriesFound, 0.80, 10);
    console.log(`Filtered Categories`, filteredCategories);

    // sentences
    const exampleSentences = {
        embeddings: [],
        ids: [],
        categories: []
    }
    for (const findExample of filteredCategories) { 
        if (!findExample || !findExample.content || !findExample.similarity || !findExample.id) continue;

        // can get ID from category.id
        // exampleSentences = [...exampleSentences, ...categoryRuntimeInfo.catExampleSentences[example.id]];
        if (!categoryRuntimeInfo.catExampleSentences[findExample.id]) {console.log('no examples for ', findExample.id); continue;}; // no example sentences for this category
        for (const sentence of categoryRuntimeInfo.catExampleSentences[findExample.id] ?? []) {
            exampleSentences.embeddings.push(JSON.parse(sentence.embedding));
            exampleSentences.ids.push(sentence._id);
            exampleSentences.categories.push(findExample.content);
        }
    }

    // get example sentences for category
    console.log(foundEmbedding.sentences.length)
    const finalScores = {}; 
    for (const sentence of foundEmbedding.sentences ?? []) {
        if (!sentence || !sentence.embedding) continue;
        const sentenceEmbedding = JSON.parse(sentence.embedding);
        const similarities = cosineSimilarity(
            sentenceEmbedding,
            exampleSentences.embeddings,
            exampleSentences.categories,
            exampleSentences.ids
        );

        console.log(`Similarities`, similarities);
        // similarities.sort((a, b) => a.similarity - b.similarity);
        // similarities.reverse();

        for (const similarity of similarities) {
            if (!similarity || !similarity.similarity || !similarity.content) continue;
            if (!finalScores[similarity.content]) finalScores[similarity.content] = { similarity: 0, count: 0, index: [] };
            
            finalScores[similarity.content].count += 1;
            finalScores[similarity.content].similarity += (similarity.similarity);
            finalScores[similarity.content].index.push(similarity.index);
        }
    }

    console.log(`Final Scores`, finalScores);
    const categoriesFoundSentences = [];
    for (const category in finalScores) {
        if (!finalScores[category] || !finalScores[category].similarity || !finalScores[category].count) continue;
        const avgSimilarity = finalScores[category].similarity / finalScores[category].count;
        categoriesFoundSentences.push({
            content: category,
            similarity: avgSimilarity,
            index: finalScores[category].index,
        });
    }

    categoriesFoundSentences.sort((a, b) => a.similarity - b.similarity);
    categoriesFoundSentences.reverse();

    const categoriesFoundFiltered = filterOutDuplicates(categoriesFoundSentences, 0.5, 6);
    if (!categoriesFoundFiltered || !categoriesFoundFiltered[0]) return searchErrorV2("Q017", {userID: userID });

    const topCategory = categoriesFoundFiltered[0];
    const subCategories = categoriesFoundFiltered.slice(1, 6);

    const pushToArr = {
        _id: postData._id,
        category: topCategory.content,
        subCats: subCategories.map((sub) => sub.content),
        content: postData.content,
        simliarityScore: topCategory.similarity,
        categorySaved: null
    }
    pushToArr.categorySaved = await saveCategoryData({
        postID: postData._id,
        category: pushToArr.category,
        subCats: pushToArr.subCats
    });
    console.log("final pushToArr", pushToArr);
    console.log("categoriesFoundFiltered", categoriesFoundFiltered)
    return pushToArr;
    // const categoriesFoundSentences = [];
    // for (const category in finalScores) {
    //     if (!finalScores[category] || !finalScores[category].similarity || !finalScores[category].count) continue;
    //     const avgSimilarity = finalScores[category].similarity / finalScores[category].count;

    //     categoriesFoundSentences.push({
    //         content: category,
    //         similarity: avgSimilarity,
    //         index: finalScores[category].index,
    //     });
    // }
    
}

async function categorizePostNOTWORKING({ postID, userID }) {
    if (!postID) return searchErrorV2("B009", { userID: "Unknown" });
    if (!userID) return searchErrorV2("D006", { userID: "Unknown" });
    if (!categoryRuntimeInfo) {
        const tempCategoryRuntimeInfo = await getCategoryRuntimeInfo();
        if (!tempCategoryRuntimeInfo || tempCategoryRuntimeInfo.error) return tempCategoryRuntimeInfo || searchErrorV2("Q018", { userID: userID });
        categoryRuntimeInfo = tempCategoryRuntimeInfo;
    }

    // get post 
    const post = await interactPostSchema.findOne({_id: postID});
    if (!post) return searchError("Q003", { userID: userID });

    // Get the embedding for the post, already stored
    const foundEmbedding = await getPostEmbedding({ postID });
    if (!foundEmbedding) return searchErrorV2("Q019", {userID: userID });
    if (!foundEmbedding || !foundEmbedding.embeddingPost || !foundEmbedding.embeddingPost.embedding) return searchErrorV2("Q019", {userID: userID });
    // compare entire post embeding to each category example (5), then average the similarity


    // compare  embeddings (which are 5 examples each categories)
    // compare each sentence to each example of category
    // compare the entire post


    // compares entire post embedding to each category example
    // full examples vs full post embedding
    const categoriesFound = cosineSimilarity(
        JSON.parse(foundEmbedding.embeddingPost.embedding ?? "[]"),
        categoryRuntimeInfo.catEmbeddings,
        categoryRuntimeInfo.catNames,
        categoryRuntimeInfo.exampleIDs
    );
    categoriesFound.sort((a, b) => a.similarity - b.similarity);
    categoriesFound.reverse();

    console.log(`Categories Found`, categoriesFound);
    //const topCategories = categoriesFound.slice(0, 9); // top 10 categories found
    // filter out categories that are the same
    const filteredCategories = filterOutDuplicates(categoriesFound, 0.80, 10)
    console.log(`Filtered Categories`, filteredCategories);
    // compare each sentence in post with each category example sentences
    const exampleSentencesEmbeddings = [];
    const exampleSentencesIDs = [];
    const exampleSentencesCategories = [];
    for (const example of filteredCategories) {
        console.log(`Example`, example);
        if (!example || !example.content || !example.similarity || !example.id) continue;

        // can get ID from category.id
        // exampleSentences = [...exampleSentences, ...categoryRuntimeInfo.catExampleSentences[example.id]];
        if (!categoryRuntimeInfo.catExampleSentences[example.id]) {console.log('no examples for ', example.id); continue;}; // no example sentences for this category
        for (const sentence of categoryRuntimeInfo.catExampleSentences[example.id] ?? []) {
            exampleSentencesEmbeddings.push(JSON.parse(sentence.embedding));
            exampleSentencesIDs.push(sentence._id);
            exampleSentencesCategories.push(example.content);
        }
    }
    console.log("catEmbeddings length:", categoryRuntimeInfo.catEmbeddings[0].length);
    console.log("Example embedding shape:", exampleSentencesEmbeddings[0]?.length);
    console.log("Post embedding shape:", JSON.parse(foundEmbedding.embeddingPost.embedding)?.length);

    console.log("Norm of post embedding:", Math.sqrt(JSON.parse(foundEmbedding.embeddingPost.embedding)?.reduce((sum, x) => sum + x*x, 0)));
console.log("Norm of category embedding:", Math.sqrt(categoryRuntimeInfo.catEmbeddings[0].reduce((sum, x) => sum + x*x, 0)));
console.log("quick cosine similarity check:", cosineSimilarity(
        JSON.parse(foundEmbedding.embeddingPost.embedding),
        [categoryRuntimeInfo.catEmbeddings[0]],
        [categoryRuntimeInfo.catNames[0]],
        [categoryRuntimeInfo.exampleIDs[0]]
    ));
    console.log("example content", categoryRuntimeInfo.catExampleContent[0]);
    console.log("post content", post.content);
    console.log("is-same embed", JSON.stringify(JSON.parse(foundEmbedding.embeddingPost.embedding)) === JSON.stringify(categoryRuntimeInfo.catEmbeddings[0]));
    if ((JSON.stringify(JSON.parse(foundEmbedding.embeddingPost.embedding)) === JSON.stringify(categoryRuntimeInfo.catEmbeddings[0]))) {
        console.log("Post embedding is the same as the first category embedding");
    } else {
        console.log("Post embedding is NOT the same as the first category embedding");
        console.log(JSON.parse(foundEmbedding.embeddingPost.embedding));
        console.log(categoryRuntimeInfo.catEmbeddings[0]);

        const example_embedding = await embedSearch({ content:  categoryRuntimeInfo.catExampleContent[0] });
        // console.log("Example embedding", example_embedding.embedding.embedding);
        console.log("Is same example embedding", JSON.stringify(example_embedding.embedding.embedding) === JSON.stringify(categoryRuntimeInfo.catEmbeddings[0]));

        const post_embedding = await embedSearch({ content: post.content });
        // console.log("Post embedding", post_embedding.embedding.embedding);
        console.log("Is same post embedding", JSON.stringify(post_embedding.embedding.embedding) === JSON.stringify(JSON.parse(foundEmbedding.embeddingPost.embedding)));


    }

    const emb1 = await embedSearch({ content: "text" });
const emb2 = await embedSearch({ content: "text" });
const same = JSON.stringify(emb1.embedding.embedding) === JSON.stringify(emb2.embedding.embedding);
console.log("Same embed twice:", same);
        console.log(`Example Sentences`, "Example Categories", exampleSentencesCategories, "Example IDs", exampleSentencesIDs);
    // get the example sentences for the category
    // compare each sentence in post with each category example sentences
    const finalScores = {}; // { category: { similarity: 0, count: 0 } }
    for (const sentence of foundEmbedding.sentences ?? []) {
        if (!sentence || !sentence.embedding) continue;
        const sentenceEmbedding = JSON.parse(sentence.embedding);
        const similarities = cosineSimilarity(
            sentenceEmbedding,
            exampleSentencesEmbeddings,
            exampleSentencesCategories,
            exampleSentencesIDs
        );

        for (const similarity of similarities) {
            if (!similarity || !similarity.similarity || !similarity.content) continue;
            if (!finalScores[similarity.content]) finalScores[similarity.content] = { similarity: 0, count: 0, index: [] };
            finalScores[similarity.content].count += 1;
            finalScores[similarity.content].similarity += (similarity.similarity);
            console.log(similarity.content, similarity.similarity, "Index", similarity.index);
            // if (similarity.content == "testing") console.log(`Similarity for ${similarity.content}`, similarity.similarity, "Index", similarity.index);
            finalScores[similarity.content].index.push(similarity.index);
        }
    }

    const categoriesFoundSentences = [];
    for (const category in finalScores) {
        if (!finalScores[category] || !finalScores[category].similarity || !finalScores[category].count) continue;
        const avgSimilarity = finalScores[category].similarity / finalScores[category].count;

        categoriesFoundSentences.push({
            content: category,
            similarity: avgSimilarity,
            index: finalScores[category].index,
        });
    }

    console.log(`Found Categories`, categoriesFoundSentences, "Example Categories", filteredCategories);
    console.log(finalScores) // this is showing combinnned score for each categor: { art: { similarity: 3.9860977494200514, count: 4, index: [ 0, 1, 1, 0 ] } }
    // filter out
    const categoriesFoundFinal = filterOutDuplicates(categoriesFoundSentences, 0.5, 6);
    if (!categoriesFoundFinal || !categoriesFoundFinal[0]) return searchErrorV2("Q017", {userID: userID })

    const topCategory = categoriesFoundFinal[0];
    const subCategories = categoriesFoundFinal.slice(1, 6);
    // console.log(`Sentence Comparision`, categoriesFoundFinal, "Example Comparision", filteredCategories);
    
    const pushToArr = {
        _id: post._id,
        category: topCategory.content,
        subCats: subCategories.map((sub) => sub.content),
        content: post.content,
        simliarityScore: topCategory.similarity,
        categorySaved: null
    }

    pushToArr.categorySaved = await saveCategoryData({ 
        postID: post._id,
        category: pushToArr.category,
        subCats: pushToArr.subCats
    });

    return pushToArr;
}

// filter out categories that are duplicates or have low similarity
// this function should be used after sorting the categoriesFound array
function filterOutDuplicates(categoriesFound, simlarityScore = 0.5, amountCategories = 10) {
    const uniqueCategories = [];
    for (const category of categoriesFound) {
        if (!category || !category.content || !category.similarity) continue;
        if (category.similarity < simlarityScore) continue; // skip categories with low similarity
        if (uniqueCategories.length >= amountCategories) break; // limit to number of unique categories
        // since i am sorting before this function, the highest similarity will be first
        if (uniqueCategories.find((c) =>  {
            if (c.content === category.content) {
                category.count = category.count ? category.count + 1 : 2; // if already exists, increment count
                category.similarity = Math.max(category.similarity, c.similarity); // if already exists, take the highest similarity
            }
            return c.content === category.content; // check if category already exists
        })) continue; // already exists
        uniqueCategories.push(category);
    }
    return uniqueCategories;
}

// Save category data to the post db
async function saveCategoryData({ postID, category, subCats }) {
    const updatedPost = await interactPostSchema.findOneAndUpdate({
        _id: postID,
    }, {
        category,
        subCats,
        categoryAssignmentTimestamp: checktime(),
        hasCategory: true,
    });

    return updatedPost;
}

// Categorize a post that has been edited
async function categorizeEditedPost({ postID, userID }) {
    await removeCategoryData({ postID });
    const categorizedPost = await categorizePost({ postID, userID });
    return categorizedPost;
}

// remove category data from post db
async function removeCategoryData({ postID }) {
    const updatedPost = await interactPostSchema.findOneAndUpdate({
        _id: postID,
    }, {
        category: null,
        subCats: [],
        categoryAssignmentTimestamp: null,
        hasCategory: false,
    });

    return updatedPost;
}

// Format a category object to be returned
function formatCategory(category) {
    if (!category) return searchErrorV2("Q006", { userID: "system"})
    return {
        id: category.id,
        name: category.name,
        version: category.version,
        embeddingVersion: category.embeddingVersion,
        isSubCategory: category.isSubCategory,
        parentCategoryID: category.parentCategoryID ?? null,
        value: DEFAULT_CAT_VALUE,
        subCategories: []
    }
}

// Sort categories into main categories and subcategories
function sortCategories() {
    if (!categories || !categories[0]) return searchErrorV2("Q007", { userID: "system" });
    // need, id, name, version, isSubCategory, parentCategoryName
    const foundCategories = [];
    const foundSubcategories = [];

    for (const cat of categories) {
        if (!cat) continue;
        if (!cat.isSubCategory) foundCategories.push(formatCategory(cat));
        else foundSubcategories.push(formatCategory(cat));
    }

    for (const subcat of foundSubcategories) {
        for (const cat of foundCategories) {
            if (subcat.parentCategoryID === cat.id) {
                cat.subCategories.push(subcat);
            }
        }
    }
    sortedCategories = foundCategories
    return foundCategories;
}

// Get categories from the database, if not already loaded
async function getCategories({userID}) {
    if (!categories || !categories[0]) {
        categories = await getCategoriesFromDB();
    }

    if (!sortedCategories || !sortedCategories[0]) sortCategories();
    return sortedCategories;
}

// Get user categories from database
async function getUserCategories({ userID }) {
    const sortedCategoriesFound = await getCategories({ userID });
    const foundUserCategories = await interactCategoryUser.find({ userID: userID });
    if (!foundUserCategories) return searchErrorV2("Q008", { userID: userID });

    for (const category of sortedCategoriesFound) {
        if (!category) continue;

        const foundCategory = foundUserCategories.find((cat) => cat.categoryID === category.id);
        if (foundCategory) {
            category.value = foundCategory.userScore;
        }
    }

    if (!sortedCategoriesFound || !sortedCategoriesFound[0]) return searchErrorV2("Q008", { userID: userID });
    return sortedCategoriesFound;
}

// Update user category, if not exists create it
async function updateUserCategory({ userID, categoryID, value }) {
    if (!userID) return searchErrorV2("Q009", { userID: "Unknwon" });
    if (!categoryID) return searchErrorV2("Q010", { userID: userID });
    if (!value && value!=0) return searchErrorV2("Q011", { userID: userID });

    const foundCategory = await interactCategoryUser.findOne({ userID, categoryID: categoryID });
    if (!foundCategory) {
        await createUserCategory({ userID, categoryID, value });
    } else {
        await interactCategoryUser.findOneAndUpdate({
            userID: userID,
            categoryID: categoryID,
        }, {
            userScore: value,
            timestamp: checktime(),
        }, {
            new: true,
        });
    }


    const updatedUserCategory = await interactCategoryUser.findOne({ userID: userID, categoryID: categoryID });
    if (!updatedUserCategory) return searchErrorV2("Q012", { userID: userID });
    if (!updatedUserCategory.userScore && updatedUserCategory.userScore != 0) return searchErrorV2("Q014", { userID: userID, options: [{name: categoryID, data: categoryID }]}); // return { error: true, msg: "No user score found" };
    if (updatedUserCategory.userScore != value) return searchErrorV2("Q014", { userID: userID, options: [{name: categoryID, data: categoryID }]});// { error: true, msg: "User score not updated" };
    return updatedUserCategory;
}

// Create a user category, if not exists
async function createUserCategory({ userID, categoryID, value }) {
    if (!userID) return searchErrorV2("Q009", { userID: "Unknwon" });
    if (!categoryID) return searchErrorV2("Q010", { userID: userID });
    if (!value && value!=0) return searchErrorV2("Q011", { userID: userID });

    const foundCategory = await interactCategory.findOne({ id: categoryID });
    if (!foundCategory) return searchErrorV2("Q012", { userID: userID });

    const foundUserCategory = await interactCategoryUser.findOne({ userID: userID, categoryID: categoryID });
    if (foundUserCategory) return searchErrorV2("Q013", { userID: userID, options:  [{
        name: "categoryID",
        data: categoryID,
    }] });
    
    const newCategory = await interactCategoryUser.create({
        _id: uuidv4(),
        userID: userID,
        categoryID,
        userScore: value ?? DEFAULT_CAT_VALUE,
        timestamp: checktime(),
    });

    return newCategory;
}

// unused, but will reimplement later
async function resetUserCategories({ userID }) {
    if (!userID) return searchErrorV2("Q009", { userID: "Unknwon" });

    const foundUserCategories = await interactCategoryUser.find({ userID: userID });
    if (!foundUserCategories) return searchErrorV2("Q008", { userID: userID });

    for (const category of foundUserCategories) {
        await interactCategoryUser.findOneAndDelete({
            userID: userID,
            categoryID: category.categoryID,
        })
    }

    const newCategories = await updateUserCategory({ userID, categoryID: category.categoryID, value: DEFAULT_CAT_VALUE });
    return {
        newCategories,
        oldCategories: foundUserCategories,
    };
}

// unused, but will reimplement later
async function restoreUserCategories({ userID, body }) {
    if (!userID) return searchErrorV2("Q009", { userID: "Unknwon" });

    for (const category of body) {
        if (!category) continue;
        if (!category.id) return searchErrorV2("Q015", { userID: userID });
        if (!category.value) return searchErrorV2("Q016", { userID: userID });

        await updateUserCategory({ userID, categoryID: category.categoryID, value: category.value });
    }

    const updatedUserCategories = await getUserCategories({ userID });
    return updatedUserCategories; // if error will return error
}

module.exports = { 
    categorizePost,
    saveCategoryData,
    removeCategoryData,
    getCategories,
    getUserCategories,
    updateUserCategory,
    resetUserCategories,
    restoreUserCategories,
    categorizeEditedPost
}