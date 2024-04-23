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

    var functionPointsXandY = []
    
    var highestx = 0;
    var lowestx = -1;
    var highesty = 0;
    var lowesty = -1;

    const pointsXs = [];
    const pointsYs = [];
    var xDomain = [];
    var yDomain = [];

    var userCount = 0;
    indexes.forEach(index => {
        const { analyticUserID, count } = index;
        console.log(`analyticUserID: ${analyticUserID}, count: ${count}`)
        totalY += count;

        if (!users[analyticUserID]) {
            users[analyticUserID] = count
            totalX += 1;
            userCount++;
        }
        else users[analyticUserID] += count;
    });

    var userCount = 0;

    for (const key in users) {
        var value = users[key];
        userCount++;

        pointsXs.push(`User ${userCount}: ${value}`);
        pointsYs.push(value);

        functionPointsXandY.push([userCount,value]);

        if (highesty < value) {
            highesty = value
        };
    }

    highestx = userCount;
    xDomain = [lowestx, highestx];
    yDomain = [lowesty, highesty];
    
    return {
        pointsXs,
        pointsYs,
        totalX,
        totalY,
        points: functionPointsXandY,
        xDomain,
        yDomain,
        plainData: users,
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
