const interactSubscribeNotification = require('../../schemas/notifications/interactSubscribeNotification')
const { searchError } = require('../searchError');
const { checktime } = require("../checktime");

/**
 * 
 */
async function delUserSubData({ }) {

}

/**
 * lets user unsubcribe from all users
 */

/** 
 * PUBLIC FUNCTION
 * lets user sub to another user
 */
async function subToUser({ userID, subUserID }) {
    var checkIfSubbed = await lookForSub(subUserID, userID)
    if (checkIfSubbed.found) return { 'error' : "Client was already subscribed to the user."};
    
    await pushToDB({ userID, subUserID });

    var sending = await lookForSub(subUserID, userID)
    if (!sending.found) return searchError("L002");
    else return sending;
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

    if (!subData || !subData[0]) return {"error" : "no subscriptions found"}
    else return subData;
}

/**
 * PUBLIC FUNCTION
 * lets user unsub from a user
 */
async function unsubFromUser({ userID, subUserID }) {
    if (!userID) return;
    if (!subUserID) return;

    var checkIfSubbed = await lookForSub(subUserID, userID)
    if (!checkIfSubbed.found) return { 'error' : "Client was not subscribed to the user. "};

    await pullFromDB({ userID, subUserID});

    var sending = await lookForSub(subUserID, userID)
    if (!sending.found) return { "success" : true, "subdata": checkIfSubbed };
    
    return {"error" : "unknown error while unsubcribing"};
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
    
    if (!Subscribers) return { error: "No subs for user searching."}
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

module.exports = { unsubFromUser, getSubscriptions, subToUser }