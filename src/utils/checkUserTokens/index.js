const interactUserPrivSchema = require('../../schemas/interactUserPrivSchema');
const interactUserAccessSchema = require('../../schemas/interactUserAccessSchema');
const { searchErrorV2 } = require('../searchError');

async function checkUserTokens(userID, userToken, accessToken, appToken) {
    if (!userID && !userToken && !accessToken) return { "authorized": false, "error" : searchErrorV2("B005", { userID }) };
    if (!userID && !userToken) return { "authorized": false, "error" : searchErrorV2("B006", { userID }) };
    if (!userID && !accessToken) return { "authorized": false, "error" : searchErrorV2("B007", { userID }) };
    if (!userToken && !accessToken) return { "authorized": false, "error" : searchErrorV2("B008", { userID }) };
    if (!userID) return { "authorized": false, "error" : searchErrorV2("B009", { userID }) };
    if (!userToken) return { "authorized": false, "error" : searchErrorV2("B010", { userID }) };
    if (!accessToken) return { "authorized": false, "error" : searchErrorV2("B011", { userID }) };

    const checkPrivUser = await interactUserPrivSchema.findOne({_id: userID});
    if (!checkPrivUser) return { "authorized": false, "error" : searchErrorV2("B001", { userID }) };
    
    const foundAccessToken = await interactUserAccessSchema.findOne({ appToken, userID, userToken });
    if (!foundAccessToken) return { "authorized": false, "error" : searchErrorV2("B013", { userID }) };

    const userTokenCorrect = (checkPrivUser.userToken === userToken);
    const accessTokenCorrect = (foundAccessToken._id === accessToken);

    if (!userTokenCorrect && !accessTokenCorrect) return { "authorized": false, "error" : searchErrorV2("B002", { userID }) };
    else if (!userTokenCorrect) return { "authorized": false, "error" : searchErrorV2("B003", { userID }) };
    else if (!accessTokenCorrect) return { "authorized": false, "error" : searchErrorV2("B004", { userID })};
    
    return { "authorized": true };
}

module.exports = { checkUserTokens };
