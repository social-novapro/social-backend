const {v4 : uuidv4} = require('uuid');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactPostSchema = require('../../../schemas/interactPostSchema');
const interactRepliesSchema = require('../../../schemas/postSchemas/interactRepliesSchema');
const interactQuotesSchema = require('../../../schemas/postSchemas/interactQuotesSchema');
const { SCHEMA_VERSIONS } = require('../../../../config.json');
const { checktime } = require('../../checktime');
const { pushQuotePost } = require('../../../utils/notifications/pustQuotePost');
const { findPoll } = require('../../polls');
const interactPostCoSchema = require('../../../schemas/postSchemas/interactPostCoSchema');
const { checkPostContent } = require('../../checks');
const { pushNewPost } = require('../../notifications/pushNewPost');
const { pushPostToIndex } = require('../postIndexManagement');
const { validPrivacyOption } = require('../../privacy');
const { searchErrorV2 } = require('../../searchError');
const { coposterRequestNotification } = require('../../pushNotifications/postActionNotifications');
const { embedPost } = require('../../search/embed');

async function createNewPost({
    content,
    userID,
    quoteReplyPostID,
    replyingPostID,
    linkedPollID,
    coposters,
    privacyOverride
}) {
    if (!content && !userID) return searchErrorV2("E001", { userID });
    else if (!content) return searchErrorV2("E002", { userID });
    else if (!userID) return searchErrorV2("E003", { userID });

    const checkedContent = await checkPostContent(content);
    if (checkedContent.error) return checkedContent;

    const userIDCheck = await interactUserSchema.findOne({ _id: userID});
    if (!userIDCheck) return searchErrorV2("E004", { userID });

    const privacyCheck = validPrivacyOption(userID, privacyOverride, "post")

    const postID = await newPostIndex(userID, {
        content, 
        quoteReplyPostID, 
        replyingPostID, 
        linkedPollID, 
        coposters,
        privacyOverride : !privacyCheck.error ? privacyOverride : null
    });

    //const check
    const postData = await interactPostSchema.findOne({_id: postID});
    if (!postData) return searchErrorV2("D002", { userID });

    pushNewPost(userID, postID)
    embedPost({ postID, userID: postData.userID, timestamp: postData.timestamp, content: postData.content });
    return postData
}

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
    const {
        content,
        quoteReplyPostID,
        replyingPostID,
        linkedPollID,
        coposters,
        privacyOverride
    } = data
    const postID = await newPostID();
    const currentTime = checktime();
    // const newIndex = await newReplyIndex(postID);
    // const mentionData = await checkForMentions(content);
    // console.log(mentionData);
    const spotifyIncludedContent = await getSpotifyEmbeds(content);
    //const userFound = await interactUserSchema.findOne({ _id: userID });
    //if (!userFound) return searchError("E004");

    await interactPostSchema.create({        
        _id: postID,
        __v: SCHEMA_VERSIONS.interactPostSchema,
        timePosted: currentTime,
        timestamp: currentTime,
        userID,
        content: spotifyIncludedContent,
        totalLikes: 0,
        totalReplies: 0,
        totalQuotes: 0,
        edited: false,
        hasPoll: false,
        isQuote: false,
        isReply: false,
        privacyOverride: privacyOverride ? privacyOverride : null,
        // indexID: newIndex._id
    });

    await pushPostToIndex({ postID, userID });
    
    const foundUser = await interactUserSchema.findOne({ _id: userID });
    foundUser.totalPosts = foundUser.totalPosts ? foundUser.totalPosts + 1 : 1;

    if (quoteReplyPostID) {
        const quotingPost = await interactPostSchema.findOne({_id: quoteReplyPostID});
        if (quotingPost) {
            await quotingPostSetup(quotingPost, postID, userID);
            foundUser.totalQuotes = foundUser.totalQuotes ? foundUser.totalQuotes + 1 : 1;
        }
    }
    if (replyingPostID) {
        const replyingPost = await interactPostSchema.findOne({_id: replyingPostID});
        if (replyingPost){
            await replyingPostSetup(replyingPost, postID, userID);
            foundUser.totalReplies = foundUser.totalReplies ? foundUser.totalReplies + 1 : 1;
        }
    }
    if (linkedPollID) {
        const foundPoll = await findPoll({pollID: linkedPollID, userID });
        if (!foundPoll.error) await linkedPollSetup(linkedPollID, postID, userID);
    }
    if (coposters) {
        const userFound = await interactUserSchema.findOne({ _id: userID });
        if (!userFound) return searchError("E004");
        var addedCoposters = [];
        for (const coposter of coposters) {
            if (addedCoposters.includes(coposter)) {
                console.log("Coposter already added")
                continue;
            } else if (coposter == userID) {
                console.log("User is the same as the poster")
                continue;
            }

            const foundCoposter = await interactUserSchema.findOne({ _id: coposter });
            if (foundCoposter) {
                await interactPostCoSchema.create({
                    _id: uuidv4(),
                    userID: coposter,
                    postID: postID,
                    timestamp: checktime(),
                    deletedPost: false,
                    declined: false,
                    approved: false,
                    approvedTimestamp: null
                });
                
                addedCoposters.push(foundCoposter._id);
            }
        }
        
        coposterRequestNotification({coposters: addedCoposters, userData: userFound, content})
    }

    await interactUserSchema.findOneAndUpdate({
        _id: foundUser._id
    }, { 
        totalPosts: foundUser.totalPosts,
        totalQuotes: foundUser.totalQuotes,
        totalReplies: foundUser.totalReplies
    })

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

