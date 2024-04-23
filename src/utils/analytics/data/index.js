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

module.exports = { getAnalyticsV1 };
