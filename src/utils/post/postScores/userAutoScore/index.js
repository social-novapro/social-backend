// rank user categories
// using "autoScore"  in interactCategoryUserSchema

const interactCategory = require("../../../../schemas/categories/interactCategory");
const interactCategoryUser = require("../../../../schemas/categories/interactCategoryUser");
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
    userID, userData,
    action,
    postID, postData, // 1, 2, 5, 6
    userFollowedID, userFollowedData, // 3, 4
}) {
    if (!userID || !userData) return { error: true, msg: "No userID or userData provided to adjust weight" };
    if (!postID || !postData) return { error: true, msg: "No postID or postData provided to adjust weight" };
    if (!action) return { error: true, msg: "No action provided to adjust weight" };
    // check if postData category
    
    const foundCategory = await interactCategory.findOne({name: postData.category});
    if (!foundCategory) return { error: true, msg: "No category found for post" };
    
    const foundInteractCategoryUser = await interactCategoryUser.findOne({ userID, categoryID: foundCategory.id });
    if (!foundInteractCategoryUser) {
        // create new
        await updateUserCategory({
            userID: userID,
            categoryID: foundCategory.id,
        });
    }

    // const currentCategoryInfo
    // adjust user category score
    await interactCategoryUser.findOneAndUpdate({
        userID,
        categoryID: foundCategory.id
    }, {
        $inc: {
            autoScore: action === "POST.LIKE" ? 1 : -1,
            amountLikes: action === "POST.LIKE" ? 1 : -1,
        }
    });
    console.log("User category score adjusted for user:", userID, "category:", foundCategory.id, "action:", action);
    const userScores = await getUserCategoryScores({ userID });
    console.log("User scores found:", userScores);
}


// get category score
async function getUserCategoryScores({ userID }) {
    if (!userID) return { error : true, msg: "No userID provided to create category scores" };
    var categories = await interactCategoryUser.find({ userID }); 
    // any other categories will not be considered, since no interaction with user
    // and user didnt interact with them


    console.log("Categories found for user:", categories);
    var totalAddedUserScore = 0;
    var totalAddedInteractions = 0; // total added likes
    var totalAddedAutoScore = 0;
    // Calculate totals before filtering
    categories.forEach(category => {
        if (category.userScore !== null && category.userScore !== undefined) {
            totalAddedUserScore += category.userScore;
        }
        if (category.autoScore !== null && category.autoScore !== undefined) {
            totalAddedInteractions += category.autoScore;
        }
    });

    console.log("Total added user score:", totalAddedUserScore);
    console.log("Total added auto score:", totalAddedInteractions);

    categories = categories.filter(category => {
        // filter out categories with no scores
        if (category.userScore === null && category.autoScore === null) return false;

        const userScoreValue = category.userScore ?? 0;
        const autoScoreValue = category.autoScore ?? 0;
        if (userScoreValue + autoScoreValue < 2) return false;

        // category.autoScorePercentage = 0;
        if (autoScoreValue > 0) {
            console.log('is reaching, ', category.autoScore, totalAddedInteractions);
            category.autoScore = (category.autoScore / totalAddedInteractions) * 100;
            totalAddedAutoScore += category.autoScore; // total added auto score
        }
        if (userScoreValue > 0) {
            category.userScore = (category.userScore) * 10; // 0-10 -> 0-100

        }

        return true;
    });

    console.log(categories)
    // calc #


    const sumScores = (totalAddedAutoScore + (totalAddedUserScore*10)) || 0; // total added auto score + total added user score * 10
    const scoreBias = 100 / (sumScores ?? 100); // bias score to 100

    var totalScore = 0;
    const finalScores = [];
    for (const category of categories) {
        const categoryScore = calculateCategoryScore({
            userScore: category.userScore,
            autoScore: category.autoScore,
            scoreBias,
            totalAddedScore: sumScores
        });
        totalScore += categoryScore;
        console.log(`Category ${category.categoryID} score:`, categoryScore);
        finalScores.push({
            categoryID: category.categoryID,
            score: Math.round(categoryScore) // normalize to 0-100
        });
    }

    console.log("Final total score:", totalScore);
    if (finalScores.length === 0) return { error: true, msg: "No categories found for user" };
    return finalScores;
}

// calculate category score, based on user score and auto score
function calculateCategoryScore({ userScore, autoScore, scoreBias }) {
    console.log("Calculating category score with userScore:", userScore, "autoScore:", autoScore, "scoreBias:", scoreBias);
    if (userScore===null || userScore===undefined) return autoScore * scoreBias;
    if (autoScore===null || autoScore===undefined) return userScore * scoreBias;
    if (scoreBias === 0) return 0;

    const combinedScore = userScore + autoScore;
    if (combinedScore == 0) return 0;

    // normalize score 
    return (combinedScore) * scoreBias;
}


module.exports = {
    getUserCategoryScores,
    adjustWeight,
    calculateCategoryScore
};