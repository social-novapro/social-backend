const { current } = require("../../../config.json");
async function checkSafeURL(url) {
    if (!url.startsWith("https://") && current != "dev") return { "safe" : false };

    return { "safe" : true };
};

module.exports = { checkSafeURL };