const interactCategoryUser = require("../../../schemas/categories/interactCategoryUser");
const interactPostSchema = require("../../../schemas/interactPostSchema");
const { checktime } = require("../../checktime");
const { getPostEmbedding } = require("../../search/embed");
const { cosineSimilarity } = require("../../search/searchV2");
const { getCategoriesFromDB, getCategoriesEmbeddingsFromDB, getCategoryRuntimeInfo } = require("./startup");
const { v4: uuidv4 } = require("uuid");
const { searchError, searchErrorV2 } = require("../../searchError");
const interactCategory = require("../../../schemas/categories/interactCategory");
var categories = null;
var sortedCategories = [];
const DEFAULT_CAT_VALUE = 5;

var categoryRuntimeInfo = null;

// check out feeds/personalized, why is there a repeat of simlar code
async function categorizePost({ postID }) {
    if (!categoryRuntimeInfo) {
        const tempCategoryRuntimeInfo = await getCategoryRuntimeInfo();
        if (!tempCategoryRuntimeInfo || tempCategoryRuntimeInfo.error) return tempCategoryRuntimeInfo || { error: true, msg: "No categories found" };
        categoryRuntimeInfo = tempCategoryRuntimeInfo;
    }

    // get post 
    const post = await interactPostSchema.findOne({_id: postID});
    if (!post) return searchError("B002");

    // Get the embedding for the post, already stored
    const foundEmbedding = await getPostEmbedding({ postID });
    if (!foundEmbedding) return { error: true, msg: "No embedding found for post" };
    if (!foundEmbedding || !foundEmbedding.embeddingPost || !foundEmbedding.embeddingPost.embedding) return { error: true, msg: "Missing Embedding data for post" };
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

    //const topCategories = categoriesFound.slice(0, 9); // top 10 categories found
    // filter out categories that are the same
    const filteredCategories = filterOutDuplicates(categoriesFound, 0.80, 10)

    // compare each sentence in post with each category example sentences
    const exampleSentencesEmbeddings = [];
    const exampleSentencesIDs = [];
    const exampleSentencesCategories = [];
    for (const example of filteredCategories) {
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

    // filter out
    const categoriesFoundFinal = filterOutDuplicates(categoriesFoundSentences, 0.5, 6);
    if (!categoriesFoundFinal || !categoriesFoundFinal[0]) return { error: true, msg: "No categories found" };

    const topCategory = categoriesFoundFinal[0];
    const subCategories = categoriesFoundFinal.slice(1, 6);
    console.log(`Sentence Comparision`, categoriesFoundFinal, "Example Comparision", filteredCategories);
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
function filterOutDuplicates(categoriesFound, simlarityScore = 0.5, amountCategories = 10) {
    const uniqueCategories = [];
    for (const category of categoriesFound) {
        if (!category || !category.content || !category.similarity) continue;
        if (category.similarity < simlarityScore) continue; // skip categories with low similarity
        if (uniqueCategories.length >= amountCategories) break; // limit to 5 unique categories

        if (uniqueCategories.find((c) => c.content === category.content)) continue; // already exists
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

function formatCategory(category) {
    if (!category) return { error: true, msg: "No category found" };
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

function sortCategories() {
    if (!categories || !categories[0]) return { error: true, msg: "No categories found" };
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

async function getCategories({userID}) {
    if (!categories || !categories[0]) {
        categories = await getCategoriesFromDB();
    }

    if (!sortedCategories || !sortedCategories[0]) sortCategories();
    return sortedCategories;
}

async function getUserCategories({ userID }) {
    const sortedCategoriesFound = await getCategories({ userID });
    const foundUserCategories = await interactCategoryUser.find({ userID: userID });
    if (!foundUserCategories) return { error: true, msg: "No user categories found" };

    for (const category of sortedCategoriesFound) {
        if (!category) continue;

        const foundCategory = foundUserCategories.find((cat) => cat.categoryID === category.id);
        if (foundCategory) {
            category.value = foundCategory.userScore;
        }
    }
    return sortedCategoriesFound;
}

async function updateUserCategory({ userID, categoryID, value }) {
    if (!userID) return { error: true, msg: "No user ID found" };
    if (!categoryID) return { error: true, msg: "No category ID found" };
    if (!value && value!=0) return { error: true, msg: "No value found to update to" };

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
    if (!updatedUserCategory) return { error: true, msg: "No category found" };
    if (!updatedUserCategory.userScore && updatedUserCategory.userScore != 0) return { error: true, msg: "No user score found" };
    if (updatedUserCategory.userScore != value) return { error: true, msg: "User score not updated" };
    return updatedUserCategory;
}

async function createUserCategory({ userID, categoryID, value }) {
    if (!userID) return { error: true, msg: "No user ID found" };
    if (!categoryID) return { error: true, msg: "No category ID found" };
    
    const foundCategory = await interactCategory.findOne({ id: categoryID });
    if (!foundCategory) return { error: true, msg: "No category found" };

    const foundUserCategory = await interactCategoryUser.findOne({ userID: userID, categoryID: categoryID });
    if (foundUserCategory) return { error: true, msg: "Category already exists" };
    
    const newCategory = await interactCategoryUser.create({
        _id: uuidv4(),
        userID: userID,
        categoryID,
        userScore: value ?? DEFAULT_CAT_VALUE,
        timestamp: checktime(),
    });

    return newCategory;
}

async function resetUserCategories({ userID }) {
    if (!userID) return { error: true, msg: "No user ID found" };

    const foundUserCategories = await interactCategoryUser.find({ userID: userID });
    if (!foundUserCategories) return { error: true, msg: "No user categories found" };

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

async function restoreUserCategories({ userID, body }) {
    if (!userID) return { error: true, msg: "No user ID found" };

    for (const category of body) {
        if (!category) continue;
        if (!category.id) return { error: true, msg: "No category ID found" };
        if (!category.value) return { error: true, msg: "No value found" };

        await updateUserCategory({ userID, categoryID: category.categoryID, value: category.value });
    }

    const updatedUserCategories = await getUserCategories({ userID });
    if (!updatedUserCategories) return { error: true, msg: "No user categories found" };
    return updatedUserCategories;
}

module.exports = { 
    categorizePost,
    saveCategoryData,
    removeCategoryData,
    getCategories,
    getUserCategories,
    updateUserCategory,
    resetUserCategories,
    restoreUserCategories
}