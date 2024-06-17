const { getTagTextPosts } = require("../post/tags");

async function searchPostTags(userID, lowerCaseLookupArr) {
    var tagsFound = [];

    for (var i = 0; i < lowerCaseLookupArr.length; i++) {
        console.log("looking at " + lowerCaseLookupArr[i])
        if (lowerCaseLookupArr[i].startsWith("@") || lowerCaseLookupArr[i].startsWith("#")) {
            const tagFound = await getTagTextPosts({ userID, tagText: lowerCaseLookupArr[i] });
            console.log(tagFound)
            if (tagFound.length > 0) tagsFound.push({
                tag: lowerCaseLookupArr[i], 
                posts: tagFound
            });
        };
    }

    return tagsFound;
    /*
        [{
            tag: tagFound,
            posts: fullPostData
        }]
    */
}

module.exports = { searchPostTags };