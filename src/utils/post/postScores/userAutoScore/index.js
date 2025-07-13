// rank user categories
// using "autoScore"  in interactCategoryUserSchema


// to improve:  should generalize score for each category into subcategories
// https://chatgpt.com/c/686eed85-b964-8001-a709-a45cd41c0006
// can also use weights.json to adjust weights for each category, rather than hardcoding interaction count

const interactCategory = require("../../../../schemas/categories/interactCategory");
const interactCategoryUser = require("../../../../schemas/categories/interactCategoryUser");
const interactPostSchema = require("../../../../schemas/interactPostSchema");
const { checktime } = require("../../../checktime");
const { searchErrorV2 } = require("../../../searchError");
const { updateUserCategory } = require("../../categories");

const CATEGORY_INTERACTION_WEIGHT = 1; // default weight for category interactions, can be adjusted later
const SUBCATEGORY_INTERACTION_WEIGHT = 0.7; // default weight for subcategory interactions, can be adjusted later
// get user likes


// function for weighted categories


// adjust weight based on new interaction


// action
// 1= 'like'
// 2= 'dislike'
// 3= 'follow'
// 4= 'unfollow'
// 5= 'reply/quote'
// 6= 'deleted reply/quote'
// 7= 'created post'
// 8= 'deleted post'
async function adjustWeight({
    userID, userData,  // dont use userdata, use userID if needed
    action,
    postID, postData, // 1, 2, 5, 6
    userFollowedID, userFollowedData, // 3, 4
}) {
    if (!userID && !userData) return searchErrorV2("Q020", { userID: "unknown" });
    if (!postID && !postData) return searchErrorV2("Q021", { userID });
    if (!action) return searchErrorV2("Q022", {userID });
    // check if postData category
    
    // dont need userData, but need postData
    if(!postData) postData = await interactPostSchema.findOne({ _id: postID });

    if (!postData.category) return searchErrorV2("Q023", { userID });

    const foundCategory = await interactCategory.findOne({name: postData.category});
    if (!foundCategory) return searchErrorV2("Q024", { userID });
    
    const foundSubCategories = [];
    if (postData.subCats) {
        for (const subCat of postData.subCats) {
            const foundSubCategory = await interactCategory.findOne({ name: subCat });
            if (foundSubCategory) {
                foundSubCategories.push(foundSubCategory);
            }
        }
    }

    const foundInteractCategoryUser = await interactCategoryUser.findOne({ userID, categoryID: foundCategory.id });
    if (!foundInteractCategoryUser) {
        // create new
        await updateUserCategory({
            userID: userID,
            categoryID: foundCategory.id,
        });
    }
    // TODO: ADJUST WEIGHT FOR EACH ACTION

    // Liked post
    if (action === "POST.LIKE") {
        await userAdjustCategoryInteractions({ userID, postID, postData, foundCategory, toAdjust: "amountLikes" });
    } else if (action === "POST.UNLIKE") {
        await userRemoveCategoryInteractions({ userID, postID, postData, foundCategory, toAdjust: "amountLikes" });
    }

    // Replied to post
    if (action === "POST.REPLY_CREATED") {
        // adjust user category score
        await userAdjustCategoryInteractions({ userID, postID, postData, foundCategory, toAdjust: "amountReplies" });
    } else if (action === "POST.REPLY_DELETED") {
        // adjust user category score
        await userRemoveCategoryInteractions({ userID, postID, postData, foundCategory, toAdjust: "amountReplies" });
    }

    // Quoted post
    if (action === "POST.QUOTE_CREATED") {
        // adjust user category score
        await userAdjustCategoryInteractions({ userID, postID, postData, foundCategory, toAdjust: "amountQuotes" });
    } else if (action === "POST.QUOTE_DELETED") {
        // adjust user category score
        await userRemoveCategoryInteractions({ userID, postID, postData, foundCategory, toAdjust: "amountQuotes" });
    }

    // Created post
    if (action === "POST.CREATED") {
        // adjust user category score
        await userAdjustCategoryInteractions({ userID, postID, postData, foundCategory, toAdjust: "amountPosts" });
    } else if (action === "POST.DELETED") {
        // adjust user category score
        await userRemoveCategoryInteractions({ userID, postID, postData, foundCategory, toAdjust: "amountPosts" });
    }

    // const userScores = await getUserCategoryScores({ userID });
    // console.log("User scores found:", userID, userScores);
    return true; // return user scores, so they can be used to update user category
}

