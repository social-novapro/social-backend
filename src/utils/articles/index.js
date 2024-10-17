const interactArticleComponentSchema = require("../../schemas/articles/interactArticleComponentSchema");
const interactArticleSchema = require("../../schemas/articles/interactArticleSchema");
const interactUserSchema = require("../../schemas/interactUserSchema");

// get articles
async function getSpecificArticle({ userID, articleID }) {

}

async function getCurrentArticleIndex({ userID }) {
    // do index later
    const foundArticles = await interactArticleSchema.find();
    
    const fullArticles = [];

    for (const article of foundArticles) {
        const foundComponents = await interactArticleComponentSchema.find({ articleID: article._id });
        const foundUser = await interactUserSchema.findOne({ _id: article.userID });

        const myArticle = {
            ...article._doc,
            components: foundComponents,
            user: foundUser
        };

        fullArticles.push(myArticle)
    }
    
    return fullArticles;
}


module.exports = {
    getSpecificArticle,
    getCurrentArticleIndex
}