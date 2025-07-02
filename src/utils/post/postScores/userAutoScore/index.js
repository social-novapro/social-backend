// rank user categories
// using "autoScore"  in interactCategoryUserSchema

const interactCategoryUser = require("../../../../schemas/categories/interactCategoryUser");

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
    // 
}

// get category score
async function getUserCategoryScores({ userID }) {
    if (!userID) return { error : true, msg: "No userID provided to create category scores" };
    const categories = await interactCategoryUser.find({ userID });
    var totalAddedUserScore = 0;
    var totalAddedAutoScore = 0;

    categories = categories.filter(category => {
        // filter out categories with no scores
        if (category.userScore === null && category.autoScore === null) return false;
        // fitler out categories with combined scores less than 2
        if (category.userScore+category.autoScore < 2) return false;

        // get total score sums
        if (category.userScore === null) category.userScore = 0;
        else totalAddedUserScore += category.userScore;
        if (category.autoScore === null) category.autoScore = 0;
        else totalAddedAutoScore += category.autoScore;
        return true;
    });

    const totalAddedScore = (totalAddedAutoScore + totalAddedUserScore);//*10;

    const finalScores = [];
    for (const category of categories) {
        const categoryScore = calculateCategoryScore({
            userScore: category.userScore,
            autoScore: category.autoScore,
            totalAddedScore
        });
     
        finalScores.push({
            categoryID: category.categoryID,
            score: Math.round(categoryScore * 100) // normalize to 0-100
        });
    }

    if (finalScores.length === 0) return { error: true, msg: "No categories found for user" };
    return finalScores;
}

// calculate category score, based on user score and auto score
function calculateCategoryScore({ userScore, autoScore, totalAddedScore }) {
    if (userScore===null) return autoScore;
    if (autoScore===null) return userScore;
    if (totalAddedScore === 0) return 0;

    const combinedScore = userScore + autoScore;
    if (combinedScore == 0) return 0;

    // normalize score 
    return (combinedScore) / totalAddedScore;
}