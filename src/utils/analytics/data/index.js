const interactAnalyticUseIndexSchema = require("../../../schemas/analytics/interactAnalyticUseIndexSchema");
const interactAnalyticUseRecordSchema = require("../../../schemas/analytics/interactAnalyticUseRecordSchema");


// get all analytics, and represent old style
async function getAnalyticsV1() {
    /*
    _id
    userConnections
        _id
        timestamp
        api_urlbase
        api_url
    */
    const parsedRecords = [];
    const addedUsers = {};

    const records = await interactAnalyticUseRecordSchema.find();

    records.forEach(record => {
        const { analyticUserID, timestamp, url_base, url_full } = record;
        if (!addedUsers[analyticUserID]) {
            addedUsers[analyticUserID] = true;
            parsedRecords.push({
                _id: analyticUserID,
                userConnections: []
            });
        }
        parsedRecords.forEach(parsedRecord => {
            if (parsedRecord._id === analyticUserID) {
                parsedRecord.userConnections.push({
                    _id: record._id,
                    timestamp,
                    api_urlbase: url_base,
                    api_url: url_full
                });
            }
        });
    });

    // console.log(parsedRecords)
    return parsedRecords;
}

// (1) Connections / User
// (1) Connections / User
// x = users
// y = connections
async function getAnalyticConnectionsPerUser() {
    const indexes = await interactAnalyticUseIndexSchema.find();
    const users = {};

    var totalX = 0;
    var totalY = 0;
    
    const pointsXs = [];
    const pointsYs = [];

    indexes.forEach(index => {
        const { analyticUserID, count } = index;
        totalY += count;

        if (!users[analyticUserID]) users[analyticUserID] = count
        else users[analyticUserID] += count;
    });

    for (const key in users) {
        var value = users[key];
        totalX++;

        pointsXs.push(`User ${totalX}: ${value}`);
        pointsYs.push(value);
    }

    return {
        pointsXs,
        pointsYs,
        totalX,
        totalY,
        ready: true
    };
}

async function getAnalyticConnectionsPerUserPlain() {
    const indexes = await interactAnalyticUseIndexSchema.find();
    const users = {};

    indexes.forEach(index => {
        const { analyticUserID, count } = index;
        if (!users[analyticUserID]) users[analyticUserID] = count;
        else users[analyticUserID] += count;
    });

    return users;
}

module.exports = { getAnalyticsV1, getAnalyticConnectionsPerUser, getAnalyticConnectionsPerUserPlain };
