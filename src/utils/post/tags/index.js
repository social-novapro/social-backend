const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactPostTagIndexSchema = require("../../../schemas/posts/interactPostTagIndexSchema");
const interactPostTagSchema = require("../../../schemas/posts/interactPostTagSchema");
const { checktime } = require("../../checktime");
const { v4: uuidv4 } = require("uuid");
const { searchErrorV2 } = require("../../searchError");
const { getPostWithData } = require("../getPost");

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
    wordIndex 
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
        indexID: tagIndex._id,
        userID,
        postID,
    });

    return interactPostTag;
}

async function getPostTags({ postID }) {
    const postTags = await interactPostTagSchema.find({postID});
    return postTags;
}

async function getTagTextIndex({ indexID }) {
    const tagIndex = await interactPostTagIndexSchema.findOne({_id: indexID});
    return tagIndex;
}

async function getCurrentTagTextIndex({ tagText }) {
    const tagIndex = await interactPostTagIndexSchema.findOne({tagText, current: true});
    return tagIndex;
}

async function getTagTextPosts({ userID, tagText, indexID }) {
    console.log("Searching " + tagText + " " + indexID)
    var tagIndex;

    if (indexID) {
        tagIndex = await getTagTextIndex({ indexID });
    } else if (tagText) {
        tagIndex = await getCurrentTagTextIndex({ tagText });
        console.log(tagIndex)
    } else {
        return searchErrorV2("X002", { userID });
    }
    // const tagIndex = await getCurrentTagTextIndex({ tagText });
    const posts = [];
    
    if (!tagIndex) return posts;
    if (!tagIndex.postIDs) return posts;

    console.log(tagIndex.postIDs)
    for (const postID of tagIndex.postIDs) {
        const post = await getPostWithData({ userID, postID });
        console.log(post)
        posts.push(post);
    }
    
    return posts;
}

module.exports = {
    findTagIndex, 
    pushPostTag,
    getPostTags,
    getTagTextPosts,
    getTagTextIndex
};