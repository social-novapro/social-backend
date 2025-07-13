const { startupCategories } = require("../post/categories/startup");
const { getUserCategoryScores } = require("../post/postScores/userAutoScore");
const { startupPostEmbeddings } = require("../search/embed/startup");

async function InteractStartup() {
    console.log('---STARTUP---');
    console.log('---Starting up categories...');
    await startupCategories();
    console.log('---Updated category storage---');
    console.log('---Updating post embeddings...');
    await startupPostEmbeddings();
    console.log('---Post embeddings updated---');

    console.log('---STARTUP DONE---');
    // const userCatScore = await getUserCategoryScores({userID:"12bf2cb7-0f22-49ac-930c-3689fcdbcf3f"})
    // const userCatScore2 = await getUserCategoryScores({ userID: "006cd187-db50-46c5-a36e-224c3aebab9e" })
    // console.log('---User category scores---');
    // console.log(userCatScore);
    // console.log(userCatScore2);
}

module.exports = {InteractStartup};