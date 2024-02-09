const interactAdminRequestSchema = require("../../schemas/admin/interactAdminRequestSchema");
const interactAdminSchema = require("../../schemas/admin/interactAdminSchema");
const { checktime } = require("../checktime");
const { v4: uuidv4 } = require('uuid');
const { isUserAdmin } = require("./isAdminUser");


// gets all admin requests
async function getAdminRequests({ adminID }) {
    const isAdmin = await isUserAdmin({ adminID });
    if (!isAdmin.admin || isAdmin.error) return { error: true };
    if (isAdmin.adminType < 2) return { error: true };

    const foundRequests = await interactAdminRequestSchema.find();
    if (!foundRequests) return { error: true };

    return foundRequests;
}

async function respondAdminRequest({ adminID, requestID, status }) {
    const isAdmin = await isUserAdmin({ adminID });
    if (!isAdmin.admin || isAdmin.error) return { error: true };

    const foundRequest = await interactAdminRequestSchema.findOne({ _id: requestID });
    if (!foundRequest) return { error: true };

    if (status === "approve") {
        await interactAdminRequestSchema.findOneAndUpdate({
            _id: requestID,
        }, {
            status: 2,
            acceptedBy: adminID,
            acceptedTimestamp: checktime(),
        });

        const addedAdmin = await userAddAdmin({ adminID: foundRequest.userID, adminType: foundRequest.adminType });
        if (addedAdmin.error) return addedAdmin;

        return addedAdmin;
    } else if (status === "deny") {
        const dismissed = await interactAdminRequestSchema.findOneAndUpdate({
            _id: requestID,
        }, {
            acceptedBy: adminID,
            acceptedTimestamp: checktime(),
            status: 1,
        });

        return dismissed;
    } else return { error: true };
}

async function requestAdmin({ userID, content }) {
    if (!content) return { error: true };
    const isAdmin = await isUserAdmin({ adminID: userID });
    if (isAdmin.admin || !isAdmin.error) return { error: true };
    
    const foundReq = await interactAdminRequestSchema.findOne({ userID });
    if (foundReq) return { error: true };

    await interactAdminRequestSchema.create({
        _id: uuidv4(),
        userID: userID,
        content: content,
        timestamp: checktime(),
        adminType: 1,
        status: 0,
    });

    const savedRequest = await interactAdminRequestSchema.findOne({ _id: userID });
    
    if (!savedRequest) return { error: true };
    return savedRequest;
}

async function userAddAdmin({ adminID, adminType }) {
    const isAdmin = await isUserAdmin({ adminID });
    if (!isAdmin.admin || isAdmin.error) return { error: true };

    await interactAdminSchema.create({
        _id: uuidv4(),
        userID: adminID,
        adminType: adminType,
        timestamp: checktime()
    });

    const savedAdmin = await interactAdminSchema.findOne({ _id: adminID });
    if (!savedAdmin) return { error: true };
    return savedAdmin;
}

async function getAdmins({ adminID }) {
    const isAdmin = await isUserAdmin({ adminID });
    if (!isAdmin.admin || isAdmin.error) return { error: true };

    const foundAdmins = await interactAdminSchema.find();
    if (!foundAdmins) return { error: true };

    const returningAdmins = [];

    foundAdmins.forEach(async (admin) => {
        const foundUser = await interactUserSchema.findOne({ _id: admin.userID });
        if (foundUser) {
            returningAdmins.push({
                userData: foundUser,
                adminData: admin,
            });
        };
    });

    return returningAdmins;
}

module.exports = {
    getAdminRequests,
    requestAdmin,
    respondAdminRequest,
    getAdmins
}