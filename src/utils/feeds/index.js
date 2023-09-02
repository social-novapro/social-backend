const interactPostSchema = require("../../schemas/interactPostSchema");
const { getSubscriptions } = require("../notifications/subscriptions");
const { getPostsFromUser } = require("../post/main");
const { getPostWithData } = require("../post/getPost");
const { searchErrorV2 } = require("../searchError");

async function allPostsFeed({ userID }) {
    const AllPosts = await interactPostSchema.find();
    if (!AllPosts) return res.status(404).send(searchErrorV2("D003", { userID }));

    const sendPosts = [ ];

    for (const post of AllPosts) {
        const data = await getPostWithData({ userID, postID: post._id, post })
        if (data && !data.error) {
            sendPosts.push(data)
        }
    }
    
    sendPosts.sort((a, b) => a.postData.timePosted - b.postData.timePosted);

    return sendPosts;
}

async function subscriptionFeed({ userID }) {
    const sendPosts = [];
    const subscriptions = await getSubscriptions({ userID });

    if (subscriptions.error) return subscriptions;
    
    for (const sub of subscriptions) {
        const foundPosts = await getPostsFromUser({ userID: sub._id});
        for (const post of foundPosts) {
            const data = await getPostWithData({ userID, postID: post._id, post })
            if (data && !data.error) sendPosts.push(data)
        }
    }

    sendPosts.sort((a, b) => a.postData.timePosted - b.postData.timePosted);
    
    return sendPosts;
}



module.exports = { allPostsFeed, subscriptionFeed }