const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification')
const { searchErrorV2 } = require('../../searchError');
const { checktime } = require("../../checktime");

/**
 * lets user unsubcribe from all users
 */
async function unsubFromAll({ userID }) {
    const subData = await getSubscriptions({ userID });
    if (subData.error) return subData;

    for (const sub of subData) {
        await unsubFromUser({ userID, subUserID: sub._id });
    }

    return subData;
}

/** 
 * PUBLIC FUNCTION
 * lets user sub to another user
 */
async function subToUser({ userID, subUserID }) {
    var checkIfSubbed = await lookForSub(subUserID, userID)
    if (checkIfSubbed.found) return searchErrorV2("L009", { userID });
    
    await pushToDB({ userID, subUserID });

    var sending = await lookForSub(subUserID, userID)
    if (!sending.found) return searchErrorV2("L002", { userID });
    else return sending;
}

/**
 * PUBLIC FUNCTION
 * returns if user is subbed or not
 */
async function isSubbed({ userID, subUserID }) {
    var checkIfSubbed = await lookForSub(subUserID, userID)
    
    if (!checkIfSubbed.found) return searchErrorV2("L005", { userID });
    else return checkIfSubbed;
}

/**
 * PUBLIC FUNCTION
 * gets all subscriptions from user
 *  later should be replaced to make a new schema where all of the sub data is also there
 */
async function getSubscriptions({ userID }) {
    const subData = await interactSubscribeNotification.find({
        "subscribed._id" : userID,
    });

    if (!subData || !subData[0]) return searchErrorV2("L007", { userID })
    const returnData = [];

    for (const subbed of subData) {
        for (const sub of subbed.subscribed) {
            if (sub._id==userID) {
                returnData.push({
                    _id: subbed._id,
                    subcription: sub
                });
            };
        };
    };
    
    return returnData;
}

/**
 * PUBLIC FUNCTION
 * lets user unsub from a user
 */
async function unsubFromUser({ userID, subUserID }) {
    if (!userID) return;
    if (!subUserID) return;

    var checkIfSubbed = await lookForSub(subUserID, userID)
    if (!checkIfSubbed.found) return searchErrorV2("L005", { userID });

    await pullFromDB({ userID, subUserID});

    var sending = await lookForSub(subUserID, userID)
    if (!sending.found) return { "success" : true, "subdata": checkIfSubbed };
    
    return searchErrorV2("L006", { userID });
}

/**
 * pulls sub from db
 */
async function pullFromDB({ userID, subUserID }) {
    await interactSubscribeNotification.findOneAndUpdate( 
        { _id: subUserID },
        { $pull : { "subscribed" : {  _id: userID, }}},
        { upsert: true }
    );
}

/**
 * pushes sub to db
 */
async function pushToDB({ userID, subUserID }) {
    const savedTimestamp = checktime();
    await interactSubscribeNotification.findOneAndUpdate( 
        { _id: subUserID },
        { $push : { "subscribed" : { 
            _id: userID,
            timestamp: savedTimestamp
        }}},
        { upsert: true }
    );
}

/**
 * look for sub, checks if user is subbed to
 */
async function lookForSub(subUserID, userID) {
    const Subscribers = await interactSubscribeNotification.findOne({ _id: subUserID });
    
    var sending = {
        found: false,
        obj: {}
    };
    
    if (!Subscribers) return searchErrorV2("L008", { userID })
    for (const sub of Subscribers.subscribed) {
        if (sub._id==userID) {
            sending.obj={
                userID: subUserID,
                subcription: sub
            };
            sending.found=true;
        };
    };
    
    return sending 
};

module.exports = { 
    unsubFromUser, 
    getSubscriptions, 
    subToUser, 
    isSubbed, 
    unsubFromAll
}