const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");

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

    const newProfile = await interactUserSchema.findOne({ _id: userID });
    return newProfile;
}

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

    const newProfile = await interactUserSchema.findOne({ _id: userID });
    return newProfile;
}

async function checkIfPinned({ pinsFound, postID }) {
    if (!pinsFound || !pinsFound[0]) return false;
    const pingFound = pinsFound.filter(pin => pin._id === postID);
    if (!pingFound) return false;
    return true;
}

module.exports = { 
    addPinnedPost,
    removePinnedPost,
}