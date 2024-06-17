const interactPostTagIndexSchema = require("../../../schemas/posts/interactPostTagIndexSchema");
const interactPostTagSchema = require("../../../schemas/posts/interactPostTagSchema");
const { checktime } = require("../../checktime");
const { v4: uuidv4 } = require("uuid");

async function findTagIndex({tagText}) {
    const tagIndex = await interactPostTagIndexSchema.findOne({tagText, current: true});

    if (!tagIndex) {
        const newTagIndex = await createTagIndex({tagText});
        return newTagIndex;
    } else if (tagIndex.count > 20) {
        const newTagIndex = await createTagIndex({tagText, prevIndexID: tagIndex._id});
        return newTagIndex;
    }

    return tagIndex;
}

async function createTagIndex({tagText, prevIndexID}) {
    const tagIndex = await interactPostTagIndexSchema.create(
        {_id: uuidv4(),
        current: true,
        tagText,
        timestamp: checktime(),
        count: 0,
        tagIDs: [],
        prevIndexID : prevIndexID ? prevIndexID : null,
    });

    return tagIndex;
}

async function pushPostTag({ userID, postID, tagText, tagTextOriginal, wordIndex }) {
    const tagIndex = await findTagIndex({tagText});
    const tagID = uuidv4();

    tagIndex.tagIDs.push(tagID);
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

module.exports = {findTagIndex, pushPostTag};