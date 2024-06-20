const interactPostTagIndexSchema = require("../../schemas/posts/interactPostTagIndexSchema");
const { getTagTextPosts } = require("../post/tags");

async function searchPostTags(userID, lowerCaseLookupArr) {
    var tagsFound = [];

    for (var i = 0; i < lowerCaseLookupArr.length; i++) {
        if (lowerCaseLookupArr[i].startsWith("@") || lowerCaseLookupArr[i].startsWith("#")) {
            const tagFound = await getTagTextPosts({ userID, tagText: lowerCaseLookupArr[i] });
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

async function searchHashTags({userID, text}) {
    if (!userID) return searchErrorV2("U002", { userID: "Unknown" });
    if (!text) return searchErrorV2("U006", { userID });
    const lowerCaseHashtag = text.toLowerCase();

    const allTags = await interactPostTagIndexSchema.find({current: true, tagType: 1});
    if (text=="#") return [];

    const tags = [];
    const addedTags = [];
    for (const tag of allTags) {
        if (tag.tagText.startsWith(lowerCaseHashtag)) {
            const newText = tag.tagText.replace(lowerCaseHashtag, text);
            if (addedTags.includes(tag.tagText)) continue;

            const possibility = lowerCaseHashtag.length / tag.tagText.length
            const pushTag = {
                possibility: possibility.toFixed(3),
                tag: newText
            }

            tags.push(pushTag)
            addedTags.push(tag.tagText)
        }
    }

    if (!tags) return searchErrorV2("U007", { userID })
    tags.sort((firstItem, secondItem) => firstItem.possibility - secondItem.possibility);
    tags.reverse()

    return tags;
}

module.exports = { searchPostTags, searchHashTags };