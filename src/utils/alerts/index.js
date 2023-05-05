const interactAlertSystem = require('../../schemas/alerts/interactAlertSystem');
const interactAlertUser = require('../../schemas/alerts/interactAlertUser');
const interactAlertPost = require('../../schemas/alerts/interactAlertPost');
const interactAlertIndex = require('../../schemas/alerts/interactAlertIndex');
const interactAdminSchema = require('../../schemas/admin/interactAdminSchema');
const { v4: uuidv4 } = require('uuid');
const { searchError } = require('../../utils/searchError');
const { checktime } = require('../../utils/checktime');

async function createAlert({userID, alertContent, timeToLive, postID, type}) {
    /* could be changed to by year, or by month */
    if (!alertContent && !userID) return searchError("M001");
    if (!alertContent) return searchError("M002");
    if (!userID) return searchError("M003");

    // check if user is admin
    const isAdmin = await isUserAdimin({userID});
    if (isAdmin != true) return isAdmin;

    // create alert
    const newAlertID = await getNewAlertID();
    await interactAlertPost.create({
        _id: newAlertID,
        type: 0,
    });

    // check if alert system exists (it should, unless database reset)
    const alertSystem = await interactAlertSystem.findOne({ _id: "main" });
    if (!alertSystem) {
        await interactAlertSystem.create({
            _id: "main",
            timestamp: checktime(),
            currentAlert: newAlertID,
        });
    } else {
        await interactAlertSystem.updateOne({ _id: "main" }, { currentAlert: newAlertID });
    }
    

}

async function editAlert({}) {

};

async function dismissAlert({alertID, userID}) {

};

async function deleteAlert({}) {

};

async function getRecentAlerts({}) {

};

async function isUserAdimin({userID}) {
    const isAdmin = await interactAdminSchema.findOne({_id: userID});
    if (!isAdmin) return searchError("M004");
    else if (isAdmin.adminType < 2) return searchError("M005");
    else return true;
};

async function getNewAlertID() {
    const newID = uuidv4();
    const exists = checkIfAlertExists({alertID: newID});
    if (exists?.found == true) return getNewAlertID();
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
