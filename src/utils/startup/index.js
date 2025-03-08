const { startupCategories } = require("../post/categories/startup");

async function InteractStartup() {
    console.log('---STARTUP---');
    console.log('---Starting up categories...');
    await startupCategories();
    console.log('---STARTUP DONE---');
}

module.exports = {InteractStartup};