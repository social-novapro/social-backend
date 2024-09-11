const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { checktime } = require("../../checktime");
const { getPostWithData } = require("../../post/getPost");
const { searchErrorV2 } = require("../../searchError");
const { checkIfPinned } = require("./checkIfPinned");

/* add a pinned post to a user's profile */
async function addPinnedPost({ userID, postID }) {
    const foundPost = await interactPostSchema.findOne({ _id: postID });
    if (!foundPost) return searchErrorV2("D015", { userID });

    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData) return searchErrorV2("B001", { userID });

    const pinnedFound = await checkIfPinned({ pinsFound: userData?.pins || null, postID });
    if (pinnedFound) return searchErrorV2("C018", { userID });

    await interactUserSchema.findOneAndUpdate({
        _id: userID,
    }, {
        $push: {
            pins: {
                _id: postID,
                timestamp: checktime(),
            },
        },
    })

    const newPostData = await getPostWithData({ userID, postID });
    return newPostData;
}

/* remove a pinned post from a user's profile */
async function removePinnedPost({ userID, postID }) {
    const foundPost = await interactPostSchema.findOne({ _id: postID });
    if (!foundPost) return searchErrorV2("D015", { userID });

    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData || !userData.pins || !userData.pins[0]) return searchErrorV2("C017", { userID });

    const pinnedFound = await checkIfPinned({ pinsFound: userData.pins, postID });
    if (!pinnedFound) return searchErrorV2("C019", { userID });

    await interactUserSchema.findOneAndUpdate({
        _id: userID,
    }, {
        $pull: {
            pins: {
                _id: postID,
            },
        },
    })

    const newPostData = await getPostWithData({ userID, postID });
    return newPostData;
}

/* remove all pinned posts from a user's profile */
async function removeAllPinnedPosts({ userID }) {
    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData || !userData.pins || !userData.pins[0]) return searchErrorV2("C017", { userID });

    await interactUserSchema.findOneAndUpdate({
        _id: userID,
    }, {
        $set: {
            pins: [],
        },
    })

    return { "success": true };
}

async function getUserPins({ ownUser, userData }) {
    var pins = [];
    if (userData.pins && userData.pins.length > 0) {
        for (const pin of userData.pins) {
            const pinData = await getPostWithData({ 
                userID: ownUser._id, 
                postID: pin,
                ownUser
            });

            if (pinData.error) {
                await interactUserSchema.findOneAndUpdate({
                    _id: userData._id,
                }, {
                    $pull: {
                        pins: { _id: pin },
                    },
                })
            }
            
            if (!pinData.error) pins.push(pinData);
        }
    }

    return pins;
}

module.exports = { 
    addPinnedPost,
    removePinnedPost,
    removeAllPinnedPosts,
    getUserPins
}