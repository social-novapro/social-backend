const { v4: uuidv4 } = require('uuid');
const options = require('./options.json');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserUpdateSchema = require('../../../schemas/user/interactUserUpdateSchema');
const { searchErrorV2 } = require('../../../utils/searchError');
const { checkUsername, checkUserage } = require('../../checks');
const { checktime } = require('../../checktime');
const { checkSafeURL } = require('../../checkSafeURL');

async function validField({ userID, field }) {
    for (const option of options.options) {
        if (option.dbName === field) return option
    };

    return searchErrorV2("C031", { userID, options: [{ name: "field", data: field }, { name: "reason", data: "field does not exist." }] });
}

async function getCurrentUserUpdate({ userID }) {
    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData) return searchErrorV2("C032", { userID });
    
    const userUpdates = await formatUserData({ userID, userData });

    return userUpdates;
};

async function formatUserData({ userID, userData }) {
    if (!userData) return searchErrorV2("C032", { userID });
    const fields = [];
    
    for (const option of options.options) {
        // currentValueString, currentValueDate
        var pushValue = {
            ...option,
            currentValue: userData[option.dbName],
            currentValueString: null,
            currentValueDate: null
        };

        if (option.type === "String") {
            pushValue.currentValueString = userData[option.dbName];
        } else if (option.type === "Date") {
            pushValue.currentValueDate = userData[option.dbName];
        }

        fields.push(pushValue);
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
    const noUpdates = [];
    const invalidFields = [];
    // arr = { field: "", value: "" }

    for (const field in body) {
        const validated = await validField({ userID, field });
        // step 0 - make sure in correct format and no error
        
        if (validated.error) {
            // non valid field
            invalidFields.push({
                field,
                ...validated
            });
            continue;
        } else if (validated.type === "String" && typeof body[field] !== "string") {
            fails.push({
                field,
                ...searchErrorV2("C031", { userID, options: [{ name: "field", data: field }, { name: "reason", data: "field is not a string." }] })
            });
            continue;
        } else if (validated.type === "Date" && (isNaN(body[field]))) {
            fails.push({
                field,
                ...searchErrorV2("C031", { userID, options: [{ name: "field", data: field }, { name: "reason", data: "field is not a number." }] })
            });
            continue;
        }

        // step 1 - make sure its not the same as the current value
        const prevUpdate = prevUpdates.find(update => update.dbName === field);
        if (prevUpdate && prevUpdate.currentValue === body[field]) {
            // no need to update
            noUpdates.push({
                field,
                value: body[field]
            });
            continue;
        }
    
        // update field
        // push to {valueString, valueDate, valuePrevString, valuePrevDate}
        if (validated.type === "String") {
            toUpdates.push({
                "field": field,
                "value": body[field],
                "prevValue": prevUpdate.currentValue,
                type: validated.type,
                "valueString": body[field],
                "valuePrevString": prevUpdate.currentValue
            })
        } else if (validated.type === "Date") {
            toUpdates.push({
                "field": field,
                "value": Number(body[field]),
                "prevValue": prevUpdate.currentValue,
                type: validated.type,
                "valueDate": Number(body[field]),
                "valuePrevDate": Number(prevUpdate.currentValue)
            })
        }
        // toUpdates.push({"field": field, "value": body[field], "prevValue": prevUpdate.currentValue, type: validated.type});
        // await lastUpdatedField({ userID, field });
    }

    // updates
    const acceptedChanges = [];
    for (const update of toUpdates) {
        // step 1 - validate update
        const validatedUpdate = await validateNewUpdate({ userID, update });
        if (validatedUpdate.error) {
            fails.push(validatedUpdate);
            continue;
        }

        // step 2 - make sure not updated recently
        const lastUpdate = await lastUpdatedField({ userID, field: update.field });
        if (lastUpdate.error) {
            fails.push(lastUpdate);
            continue;
        }

        acceptedChanges.push(update);
        userData[update.field] = update.value;

        if (update.field == "username") {
            userData.usernameLc = update.value.toLowerCase();
        }
    }

    // step 3 - update user record
    const newUser = await interactUserSchema.findOneAndUpdate({ _id: userID }, userData, { new: true });
    const newUpdates = await formatUserData({ userID, userData: newUser });
    
    // step 4 - create update record
    for (const update of acceptedChanges) {
        await createUpdateRecord({ userID, field: update.field, prevValue: update.prevValue, value: update.value });
    }

    return {
        "success": true,
        "partialSuccess": false,
        invalidFields,
        fails,
        noUpdates,
        acceptedChanges,
        "oldData": prevUpdates,
        "newData": newUpdates
    }
}

async function validateNewUpdate({ userID, update }) {
    if (update.field == "username") {
        const checkedUser = await checkUsername(update.value);
        if (checkedUser.error) {
            return {field: update.field, ...searchErrorV2("C031", { userID, options: [{ name: "field", data: "username" },{ name: "reason", data: `it was ${checkedUser.reason}.`}] })};
        }
    } else if (update.field == "displayName") {
        
    } else if (update.field == "description") {
    } else if (update.field == "userAge") {
        const checkedUserAge = await checkUserage(userID, update.value);
        if (checkedUserAge.error) {
            return {field: update.field, ...checkedUserAge.error};
        }
    } else if (update.field == "pronouns") {
    } else if (update.field == "profileURL") {
        if (update.value.startsWith('dataurl://')) {
            console.log('dataurl');
        } else {
            const checkedProfile = await checkSafeURL(update.value);
            if (checkedProfile.safe==false) return {field: update.field, ...searchErrorV2("C031", { userID, options: [{ name: "field", data: "profileURL" }, { name: "reason", data: `profileURL was not safe.`}] })};
        }
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
        return {field: field, ...searchErrorV2("C033", { userID,  options: [{ 
            name: "time", data: timesince(currenttime, updateRecord.timestamp)
        }, {
            name: "field", data: field 
        }]})};
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

async function createUpdateRecord({ userID, field, prevValue, value }) {
    await interactUserUpdateSchema.findOneAndUpdate({
        userID,
        field,
        current: true
    }, {
        current: false
    });

    const updateRecord = await interactUserUpdateSchema.create({
        _id: uuidv4(),
        timestamp: checktime(),
        current: true,
        userID,
        field,
        fromValue: prevValue,
        toValue: value,
    });

    return updateRecord;
}

module.exports = { 
    userUpdate,
    getCurrentUserUpdate
};