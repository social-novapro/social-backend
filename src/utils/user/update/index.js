const options = require('./options');
const { searchErrorV2 } = require('../../../utils/searchError');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserUpdateSchema = require('../../../schemas/user/interactUserUpdateSchema');
const { checkUsername } = require('../../checks');
const { checktime } = require('../../checktime');

validField({ userID: "userID", field: "newUsername" });
validField({ userID: "userID", field: "username" });

async function validField({ userID, field }) {
    for (const option of options.options) {
        if (option.dbName === field) return true
    };

    return searchErrorV2("C031", { userID, options: [{ name: "reason", data: "field was invalid." }] });
}

async function getCurrentUserUpdate({ userID }) {
    /*
    fields
    [{
        ...option
        currentValue:
    }]
    */
    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData) return searchErrorV2("C032", { userID });
    
    const userUpdates = await formatUserData({ userID, userData });

    return userUpdates;
};

async function formatUserData({ userID, userData }) {
    if (!userData) return searchErrorV2("C032", { userID });
    const fields = [];
    
    for (const option of options.options) {
        fields.push({
            ...option,
            currentValue: userData[option.dbName]
        });
    };

    return fields;
}

// make sure field exists
// make sure no duplicate fields
// check if field was updated in the last 10 minutes
async function userUpdate({ userID, body }) {
    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData) return searchErrorV2("C032", { userID });

    const prevUpdates = await formatUserData({ userID, userData });
    const fails = [];
    const toUpdates = [];
    // arr = { field: "", value: "" }

    for (const field in body) {
        console.log(field)
        const validated = await validField({ userID, field });
        if (validated.error) {
            // non valid field
            fails.push({
                field,
                error: validated
            });
            continue;
        };

        if (prevUpdates[field] && prevUpdates === body[field]) {
            // no need to update
            continue;
        }

        // update field
        

        toUpdates.push({"field": field, "value": body[field]});
        // await lastUpdatedField({ userID, field });
    }

    // updates
    const acceptedChanges = [];
    for (const update of toUpdates) {
        // step 1 - make sure not updated recently
        const lastUpdate = await lastUpdatedField({ userID, field: update.field });
        if (lastUpdate.error) {
            fails.push(lastUpdate);
            continue;
        }
        // step 2 - validate update
        const validatedUpdate = await validateNewUpdate({ userID, update });
        if (validatedUpdate.error) {
            fails.push(validatedUpdate);
            continue;
        }
        // step 3 - update user record
        
        // step 4 - create update record
        acceptedChanges.push(update);
    }

    return {
        "success": true,
        "partialSuccess": false,
        "fails": fails,
        "updated": acceptedChanges
    }
}

async function validateNewUpdate({ userID, update }) {
    if (update.field == "username") {
        const checkedUser = await checkUsername(update.value);
        if (checkedUser.error) {
            return searchErrorV2("C031", { userID, options: [{ name: "reason", data: `username was ${checkedUser.reason}.`}] });
        }
    } else if (update.field == "displayName") {
        
    } else if (update.field == "description") {
    } else if (update.field == "userAge") {
    } else if (update.field == "pronouns") {
    } else if (update.field == "profileURL") {
    } else if (update.field == "statusTitle") {
    }

    return {
        allowed: true
    }
};

function timesince(currenttime, timestamp) {
    const timediff = currenttime - timestamp;
    const firstMinutes = Math.floor(timediff / 60000) % 60;
    const firstSeconds = Math.floor(timediff / 1000) % 60;

    const minutes = 29 - firstMinutes;
    const seconds = 59 - firstSeconds;

    var timeuntil;
    if (!minutes) timeuntil = `${seconds} seconds`;
    else timeuntil = `${minutes} minutes and ${seconds} seconds`;

    return timeuntil;
}
async function lastUpdatedField({ userID, field }) {
    // if timediff < 1800000 
    const updateRecord = await findUpdateRecord({ userID, field });
    if (!updateRecord) return {allowed: true};
    
    const currenttime = checktime();
    if ((currenttime - updateRecord.timestamp) < 1800000) {
        return searchErrorV2("E004", { userID,  options: [{ 
            name: "time", data: timesince(currenttime, updateRecord.timestamp)
        }, {
            name: "field", data: field 
        }]});
    }
    return {allowed: true};
}
async function findUpdateRecord({ userID, field }) {
    const updateRecord = await interactUserUpdateSchema.findOne({
        userID,
        field,
        current: true
    });

    return updateRecord;
}

async function createUpdateRecord({ userID, field, value }) {
    // const updateRecord = {
    //     userID,
    //     field,
    //     value,
    //     timestamp: checktime()
    // };

    return updateRecord;
}

// async function updateUsername() {

// }

// async function updateDisplayName() {

// }

// async function updateDescription() {

// }

// async function updateUserAge() {

// }

// async function updatePronouns() {

// }



module.exports = { 
    userUpdate,
    getCurrentUserUpdate
};