async function addQuoteToIndex(quotingPost, postID) {
    const quoteIndex = await getQuoteIndex(quotingPost);
    const quoteIndexID = quoteIndex._id;

    // add to the reply index
    await interactQuotesSchema.findOneAndUpdate({
        _id: quoteIndexID
    }, {
        amount: quoteIndex.amount ? quoteIndex.amount+1 : 1,
        $push: { "postIDs" : postID }
    }, {
        upsert: true
    });

    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        isQuote: true,
        quoteData : {
            indexID: quoteIndexID,
            postID: quotingPost._id,
            userID: quotingPost.userID
        }
    }, {
        upsert: true
    });

    return quoteIndexID;
}

async function quotingPostSetup(quotingPost, postID, userID) {
    // adding new post to the main post's quote index
    const quoteIndexID = await addQuoteToIndex(quotingPost, postID);

    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        isQuote: true,
        quoteData : {
            indexID: quoteIndexID,
            postID: quotingPost._id,
            userID: quotingPost.userID
        }
    }, {
        upsert: true
    });

    // add to the main post's quote count
    await interactPostSchema.findOneAndUpdate({
        _id: quotingPost._id //postID
    }, {        
        totalQuotes: quotingPost.totalQuotes ? quotingPost.totalQuotes + 1 : 1,
    }, {
        upsert: true
    });

    await pushQuotePost(userID, postID, quotingPost.userID);

    return postID;
}

async function addReplyToIndex(replyingPost, postID) {
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

    return replyIndexID;
}

async function replyingPostSetup(replyingPost, postID, userID) {
    // adding new post to the main post's reply index
    const replyIndexID = await addReplyToIndex(replyingPost, postID);
    
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
}

async function replaceReplyIndex(postID, previousIndex, newIndex) {
    await interactRepliesSchema.findOneAndUpdate({
        _id: previousIndex
    }, {
        nextIndex: newIndex,
        indexEndTime: checktime()
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
        indexStartTime: checktime()
    }, {
        upsert: true
    });
    if (previousIndex) await replaceReplyIndex(postID, previousIndex, indexID);

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

async function getQuoteIndex(replyingPost) {
    const foundIndex = await interactQuotesSchema.findOne({ _id: replyingPost.quoteIndexID });
    if (!foundIndex) return await newQuoteIndex(replyingPost._id);
    else if (foundIndex?.amount >= 50) {
        const newIndex = await newQuoteIndex(replyingPost._id, foundIndex._id);
        return newIndex;
    } else {
        return foundIndex;
    }
}

async function replaceQuoteIndex(postID, previousIndex, newIndex) {
    await interactQuotesSchema.findOneAndUpdate({
        _id: previousIndex
    }, {
        nextIndex: newIndex,
        indexEndTime: checktime()
    }, {
        upsert: true
    });
}

async function newQuoteIndex(postID, previousIndex) {
    const indexID = await newQuoteIndexID();
    // creating new reply index
    await interactQuotesSchema.findOneAndUpdate({
        _id: indexID
    }, {
        _id: indexID,
        postID: postID,
        amount: 0,
        previousIndex: previousIndex ? previousIndex : null,
        indexStartTime: checktime()
    }, {
        upsert: true
    });
    if (previousIndex) await replaceQuoteIndex(postID, previousIndex, indexID);

    // setting reply index ID to the main post
    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        quoteIndexID: indexID
    }, {
        upsert: true
    });

    const foundIndex = await interactQuotesSchema.findOne({ _id: indexID });
    if (foundIndex) return foundIndex;
    else return null;
}

async function newQuoteIndexID() {
    const newReplyIndexID = uuidv4();
    return checkQuoteIndexID(newReplyIndexID);
}

async function checkQuoteIndexID(newID) {
    const repliesIDused = await interactQuotesSchema.findOne({ _id: newID });
    if (repliesIDused) return newReplyIndex();

    else return newID;
}

async function getSpotifyEmbeds(text) {
    const spotifyRegex = /(?:https?:\/\/(?:open\.spotify\.com|spotify\.link)\/(?:embed\/)?[a-zA-Z0-9]+\/?[a-zA-Z0-9_-]*)/g;
    const spotifyLinks = text.matchAll(spotifyRegex);

    var newText = text;
    const spotifyEmbeds = [];
    var currentNumber = 0;
    for (const link of spotifyLinks) {
        const spotifyActualURL = link[0];
        spotifyURL = spotifyActualURL.replace("https://", "")
        if (spotifyURL.includes("/embed")) spotifyURL = spotifyURL.replace("/embed", "");

        var spotifySeperations = spotifyURL.split("/");

        var spotifyType = ""
        var spotifyID = ""

        if (spotifyURL.includes("open.spotify")) {
            spotifyType = spotifySeperations[1];
            spotifyID = spotifySeperations[2];
        } else if (spotifyURL.includes("spotify.link")) {
            const res = await fetch(`https://${spotifyURL}`)
            const html = await res.text()

            spotifyURL = html.split('You can also <a class="secondary-action" href="')[1].split('">open this link in your browser.</a>')[0].split("?")[0];
            spotifyURL = spotifyURL.replace("https://", "")
            spotifySeperations = spotifyURL.split("/")

            spotifyType = spotifySeperations[1];
            spotifyID = spotifySeperations[2];
        }

        var spotifyEmbed = `https://open.spotify.com/embed/${spotifyType}/${spotifyID}`;
        spotifyEmbeds.push(spotifyEmbed);
        newText = newText.replace(spotifyActualURL, `{{spotify_${currentNumber}}}`);

        currentNumber++
    }
    
    for (var i = 0; i < spotifyEmbeds.length; i++) {
        newText = newText.replace(`{{spotify_${i}}}`, spotifyEmbeds[i]);
    }

    return newText;
}

module.exports = { createNewPost, addReplyToIndex, addQuoteToIndex };