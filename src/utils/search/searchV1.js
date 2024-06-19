const interactPostSchema = require("../../schemas/interactPostSchema");
const interactUserSchema = require("../../schemas/interactUserSchema");
const { getPostWithData } = require("../post/getPost");
const { searchErrorV2 } = require("../searchError");
const { searchPostTags, searchHashTags } = require("./searchPostTags");
const { lookupUsers } = require("./searchUserTag");

async function searchV1({ lookUpKey, userID }) {
    if (!lookUpKey) return searchErrorV2("U001", { userID: "unknown" });
    if (!userID) return searchErrorV2("U002", { userID: "unknown" });

    const UserData = await interactUserSchema.find();
    const PostData = await interactPostSchema.find();
    const ownUser = await interactUserSchema.findOne({_id: userID});

    const lookUpKeyLower = lookUpKey.toLowerCase();
    const lookupkeysArr = lookUpKeyLower.split(/[ ]+/) 

    const usersFound = await lookupUsers({ userID, lookUpKey, lookUpKeyLower, UserData });

    var postsFound = [];
    for (post of PostData) {
        if (post.content) {
            content = post.content.toLowerCase();

            if (content.toLowerCase().startsWith(lookUpKeyLower) || lookUpKey == post._id) {
                const fullPost = await getPostWithData({ userID: userID, post, ownUser });
                if (!fullPost.error) postsFound.push(fullPost);
            };
        };
    };

    const tagsFound = await searchPostTags(userID, lookupkeysArr);
    var hashtagsFound = []
    if (lookUpKey.startsWith("#")) {
        hashtagsFound = await searchHashTags({ userID, text: lookUpKey });
    }
    
    var found = {
        usersFound,
        postsFound, 
        tagsFound,
        hashtagsFound
    };

    console.log('done search')
    return found;
}

module.exports = {
    searchV1
}