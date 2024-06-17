const {v4 : uuidv4} = require('uuid');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const interactUserAccessSchema = require('../../../schemas/interactUserAccessSchema');
const { SCHEMA_VERSIONS } = require('../../../../config.json');
const { checktime } = require('../../checktime');
const { createAccessToken } = require('../createAccessToken');
const { setPassword } = require('../../userAuth');
const { awardUserBadge } = require('../badges');

async function newUUID(usage, userID) {
    const newID = uuidv4();
    switch (usage) {
        case "userID":
            return doubleCheckNewID(newID);
        case "userToken":
            return doubleCheckNewID(newID);
        case "accessToken":
            return doubleCheckNewAccessToken(newID, userID);
        default:
            console.log("Default");
            break;
    };
};

async function doubleCheckNewID(newID) {
    result = await interactUserSchema.findOne({ _id: newID });
    if (result) return newUUID("userID");
    else return newID;
};

async function newUserIndex(newUserDataForEntry) {
    var { username, displayName, password, description, pronouns, statusTitle, devToken, appToken } = newUserDataForEntry;

    const userID = await newUUID("userID");
    const userToken = await newUUID("userToken");
    const currentTime = checktime();

    await interactUserPrivSchema.findOneAndUpdate({
        _id: userID
    }, {        
        _id: userID,
        __v: SCHEMA_VERSIONS.interactUserPrivSchema,
        userToken,
    }, {
        upsert: true
    });

    const setPass = await setPassword({ userID, password });
    if (setPass.error) return setPass;

    await createAccessToken(userID, userToken, appToken);
    
    if (!description) description = `${username} is new to Interact, make sure to say hello!`;

    await interactUserSchema.findOneAndUpdate({
        _id: userID
    }, {        
        _id: userID,
        __v: SCHEMA_VERSIONS.interactUserSchema,
        username,
        usernameLc: username.toLowerCase(),
        lastEditUsername: currentTime,
        displayName,
        description, 
        pronouns,
        statusTitle,
        lastEditDisplayname: currentTime,
        creationTimestamp: currentTime,
        followerCount: 0,
        followingCount: 0,
        likeCount: 0,
        likedCount: 0,
        totalPosts: 0,
        totalReplies: 0
    }, {
        upsert: true
    });

    await awardUserBadge({ userID, badgeID: "interact_user" });

    return userID;
};

module.exports = { newUserIndex };