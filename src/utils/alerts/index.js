const interactAlertSystem = require('../../schemas/alerts/interactAlertSystem');
const interactAlertUser = require('../../schemas/alerts/interactAlertUser');
const interactAlertPost = require('../../schemas/alerts/interactAlertPost');
const interactAlertIndex = require('../../schemas/alerts/interactAlertIndex');
const interactAdminSchema = require('../../schemas/admin/interactAdminSchema');
const { v4: uuidv4 } = require('uuid');
const { searchError } = require('../../utils/searchError');
const { checktime } = require('../../utils/checktime');
const { getPostWithData } = require('../../utils/post/getPost');

const mainSystemID = "test2"

async function createAlert({userID, alertTitle, alertContent, timeToLive, postID, systemID, type}) {
    /* could be changed to by year, or by month */
    if (!alertContent && !userID) return searchError("M001");
    if (!alertContent) return searchError("M002");
    if (!userID) return searchError("M003");


    var usingPostID = false;
    // check if postID exists
    if (postID) {
        const foundPost = await getPostWithData({postID})
        
        if (!foundPost.error) usingPostID = true;
    }


    // check if user is admin
    const isAdmin = await isUserAdimin({userID});
    console.log("ignoring if user is admin for now")
    // if (isAdmin != true) return isAdmin;

    const ending_timestamp = getEndingTime({ timeToLive })
    // create alert

    const currentIndex = await getCurrentIndex({ systemID })
    //console.log(currentIndexID)
    //const currentIndexID = await getNewAlertIndexID()
    // if its over 50 make new index


    const newAlertID = await getNewAlertID();
    await interactAlertPost.create({
        _id: newAlertID,
        type: 0,
        title: alertTitle || null,
        indexID: currentIndex._id,
        content: alertContent,
        publish_timestamp: checktime(),
        ending_timestamp,
        systemID: systemID || mainSystemID,
        isArchived: false,
        userID: userID,
        postID: postID || null
    });


    await addAlertToIndex({alertID: newAlertID, indexID: currentIndex._id})

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

    // systemID could be changed to work with like groups in the future
    // change to "main" until feature is created
    // check if alert system exists (it should, unless database reset)

    const alertSystem = await interactAlertSystem.findOne({ _id: systemID || mainSystemID });
    if (!alertSystem) {
        await interactAlertSystem.create({
            _id: systemID || mainSystemID,
            timestamp: checktime(),
            currentAlert: newAlertID,
            currentIndex: currentIndex._id
        });
    } else {
        await interactAlertSystem.updateOne({ _id: systemID || mainSystemID}, { currentAlert: newAlertID });
    }

    // create index
    
    // fetch alert
    const alert = await getAlert({alertID: newAlertID})
    const system = await interactAlertSystem.findOne({ _id: systemID})
    const index = await interactAlertIndex.findOne({ _id: currentIndex._id})
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

// can be done by any admin 
async function editAlert({alertID }) {
    const isAdmin = await isUserAdimin({userID});
    // if (isAdmin != true) return isAdmin;

    const alertExists = await checkIfAlertExists({alertID})
    if (!alertExists.found) return alertExists;

    await interactAlertPost.findOneAndUpdate({
        _id: alertID
    },{
        lastEdited: checktime()
    }, {
        upsert: true
    });

    return {
        success: true,
        oldAlert: alertExists.alert,
        newAlert: await getAlert({alertID})
    };
};

async function dismissAlert({ alertID, userID }) {
    const alertExists = await checkIfAlertExists({ alertID })
    if (!alertExists.found) return alertExists;

    // not done
}

// can be done by any admin
async function archiveAlert({ alertID, userID }) {
    const isAdmin = await isUserAdimin({userID});
    // if (isAdmin != true) return isAdmin;

    const alertExists = await checkIfAlertExists({ alertID })
    if (!alertExists.found) return alertExists;

    const system = await interactAlertSystem.findOne({ _id: alertExists.alert.systemID });
    if (!system) return searchError("M010");
    else if (system.currentAlert == alertID) {
        await interactAlertSystem.findOneAndUpdate({
            _id: alertExists.alert.systemID
        },{
            currentAlert: null
        }, {
            upsert: true
        });
    }

    await interactAlertPost.findOneAndUpdate({
        _id: alertID
    },{
        isArchived: true,
        archived_timestamp: checktime()
    }, {
        upsert: true
    });

    const newAlert = await interactAlertPost.findOne({ _id: alertID })

    return {
        sucess: true,
        before: alertExists.alert,
        after: newAlert
    }
};

// can only be done within 30 minutes of creation
async function deleteAlert({ alertID, userID }) { 
    const isAdmin = await isUserAdimin({userID});
    // if (isAdmin != true) return isAdmin;

    const alertExists = await checkIfAlertExists({alertID});
    if (!alertExists.found) return alertExists;

    // not from same user
    if (alertExists.alert.userID != userID) return searchError("M008");

    // 30 minutes
    if (alertExists.alert.publish_timestamp + 1800000 < checktime()) return searchError("M009");

    await interactAlertPost.findOneAndDelete({
        _id: alertID
    });

    return alertExists.alert;
};

/* get current alert */
async function getCurrentAlert({ systemID }) {
    const system = await interactAlertSystem.findOne({ _id: systemID || mainSystemID });
    if (!system) return searchError("M010");
    if (!system.currentAlert) return searchError("M011")

    const alert = await interactAlertPost.findOne({ _id: system.currentAlert });
    if (!alert) return searchError("M006");

    return {
        success: true,
        alert
    };
}

/* get current index of alert*/
async function getCurrentIndex({ systemID }) {
    const system = await interactAlertSystem.findOne({ _id: systemID || mainSystemID });
    if (!system) return searchError("M010");
    if (!system.currentIndex) return searchError("M011")

    const index = await interactAlertIndex.findOne({ _id: system.currentIndex });
    if (!index) return searchError("M007");
    return index;
};

async function getCurrentFullIndex({ systemID }) {
    const system = await interactAlertSystem.findOne({ _id: systemID || mainSystemID });
    if (!system) return searchError("M010");
    if (!system.currentIndex) return searchError("M011")

    const index = await interactAlertIndex.findOne({ _id: system.currentIndex });
    if (!index) return searchError("M007");

    const alerts = []
    for (let i = 0; i < index.alerts.length; i++) {
        const alert = await interactAlertPost.findOne({ _id: index.alerts[i]._id });
        if (alert) alerts.push(alert)
    }

    return {
        _id: index._id,
        previousIndex: index.previousIndex || null,
        nextIndex: index.nextIndex || null,
        alerts
    }
};

/* get alerts by id */
async function getAlert({ alertID }) {
    const alert = await checkIfAlertExists({alertID})
    return alert;
}

/* spec that is allowed to post and edit alerts */
async function isUserAdimin({userID}) {
    const isAdmin = await interactAdminSchema.findOne({_id: userID});
    if (!isAdmin) return searchError("M004");
    else if (isAdmin.adminType < 2) return searchError("M005");
    else return true;
};

/* get new alert id */
async function getNewAlertID() {
    const newID = uuidv4();
    const exists = await checkIfAlertExists({alertID: newID});
    if (exists?.found == true) return await getNewAlertID();
    else return newID;
};

/* check if alert exists */
async function checkIfAlertExists({alertID}) {
    const alert = await interactAlertPost.findOne({_id: alertID});
    if (!alert) return searchError("M006");
    else return {
        found: true,
        alert: alert
    };
};

/* get new alert index id */
async function getNewAlertIndexID() {
    const newID = uuidv4();
    const exists = await checkIfIndexExists({alertIndexID: newID});
    if (exists?.found == true) return await getNewAlertIndexID();
    else return newID;
}

/* check if index exists */
async function checkIfIndexExists({alertIndexID}) {
    const alert = await interactAlertPost.findOne({_id: alertIndexID});
    if (!alert) return searchError("M007");
    else return {
        found: true,
        alert: alert
    };
}

/* add alert to index */
async function addAlertToIndex({alertID, indexID}) {
    await interactAlertIndex.findOneAndUpdate(
        { _id: indexID },
        { $push : { "alerts" : { 
            _id: alertID
        }}},
        { upsert: true }
    );
}

module.exports = { 
    createAlert, 
    editAlert, 
    dismissAlert, 
    deleteAlert, 
    archiveAlert,
    getCurrentAlert,
    getCurrentIndex, 
    getCurrentFullIndex,
    getAlert
};
