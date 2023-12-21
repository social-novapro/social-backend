const interactAdminRequestSchema = require("../../../../schemas/admin/interactAdminRequestSchema");
const interactUserAnalyticSchema = require("../../../../schemas/analytics/interactUserAnalyticSchema");
const developerAppToken = require("../../../../schemas/developer/developerAppToken");

async function updateAllTimestamps() {
    return { done: true };

    // developerAppToken
    const devApps = await developerAppToken.find();
    for (const app of devApps) {
        if (!app.devToken) {
            await developerAppToken.findOneAndDelete({ _id: app._id });
            continue;
        }
        if (!app.creationTimestamp) continue;
        app.creationTimestamp = convertStringToNumber(app.creationTimestamp);
        await developerAppToken.findOneAndUpdate({ _id: app._id }, { creationTimestamp: app.creationTimestamp });
    }
    
    // interactAdminRequestSchema
    const adminRequestSchema = await interactAdminRequestSchema.find()
    for (const request of adminRequestSchema) {
        request.timestamp = convertStringToNumber(request.timestamp);
        request.acceptedTimestamp = convertStringToNumber(request.acceptedTimestamp);
        await request.save();
    }

    // interactUserAnalyticSchema
    const userAnalyticSchema = await interactUserAnalyticSchema.find()
    for (const user of userAnalyticSchema) {
        for (var i = 0; i < user.userConnections.length; i++) {
            const connection = user.userConnections[i];
            if (!connection.timestamp) connection.timestamp = checktime();
            else connection.timestamp = convertStringToNumber(connection.timestamp);
            if (!connection.api_urlbase) connection.api_urlbase = "https://interact.novapro.net/";
            if (!connection.api_url) connection.api_url = "https://interact.novapro.net/";
        }
       
        await interactUserAnalyticSchema.findOneAndUpdate({ _id: user._id }, { userConnections: user.userConnections });
    }
}

async function undoAllTimestamps() {
    return { done: true };

    // developerAppToken
    const devApps = await developerAppToken.find();
    for (const app of devApps) {
        if (!app.devToken) {
            await developerAppToken.findOneAndDelete({ _id: app._id });
            continue;
        }

        if (!app.creationTimestamp) continue;
        app.creationTimestamp = convertNumberToString(app.creationTimestamp);
        await developerAppToken.findOneAndUpdate({ _id: app._id }, { creationTimestamp: app.creationTimestamp });
    }

    // interactAdminRequestSchema
    const adminRequestSchema = await interactAdminRequestSchema.find()
    for (const request of adminRequestSchema) {
        request.timestamp = convertNumberToString(request.timestamp);
        request.acceptedTimestamp = convertNumberToString(request.acceptedTimestamp);
        await request.save();
    }

    // interactUserAnalyticSchema
    const userAnalyticSchema = await interactUserAnalyticSchema.find()
    for (const user of userAnalyticSchema) {
        for (const connection of user.userConnections) {
            if (!connection.timestamp) connection.timestamp = convertNumberToString(checktime());
            else connection.timestamp = convertNumberToString(connection.timestamp);
            if (!connection.api_urlbase) connection.api_urlbase = "https://interact.novapro.net/";
            if (!connection.api_url) connection.api_url = "https://interact.novapro.net/";
        }

        await interactUserAnalyticSchema.findOneAndUpdate({ _id: user._id }, { userConnections: user.userConnections });
    }
}

function convertStringToNumber(timestamp) {
    return Number(timestamp);
}
function convertNumberToString(timestamp) {
    return String(timestamp);
}

module.exports = { 
    updateAllTimestamps,
    undoAllTimestamps,
}
