const interactPostSchema = require("../../schemas/interactPostSchema");
const { getSubscriptions } = require("../notifications/subscriptions");
const { getPostWithData } = require("../post/getPost");
const { searchErrorV2 } = require("../searchError");
const interactUserSchema = require("../../schemas/interactUserSchema");
const { getUserPosts } = require("../post/user");
const { getCurrentIndex, getPostIndexData } = require("../post/postIndexManagement");

async function allPostsFeed({ userID }) {
    const AllPosts = await interactPostSchema.find();
    if (!AllPosts) return res.status(404).send(searchErrorV2("D003", { userID }));
    const ownUser = await interactUserSchema.findOne({_id: userID});

    const sendPosts = [ ];

    for (const post of AllPosts) {
        const data = await getPostWithData({ userID, postID: post._id, post, ownUser })
        if (data && !data.error) {
            sendPosts.push(data)
        }
    }
    
    sendPosts.sort((a, b) => a.postData.timestamp - b.postData.timestamp);

    return sendPosts;
}

async function allPostsFeedV2({ userID, indexID }) {
    var currentIndex 
    if (indexID) currentIndex = await getPostIndexData({ indexID });
    else currentIndex = await getPostIndexData({indexID: null});
    if (!currentIndex || !currentIndex.postIDs) return searchErrorV2("D000", { userID });

    const ownUser = await interactUserSchema.findOne({_id: userID});

    var sendingData = {
        nextIndexID: currentIndex.nextIndexID,
        prevIndexID: currentIndex.prevIndexID,
        amount: currentIndex.amount,
        feedVersion: 2,
        posts: [ ]
    }
    
    for (const postID of currentIndex.postIDs) {
        const data = await getPostWithData({ userID, postID: postID._id, ownUser })
        if (data && !data.error) {
            sendingData.posts.push(data)
        }
    }

    if (currentIndex.amount < 10) {
        const prevIndex = await getPostIndexData({ indexID: currentIndex.prevIndexID });
        if (prevIndex && prevIndex.postIDs) {
            sendingData.prevIndexID = prevIndex.prevIndexID;
            sendingData.amount += prevIndex.amount;
            for (const postID of prevIndex.postIDs) {
                const data = await getPostWithData({ userID, postID: postID._id, ownUser })
                if (data && !data.error) {
                    sendingData.posts.push(data)
                }
            }
        };
    }
  
    sendingData.posts.sort((a, b) => a.postData.timestamp - b.postData.timestamp);
    return sendingData;
}

async function subscriptionFeedV2({ userID }) {
    const foundPosts = await subscriptionFeed({ userID });
    const sendingData = {
        amount: foundPosts.length,
        feedVersion: 2,
        posts: foundPosts
    }
    return sendingData;
}

// TODO: implement new version
// - getUserPosts only getting newest index of user, past that you cant get more posts
async function subscriptionFeed({ userID }) {
    const sendPosts = [];
    const subscriptions = await getSubscriptions({ userID });

    if (subscriptions.error) return subscriptions;
    
    for (const sub of subscriptions) {
        const foundPosts = await getUserPosts({ userID: sub._id, requesterID: userID, coposts: true});
        if ((foundPosts && !foundPosts.error) || (foundPosts.length > 0 && !foundPosts.error) ) sendPosts.push(...foundPosts.posts);
    }

    sendPosts.sort((a, b) => a.postData.timestamp - b.postData.timestamp);
    
    return sendPosts;
}

module.exports = { 
    allPostsFeed, allPostsFeedV2, 
    subscriptionFeed, subscriptionFeedV2
}