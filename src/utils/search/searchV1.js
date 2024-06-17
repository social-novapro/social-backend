const interactPostSchema = require("../../schemas/interactPostSchema");
const interactUserSchema = require("../../schemas/interactUserSchema");
const { getPostWithData } = require("../post/getPost");
const { getPrivacySetting } = require("../privacy");
const { searchErrorV2 } = require("../searchError");
const { getUserRelation } = require("../user/relations");
const { searchPostTags } = require("./searchPostTags");

async function searchV1({ lookUpKey, userID }) {
    if (!lookUpKey) return searchErrorV2("U001", { userID: "unknown" });
    if (!userID) return searchErrorV2("U002", { userID: "unknown" });

    const UserData = await interactUserSchema.find();
    const PostData = await interactPostSchema.find();
    const ownUser = await interactUserSchema.findOne({_id: userID});

    const lookUpKeyLower = lookUpKey.toLowerCase();
    const lookupkeysArr = lookUpKeyLower.split(/[ ]+/) 

    var usersFound = [];

    for (user of UserData) {
        var username;
        var displayname;

        const userPrivacy = await getPrivacySetting({ userID: user._id, privacy: "profile" });
        if (userPrivacy == 4 && user._id != userID) continue;

        if (userPrivacy == 3) { 
            const userRelation = await getUserRelation({ userID, otherUserID: userID });
            if (userRelation.privacyCode != 3 || userRelation.privacyCode != 4 ) continue;
        }
    
        if (lookUpKey == user._id) usersFound.push(user);
        else if (user.username && user.displayName) {
            username = user.username.toLowerCase();
            displayname = user.displayName.toLowerCase();

            if (username.startsWith(lookUpKeyLower) && displayname.startsWith(lookUpKeyLower)) usersFound.push(user);
            else if (username.startsWith(lookUpKeyLower)) usersFound.push(user);
            else if (displayname.startsWith(lookUpKeyLower)) usersFound.push(user);
        } else if (user.username) {
            username = user.username.toLowerCase();
            if (username.startsWith(lookUpKeyLower)) usersFound.push(user);
        } else if (user.displayName) {
            displayname = user.username.toLowerCase();

            if (displayname.startsWith(lookUpKeyLower)) usersFound.push(user);
        };
    };

    var postsFound = [];
    for (post of PostData) {
        var username;
        var displayname;
        if (post.content) {
            content = post.content.toLowerCase();

            if (content.toLowerCase().startsWith(lookUpKeyLower) || lookUpKey == post._id) {
                const fullPost = await getPostWithData({ userID: userID, post, ownUser });
                if (!fullPost.error) postsFound.push(fullPost);
            };
        };
    };

    var tagsFound = await searchPostTags(userID, lookupkeysArr);
    
    var found = {
        usersFound,
        postsFound, 
        tagsFound
    };

    console.log(found)
    console.log(found.postsFound[0])

    console.log('done search')
    return found;
}

module.exports = {
    searchV1
}