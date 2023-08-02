const {v4 : uuidv4} = require('uuid');
const interactPostSchema = require('../../../schemas/interactPostSchema');
const { SCHEMA_VERSIONS } = require('../../../../config.json');
const { checktime } = require('../../checktime');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const {pushQuotePost} = require('../../../utils/notifications/pustQuotePost');
const interactRepliesSchema = require('../../../schemas/postSchemas/interactRepliesSchema');
const { findPoll } = require('../../polls');

async function newPostID() {
    const newID = uuidv4();
    return doubleCheckNewID(newID);
};

async function doubleCheckNewID(newID) {
    result = await interactPostSchema.findOne({ _id: newID });
    if (result) return newPostID();
    else return newID;
};

async function newPostIndex(userID, data) {
    const { content, quoteReplyPostID, replyingPostID, linkedPollID } = data
    const postID = await newPostID();
    const currentTime = checktime();
    // const newIndex = await newReplyIndex(postID);
    // const mentionData = await checkForMentions(content);
    // console.log(mentionData);

    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {        
        _id: postID,
        __v: SCHEMA_VERSIONS.interactPostSchema,
        timePosted: currentTime,
        userID,
        content,
        totalLikes: 0,
        totalReplies: 0,
        // indexID: newIndex._id
    }, {
        upsert: true
    });

    if (quoteReplyPostID) {
        const quotingPost = await interactPostSchema.findOne({_id: quoteReplyPostID});
        if (quotingPost) await quotingPostSetup(quotingPost, postID, userID);
        // else return res.status(404).send(searchError("D002"));
    }
    if (replyingPostID) {
        const replyingPost = await interactPostSchema.findOne({_id: replyingPostID});
        if (replyingPost) await replyingPostSetup(replyingPost, postID, userID);
        // else return res.status(404).send(searchError("D002"));
    }
    if (linkedPollID) {
        const foundPoll = await findPoll({pollID: linkedPollID});
        if (!foundPoll.error) await linkedPollSetup(linkedPollID, postID, userID);
        // else return res.status(404).send(searchError("O000"));
    }
    
    return postID;
};

async function checkForMentions(content) {
    const foundTags = [];
    var foundUsers = {};
    // lookFor("@", content)

    const tagRegex = /@\\?(?:[a-zA-Z]+)/g;
    console.log(content.matchAll(tagRegex))

    for (const word of content.matchAll(tagRegex)) {
        // if (foundUsers[word.input]) break;
        // else foundUsers[`${word.input}`] = true;
        console.log(word)
        const mentionUser = word.input.replace("@", "")
        const wasTag = await interactUserSchema.findOne({ username: mentionUser })
        console.log(word.input.replace("@", ""))
        console.log(mentionUser)
        if (wasTag) {
            mentionData = {
                "userID" : wasTag._id,
                "username" : wasTag.username,
                "index": word.input.index,
                "end" : word.index+word.input.length
            }
            console.log(mentionData)
            foundTags.push(mentionData);
        };
        
        console.log(`"${word[0]}" starts at index ${word.index}.`);
    }

    return foundTags;
}

async function quotingPostSetup(quotingPost, postID, userID) {
    // console.log(quotingPost)
    const quotingUser = await interactUserSchema.findOne({_id: quotingPost.userID})
    
    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        isQuote: true,
        quoteReplyPostID: `${quotingPost ? quotingPost._id : null}`,
        quotedPost: quotingPost,
        quotedUser: quotingUser,
        quoteData : {
            postID: quotingPost._id,
            userID: quotingPost.userID
        }
    }, {
        upsert: true
    });

    // add to the main post's quote count
    await interactPostSchema.findOneAndUpdate({
        _id: quotingPost._id//postID
    }, {        
        totalQuotes: quotingPost.totalQuotes ? quotingPost.totalQuotes + 1 : 1,
    }, {
        upsert: true
    });

    await pushQuotePost(userID, postID, quotingUser._id);

    return postID;
}

async function replyingPostSetup(replyingPost, postID, userID) {
    // adding new post to the main post's reply index
    const replyIndex = await getReplyIndex(replyingPost);
    const replyIndexID = replyIndex._id;

    // add to the reply index
    await interactRepliesSchema.findOneAndUpdate({
        _id: replyIndexID
    }, {
        amount: replyIndex.amount ? replyIndex.amount+1 : 1,
        $push: { "postIDs" : postID }
    }, {
        upsert: true
    });

    console.log(')')
    console.log(replyingPost)
    // add to the main post's reply count
    await interactPostSchema.findOneAndUpdate({
        _id: replyingPost._id//postID
    }, {        
        totalReplies: replyingPost.totalReplies ? replyingPost.totalReplies + 1 : 1,
    }, {
        upsert: true
    });

    // set to a reply inside the new post
    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        isReply: true,
        replyData : {
            indexID: replyIndexID,
            postID: replyingPost._id,
            userID: replyingPost.userID
        }
    }, {
        upsert: true
    })
    return postID;
}

async function linkedPollSetup(linkedPollID, postID) {
    // link the poll to the post
    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {     
        hasPoll: true,   
        pollID: linkedPollID
    });

    return postID;
}

async function getReplyIndex(replyingPost) {
    const foundIndex = await interactRepliesSchema.findOne({ _id: replyingPost.replyIndexID });
    if (!foundIndex) return await newReplyIndex(replyingPost._id);
    else if (foundIndex?.amount >= 50) {
        const newIndex = await newReplyIndex(replyingPost._id, foundIndex._id);
        return newIndex;
    } else {
        return foundIndex;
    }
    // const foundIndex = await interactRepliesSchema.findOne({ _id: 'replyIndex' });
}

async function replaceIndex(postID, previousIndex, newIndex) {
    await interactRepliesSchema.findOneAndUpdate({
        _id: previousIndex
    }, {
        nextIndex: newIndex
    }, {
        upsert: true
    });
}

async function newReplyIndex(postID, previousIndex) {
    const indexID = await newReplyIndexID();
    // creating new reply index
    await interactRepliesSchema.findOneAndUpdate({
        _id: indexID
    }, {
        _id: indexID,
        postID: postID,
        amount: 0,
        previousIndex: previousIndex ? previousIndex : null,
    }, {
        upsert: true
    });
    if (previousIndex) await replaceIndex(postID, previousIndex, indexID);

    // setting reply index ID to the main post
    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        replyIndexID: indexID
    }, {
        upsert: true
    });

    const foundIndex = await interactRepliesSchema.findOne({ _id: indexID });
    if (foundIndex) return foundIndex;
    else return null;
}

async function newReplyIndexID() {
    const newReplyIndexID = uuidv4();
    return checkReplyIndexID(newReplyIndexID);
}

async function checkReplyIndexID(newID) {
    const repliesIDused = await interactRepliesSchema.findOne({ _id: newID });
    if (repliesIDused) return newReplyIndex();

    else return newID;
}

module.exports = { newPostIndex };