const interactAlertSystem = require('../../schemas/alerts/interactAlertSystem');
const interactAlertUser = require('../../schemas/alerts/interactAlertUser');
const interactAlertPost = require('../../schemas/alerts/interactAlertPost');
const interactAlertIndex = require('../../schemas/alerts/interactAlertIndex');
const interactAdminSchema = require('../../schemas/admin/interactAdminSchema');
const { v4: uuidv4 } = require('uuid');
const { searchError } = require('../../utils/searchError');
const { checktime } = require('../../utils/checktime');

async function createAlert({userID, alertTitle, alertContent, timeToLive, postID, type}) {
    /* could be changed to by year, or by month */
    if (!alertContent && !userID) return searchError("M001");
    if (!alertContent) return searchError("M002");
    if (!userID) return searchError("M003");

    // check if user is admin
    const isAdmin = await isUserAdimin({userID});
    console.log("ignoring if user is admin for now")
    // if (isAdmin != true) return isAdmin;

    const ending_timestamp = getEndingTime({ timeToLive })
    // create alert
    const newAlertID = await getNewAlertID();
    await interactAlertPost.create({
        _id: newAlertID,
        type: 0,
        title: alertTitle || null,
        content: alertContent,
        publish_timestamp: checktime(),
        ending_timestamp,
        isDeleted: false,
        userID: userID,
        postID: postID || null
    });


    const currentIndexID = await getNewAlertIndexID()
    await addAlertToIndex({alertID: newAlertID, indexID: currentIndexID})

    // index
    // lookup alertsystem with systemID
    // if doesnt exist
        // create a new index,
        // create a new system
    // if it does
        // check if current index has room
        // if doesnt
            // create a new index
            // update system with new index
        // endif
    // endif
    // add alert to index
    // i

    const systemID = "test2"
    // systemID could be changed to work with like groups in the future
    // change to "main" until feature is created
    // check if alert system exists (it should, unless database reset)
    const alertSystem = await interactAlertSystem.findOne({ _id: systemID });
    if (!alertSystem) {
        await interactAlertSystem.create({
            _id: systemID,
            timestamp: checktime(),
            currentAlert: newAlertID,
            currentIndex: currentIndexID
        });
    } else {
        await interactAlertSystem.updateOne({ _id: systemID }, { currentAlert: newAlertID });
    }

    // create index
    
    // fetch alert
    const alert = await getAlert({alertID: newAlertID})
    const system = await interactAlertSystem.findOne({ _id: systemID})
    const index = await interactAlertIndex.findOne({ _id: currentIndexID})
    return {
        success: true,
        alert,
        system,
        index
    }// return the post
}

// timetolive in ms (for now)
function getEndingTime({timeToLive}) {
    if (!timeToLive) {
        return checktime() + 86400000 
    } else {
        return checktime() + timeToLive
    }
}

async function editAlert({alertID, }) {

};

async function dismissAlert({alertID, userID}) {

};

async function deleteAlert({}) {

};

async function getRecentAlerts({}) {

};

async function getAlert({ alertID }) {
    const alert = await checkIfAlertExists({alertID})
    return alert;
}

async function isUserAdimin({userID}) {
    const isAdmin = await interactAdminSchema.findOne({_id: userID});
    if (!isAdmin) return searchError("M004");
    else if (isAdmin.adminType < 2) return searchError("M005");
    else return true;
};

async function getNewAlertID() {
    const newID = uuidv4();
    const exists = await checkIfAlertExists({alertID: newID});
    if (exists?.found == true) return await getNewAlertID();
    else return newID;
};

async function checkIfAlertExists({alertID}) {
    const alert = await interactAlertPost.findOne({_id: alertID});
    if (!alert) return searchError("M006");
    else return {
        found: true,
        alert: alert
    };
};


async function getNewAlertIndexID() {
    const newID = uuidv4();
    const exists = await checkIfIndexExists({alertIndexID: newID});
    if (exists?.found == true) return await getNewAlertIndexID();
    else return newID;
}

async function checkIfIndexExists({alertIndexID}) {
    const alert = await interactAlertPost.findOne({_id: alertIndexID});
    if (!alert) return searchError("M007");
    else return {
        found: true,
        alert: alert
    };
}

async function addAlertToIndex({alertID, indexID}) {
    await interactAlertIndex.findOneAndUpdate(
        { _id: indexID },
        { $push : { "alerts" : { 
            _id: alertID
        }}},
        { upsert: true }
    );
}

async function nextAlertIndex() {

}

module.exports = { createAlert, editAlert, dismissAlert, deleteAlert, getRecentAlerts, getAlert}
