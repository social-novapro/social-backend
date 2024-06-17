const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactPostTagIndexSchema = require("../../../schemas/posts/interactPostTagIndexSchema");
const interactPostTagSchema = require("../../../schemas/posts/interactPostTagSchema");
const { checktime } = require("../../checktime");
const { v4: uuidv4 } = require("uuid");
const { searchErrorV2 } = require("../../searchError");
const { getPostWithData } = require("../getPost");
const { getPostTags } = require("./getPostTags");

async function findTagIndex({tagText, tagType}) {
    const tagIndex = await interactPostTagIndexSchema.findOne({tagText, tagType, current: true});

    if (!tagIndex) {
        const newTagIndex = await createTagIndex({tagText, tagType});
        return newTagIndex;
    } else if (tagIndex.count > 20) {
        const newTagIndex = await createTagIndex({tagText, tagType, prevIndexID: tagIndex._id});
        return newTagIndex;
    }

    return tagIndex;
}

async function createTagIndex({tagText, tagType, prevIndexID}) {
    const newIndexID = uuidv4();
    if (prevIndexID) {
        await  interactPostTagIndexSchema.findOneAndUpdate({
            _id: prevIndexID
        }, {
            nextIndexID: newIndexID,
            current: false
        });
    }

    const tagIndex = await interactPostTagIndexSchema.create({
        _id: uuidv4(),
        current: true,
        tagText,
        timestamp: checktime(),
        count: 0,
        tagType,
        tagIDs: [],
        postIDs: [],
        prevIndexID : prevIndexID ? prevIndexID : null,
    });

    return tagIndex;
}

async function pushPostTag({ 
    userID, 
    postID, 
    tagText, 
    tagTextOriginal, 
    tagType,
    wordIndex,
    postedTimestamp
}) {
    const tagIndex = await findTagIndex({tagText, tagType});
    const tagID = uuidv4();

    tagIndex.tagIDs.push(tagID);
    tagIndex.postIDs.push(postID);
    tagIndex.count += 1;
    tagIndex.save();

    const interactPostTag = await interactPostTagSchema.create({
        _id: tagID,
        tagTextOriginal,
        wordIndex,
        timestamp: postedTimestamp ? postedTimestamp : checktime(),
        indexID: tagIndex._id,
        userID,
        postID,
    });

    return interactPostTag;
}

// async function getPostTags({ postID }) {
//     const postTags = await interactPostTagSchema.find({postID});
//     return postTags;
// }

async function getTagTextIndex({ indexID }) {
    const tagIndex = await interactPostTagIndexSchema.findOne({_id: indexID});
    return tagIndex;
}

async function getCurrentTagTextIndex({ tagText }) {
    const tagIndex = await interactPostTagIndexSchema.findOne({tagText, current: true});
    return tagIndex;
}

async function getTagTextPosts({ userID, tagText, indexID }) {
    var tagIndex;

    if (indexID) {
        tagIndex = await getTagTextIndex({ indexID });
    } else if (tagText) {
        tagIndex = await getCurrentTagTextIndex({ tagText });
    } else {
        return searchErrorV2("X002", { userID });
    }

    const posts = [];
    
    if (!tagIndex) return posts;
    if (!tagIndex.postIDs) return posts;

    for (const postID of tagIndex.postIDs) {
        const post = await getPostWithData({ userID, postID });
        posts.push(post);
    }
    
    return posts;
}

async function editTags({ userID, postID, newContent, postedTimestamp }) {
    // remove tags
    await removeTags({ userID, postID });

    // check for tags
    const tags = await checkForTags({ userID, postID, content: newContent, postedTimestamp });
    return tags;
}

async function removeTags({ userID, postID }) {
    const postTags = await getPostTags({ postID });

    for (const tag of postTags) {
        await interactPostTagSchema.findOneAndDelete({_id: tag._id});
        await interactPostTagIndexSchema.findOneAndUpdate({
            _id: tag.indexID
        }, {
            $pull: {
                tagIDs: tag._id,
                postIDs: postID
            },
            $inc: {
                count: -1
            }
        });
    }
}

async function checkForTags({userID, postID, content, postedTimestamp}) {
    if (!content) return searchErrorV2("X001", {userID});

    // { type: 1/2, text, id }
    const foundTags = [];
    const contentArgs = content.split(/[ ]+/)
    // const tagRegex = /^(@|#)[(a-z)0-9]+$/g;
    const tagRegex = /^[@|#][a-z0-9]*$/g;

    // const found
    for (var index = 0; index < contentArgs.length; index++) {
        // is usetag or hashtag
        if (contentArgs[index].startsWith("@") || contentArgs[index].startsWith("#")) {
            const currentWord = contentArgs[index];
            const currentWordLc = currentWord.toLowerCase();
            const validRegex = tagRegex.test(currentWordLc);
            tagRegex.lastIndex = 0; // reset the regex

            if (!validRegex) continue;

            // add to the tag index
            const tagReturn = await pushPostTag({ 
                userID: userID,
                postID: postID,
                tagType: currentWord.startsWith("@") ? 0 : 1,
                tagText: currentWordLc,
                tagTextOriginal: currentWord,
                wordIndex: index,
                postedTimestamp
            })

            foundTags.push(tagReturn);
        }
    }

    if (foundTags.length > 0) {
        await interactPostSchema.findOneAndUpdate({
            _id: postID,
        }, {
            hasTags: true
        })
    };
    
    return foundTags;
}

module.exports = {
    findTagIndex, 
    pushPostTag,
    getTagTextPosts,
    getTagTextIndex,
    checkForTags,
    editTags,
    removeTags
};