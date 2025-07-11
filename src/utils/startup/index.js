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
    // await getUserCategoryScores({ userID: "006cd187-db50-46c5-a36e-224c3aebab9e" })
}

module.exports = {InteractStartup};