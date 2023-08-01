const developerAppToken = require("../../../schemas/developer/developerAppToken");
const developerToken = require("../../../schemas/developer/developerToken");
const interactUserAccessSchema = require("../../../schemas/interactUserAccessSchema");
const interactUserPrivSchema = require("../../../schemas/interactUserPrivSchema");
const { searchError } = require("../../searchError");

/**
 * get all access tokens from a client
 */
async function getAccessTokens({ userID }) {
    const accesses = await interactUserAccessSchema.find({ userID: userID });
    return accesses;
}

/**
 * get all app tokens from a deveoper
 */
async function getAppTokens({ userID }) {
    const apps = await developerAppToken.find({ userID });
    return apps;
}

/**
 * delete accesses from client 
 */
async function deleteUserAccesses({ userID }) {
    const accessesFound = await getAccessTokens({ userID });
    if (!accessesFound) return null;
    const deletedAccesses = [];

    for (const access of accessesFound) {
        const deletedAccess = await deleteAccessToken({ accessToken: access._id })
        deletedAccesses.push(deletedAccess);
    }

    return deletedAccesses;
}

/**
 * get assigned access tokens from given app token
 */
async function deleteAccessTokensFromApp({ appToken }) {
    const foundAll = await interactUserAccessSchema.find({ appToken });
    if (!foundAll) return null;

    const deletedAccesses = []
    for (const found of foundAll) {
        const delAccess = await deleteAccessToken({ accessToken: found._id });
        deletedAccesses.push(delAccess)
    }

    // maybe dont return this, as there is a usertoken assigned to each access
    // but account is still safe as access was deleted
    return deletedAccesses;
}

/**
 * delete access token
 */
async function deleteAccessToken({ accessToken }) {
    var accessDel = await interactUserAccessSchema.findOneAndDelete({ _id: accessToken });
    accessDel.userToken = null;
    // clear the usertoken from returning hopefully
    return accessDel;
}

/**
 * delete app token
 */
async function deleteAppToken({ appToken }) {
    const appTokenData = await developerAppToken.findOneAndDelete({ _id: appToken });

    const accessTokensData = await deleteAccessTokensFromApp({ appToken });

    return { appTokenData, accessTokensData};
}

/**
 * delete developer token
 */
async function deleteDevToken({ devToken }) {
    const devTokenData = await developerToken.findOneAndDelete({ _id: devToken});
    return devTokenData;
}

/**
 * delete developer app tokens
 */
async function deleteDevAppTokens({ devToken }) {
    const devApps = await developerAppToken.find({ devToken });
    const devAppData = []
    for (const app of devApps) {
        const data = await deleteAppToken({ appToken: app._id });
        devAppData.push(data);
    }
    return devAppData;
}
/**
 * delete dev account
 */
async function deleteDevAcc({ userID }) {
    const userPrivFound = await interactUserPrivSchema.findOne({ _id: userID });
    if (userPrivFound.devToken == null) return searchError("A012");

    // user is dev
    // find and remove all apps (and accesses)user created
    const devTokenDel = await deleteDevToken({ devToken: userPrivFound.devToken });
    const devAppsDel = await deleteDevAppTokens({ devToken: userPrivFound.devToken });


    // remove devToken from userPriv
    const updatedPrivUser = await interactUserPrivSchema.findOneAndUpdate({ 
        _id: userID 
    }, { 
        devToken: null 
    });

    return {
        devTokenDel,
        devAppsDel,
        userPriv: userPrivFound,
        updatedPrivUser
    }

}

module.exports = { deleteDevAcc, getAccessTokens, getAppTokens, deleteUserAccesses, deleteAccessToken, deleteAppToken, deleteDevToken }