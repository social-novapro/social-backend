const { getErrorIssues } = require("../errors");
const { getAdminRequests, getAdmins } = require("../util");

async function getAdminDashboard({ adminID }) {
    // check admin user
    var returnData = {
        adminRequests: [],
        verificationRequests: [],
        errors: [],
        admins: [],
        reports: [],
    }

    const adminRequests = await getAdminRequests({adminID});
    if (!adminRequests.error) returnData.adminRequests = adminRequests;

    const admins = await getAdmins({adminID});
    if (!admins.error) returnData.admins = admins;

    const errors = await getErrorIssues({adminID});
    if (!errors.error) returnData.errors = errors;

    return returnData;
}

module.exports = {getAdminDashboard};