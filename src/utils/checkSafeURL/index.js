async function checkSafeURL(url) {

    if (!url.startsWith("https://")) return { "safe" : false };

    return { "safe" : true };
};

module.exports = { checkSafeURL };