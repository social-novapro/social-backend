const interactCategoryUser = require("../../../schemas/categories/interactCategoryUser");
const interactPostSchema = require("../../../schemas/interactPostSchema");
const { checktime } = require("../../checktime");
const { getPostEmbedding } = require("../../search/embed");
const { cosineSimilarity } = require("../../search/searchV2");
const { getCategoriesFromDB } = require("./startup");
const { v4: uuidv4 } = require("uuid");
const { searchError, searchErrorV2 } = require("../../searchError");
const interactCategory = require("../../../schemas/categories/interactCategory");
const allCatEmbeddings = [];
const allCatNames = [];
var categories = null;
var sortedCategories = [];
const DEFAULT_CAT_VALUE = 5;

async function fillCategories() {
    if (!categories) {
        categories = await getCategoriesFromDB();
    }

    for (const cat of categories) {
        allCatEmbeddings.push(JSON.parse(cat.embedding ?? "[]"));
        allCatNames.push(cat.name);
    }
}

async function categorizePost({ postID }) {
    if ((!allCatEmbeddings || !allCatNames) || (!allCatEmbeddings[0] || !allCatNames[0])) await fillCategories();
    const post = await interactPostSchema.findOne({_id: postID});
    if (!post) return searchError("B002");

    // Get the embedding for the post, already stored
    const foundEmbedding = await getPostEmbedding({ postID: post._id });
    if (!foundEmbedding || !foundEmbedding.embeddingPost || !foundEmbedding.embeddingPost.embedding) return { error : true, msg: "No embedding found for post" };

    const foundSimlarities = [];
    var amount = 1;
    var finalScores = {};

    
    // const mainSimlarity = cosineSimilarity(
    //     JSON.parse(foundEmbedding.embeddingPost.embedding ?? "[]"),
    //     allCatEmbeddings,
    //     allCatNames,
    // );

    // foundSimlarities.push(mainSimlarity);
    // finalScores[mainSimlarity[0].content] = mainSimlarity[0];

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

    categoriesFound.reverse();
    topCategory = categoriesFound[0];

    subCategories = categoriesFound.slice(1, 6);
    
    if (!topCategory || !topCategory.similarity) return {error: true, msg: "No top category found"};
    if (topCategory.similarity < 0.5) return {error: true, msg: "No top category found"};
    
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
    if (!value) return { error: true, msg: "No value found to update to" };

    const foundCategory = await interactCategoryUser.findOne({ userID: userID, categoryID: categoryID });
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

    return updatedUserCategory;
}

async function createUserCategory({ userID, categoryID, value }) {
    if (!userID) return { error: true, msg: "No user ID found" };
    if (!categoryID) return { error: true, msg: "No category ID found" };
    
    const foundUserCategory = await interactCategoryUser.findOne({ userID: userID, categoryID: categoryID });
    if (foundUserCategory) return { error: true, msg: "Category already exists" };

    const foundCategory = await interactCategory.findOne({ id: categoryID });
    if (!foundCategory) return { error: true, msg: "No category found" };
    
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