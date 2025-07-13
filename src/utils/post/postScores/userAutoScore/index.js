// rank user categories
// using "autoScore"  in interactCategoryUserSchema


// to improve:  should generalize score for each category into subcategories
// https://chatgpt.com/c/686eed85-b964-8001-a709-a45cd41c0006
// can also use weights.json to adjust weights for each category, rather than hardcoding interaction count

const interactCategory = require("../../../../schemas/categories/interactCategory");
const interactCategoryUser = require("../../../../schemas/categories/interactCategoryUser");
const interactPostSchema = require("../../../../schemas/interactPostSchema");
const { updateUserCategory } = require("../../categories");

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
    console.log("ADJUSTING WEIGHT");

    if (!userID && !userData) return { error: true, msg: "No userID or userData provided to adjust weight" };
    if (!postID && !postData) return { error: true, msg: "No postID or postData provided to adjust weight" };
    if (!action) return { error: true, msg: "No action provided to adjust weight" };
    // check if postData category
    
    // dont need userData, but need postData
    if(!postData) postData = await interactPostSchema.findOne({ _id: postID });

    if (!postData.category) return { error: true, msg: "No category found for post" };

    const foundCategory = await interactCategory.findOne({name: postData.category});
    if (!foundCategory) return { error: true, msg: "Category was invalid" };
    
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
        await userLikePostWeight({ userID, postID, postData, foundCategory });
    } else if (action === "POST.UNLIKE") {
        await userUnlikePostWeight({ userID, postID, postData, foundCategory });
    }

    // Replied to post
    if (action === "POST.REPLY_CREATED") {
        // adjust user category score
        await userLikePostWeight({ userID, postID, postData, foundCategory });
    } else if (action === "POST.REPLY_DELETED") {
        // adjust user category score
        await userUnlikePostWeight({ userID, postID, postData, foundCategory });
    }

    // Quoted post
    if (action === "POST.QUOTE_CREATED") {
        // adjust user category score
        await userLikePostWeight({ userID, postID, postData, foundCategory });
    } else if (action === "POST.QUOTE_DELETED") {
        // adjust user category score
        await userUnlikePostWeight({ userID, postID, postData, foundCategory });
    }

    // Created post
    if (action === "POST.CREATED") {
        // adjust user category score
        await userLikePostWeight({ userID, postID, postData, foundCategory });
    } else if (action === "POST.DELETED") {
        // adjust user category score
        await userUnlikePostWeight({ userID, postID, postData, foundCategory });
    }

    const userScores = await getUserCategoryScores({ userID });
    console.log("User scores found:", userScores);
    return userScores; // return user scores, so they can be used to update user category
}

async function userLikePostWeight({ userID, postID, postData, foundCategory }) {
    // const currentCategoryInfo
    // adjust user category score
    await interactCategoryUser.findOneAndUpdate({
        userID,
        categoryID: foundCategory.id
    }, {
        $inc: {
            autoScore: +1,
            amountLikes: +1, // increment amount of likes
        }
    });
}

async function userUnlikePostWeight({ userID, postID, postData, foundCategory }) {
    // adjust user category score
    await interactCategoryUser.findOneAndUpdate({
        userID,
        categoryID: foundCategory.id
    }, {
        $inc: {
            autoScore: -1,
            amountLikes: -1,
        }
    });
}

// get category score
async function getUserCategoryScores({ userID }) {
    if (!userID) return { error : true, msg: "No userID provided to create category scores" };

    var categories = await interactCategoryUser.find({ userID }); 
    console.log("Categories found for user:", categories);
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
        });
    }

    const totalRawScore = rawScores.reduce((sum, c) => sum + c.rawScore, 0);

    if (totalRawScore === 0) {
        return { error: true, msg: "No meaningful category scores found for user." };
    }

    const finalScores = rawScores.map(c => {
        const normalizedScore = (c.rawScore / totalRawScore) * 100;
        return {
            categoryID: c.categoryID,
            score: Math.round(normalizedScore),
        };
    });

    console.log("Final normalized scores:", finalScores);

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