async function userAdjustCategoryInteractions({ userID, postID, postData, foundCategory, foundSubCategories=[], toAdjust, weight }) {
    if (!foundCategory) return searchErrorV2("Q028", { userID });
    if (!toAdjust) return searchErrorV2("Q029", { userID });

    // const currentCategoryInfo
    // adjust user category score
    await interactCategoryUser.findOneAndUpdate({
        userID,
        categoryID: foundCategory.id
    }, {
        $inc: {
            autoScore: +(CATEGORY_INTERACTION_WEIGHT*weight || CATEGORY_INTERACTION_WEIGHT),
            [toAdjust]: +(CATEGORY_INTERACTION_WEIGHT*weight || CATEGORY_INTERACTION_WEIGHT), // increment amount of blank
        },
        $set: {
            timestamp: checktime()
        }
    });

    for (const category of foundSubCategories) {
        await userAdjustCategoryInteractions({
            userID,
            postID,
            postData,
            foundCategory: category,
            toAdjust,
            weight: SUBCATEGORY_INTERACTION_WEIGHT // subcategories should have less weight
        })
    }
}

async function userRemoveCategoryInteractions({ userID, postID, postData, foundCategory, foundSubCategories=[], toAdjust, weight }) {
    if (!foundCategory) return searchErrorV2("Q028", { userID });
    if (!toAdjust) return searchErrorV2("Q029", { userID });
    // adjust user category score
    await interactCategoryUser.findOneAndUpdate({
        userID,
        categoryID: foundCategory.id
    }, {
        $inc: {
            autoScore: -(CATEGORY_INTERACTION_WEIGHT*weight || CATEGORY_INTERACTION_WEIGHT),
            [toAdjust]: -(CATEGORY_INTERACTION_WEIGHT*weight || CATEGORY_INTERACTION_WEIGHT), // increment amount of blank
        },
        $set: {
            timestamp: checktime()
        }
    });

    for (const category of foundSubCategories) {
        await userRemoveCategoryInteractions({
            userID,
            postID,
            postData,
            foundCategory: category,
            toAdjust,
            weight: SUBCATEGORY_INTERACTION_WEIGHT // subcategories should have less weight
        })
    }
}

// get category score
async function getUserCategoryScores({ userID }) {
    if (!userID) return searchErrorV2("Q025", { userID: "unknown" });

    var categories = await interactCategoryUser.find({ userID }); 
    // any other categories will not be considered, since no interaction with user
    // and user didnt interact with them

    const rawScores = [];
    let totalAutoInteractions = 0;

    // First calculate total autoScore to convert them to percentages
    for (const category of categories) {
        if (category.autoScore != null) {
            totalAutoInteractions += category.autoScore;
        }
    }

    // Compute raw blended scores
    for (const category of categories) {
        const userScore = (category.userScore ?? 0) * 10; // scale 0-10 to 0-100
        let autoScore = 0;

        if (category.autoScore != null && totalAutoInteractions > 0) {
            autoScore = (category.autoScore / totalAutoInteractions) * 100;
        }

        const rawScore = calculateCategoryScore({
            userScore,
            autoScore,
            userWeight: 0.6,
        });

        rawScores.push({
            categoryID: category.categoryID,
            rawScore,
            userScore,
            autoScore,
        });
    }

    const totalRawScore = rawScores.reduce((sum, c) => sum + c.rawScore, 0);

    if (totalRawScore === 0) {
        return searchErrorV2("Q026", { userID });
    }

    const finalScores = rawScores.map(c => {
        const normalizedScore = (c.rawScore / totalRawScore) * 100;
        return {
            categoryID: c.categoryID,
            score: Math.round(normalizedScore),
            userScore: c.userScore,
            autoScore: Math.round(c.autoScore),
        };
    });

    return finalScores;
}

// calculate category score, based on user score and auto score
function calculateCategoryScore({ userScore, autoScore, userWeight = 0.6 }) {
    userScore = userScore ?? 0;
    autoScore = autoScore ?? 0;

    const autoWeight = 1 - userWeight;
    if (userScore === 0 && autoScore === 0) return 0;
    return userScore * userWeight + autoScore * autoWeight;
}


module.exports = {
    getUserCategoryScores,
    adjustWeight,
    calculateCategoryScore
};