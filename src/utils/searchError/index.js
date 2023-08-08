const { LATEST_API } = require('../../../config.json');
const { saveErrorToDB } = require('../admin/errors/saveError');
const errorCodes = require('../errorCodes.json');


/* updated searchError, so is easier to mange more external values */
function searchErrorV2(errorCode, { userID, options, usedAPIversion, lookup }) {
    const apiVersionLookup = usedAPIversion || LATEST_API;

    for (APIVersion of errorCodes.APIversions) {
        if (APIVersion.API == apiVersionLookup) {
            for (error of APIVersion.errorCodes) {
                if (error.code == errorCode){
                    if (error.options && error.options[0]) return exportErrorV2({ error: textReplacements({ error, optionsInput: options }), userID, lookup });
                    else return exportErrorV2({ error, userID, lookup });
                }
            };
        };
    };
    
    return exportErrorV2("Z001",{ userID, usedAPIversion: apiVersionLookup, lookup });
}

/* original searchError, is harder to mange other values needed, as its one by one */
function searchError(errorCode, options, usedAPIversion) {
    const apiVersionLookup = usedAPIversion || LATEST_API;

    for (APIVersion of errorCodes.APIversions) {
        if (APIVersion.API == apiVersionLookup) {
            for (error of APIVersion.errorCodes) {
                if (error.code == errorCode){
                    if (error.options && error.options[0]) return exportError(textReplacements({ error, optionsInput: options }));
                    else return exportError(error);
                }
            };
        };
    };
    
    return searchError("Z001", [], apiVersionLookup);
};

/* new exportError, created to manage extra values easier */
function exportErrorV2({ error, userID, lookup }) {
    const { code, msg } = error;
    
    if (!lookup) saveErrorToDB({ errorCode: code, errorMsg: msg, userID });

    return { code, msg, error: true };
}

/* original exportError, simple */
function exportError(error) {
    const { code, msg } = error;

    saveError({ code, msg, userID: "Unknown - V1 search error export "});

    return { code, msg, error: true };
}

/*
    seperated so could still be used with old searchError fuction

    :updated: 
    to be used with all functions, async or not async
    v2 is not async (was going to be)
*/
async function saveError({ code, msg, userID }) {
    await saveErrorToDB({ errorCode: code, errorMsg: msg, userID: userID ? userID: "unkown userID" });
}

function textReplacements({ error, optionsInput }) {
    var newMessage = error.msg.slice();

    for (const errorOption of error.options) {
        var foundReplacement = false;

        if (optionsInput && optionsInput[0]) {
            for (const option of optionsInput) {
                if (option.name == errorOption.name) {
                    if (option.data) {
                        foundReplacement = true;
                        newMessage = newMessage.replace(errorOption.replacement, option.data);
                    }
                }
            }
        }
        
        if (foundReplacement != true) newMessage = newMessage.replace(errorOption.replacement, errorOption.default)
    }

    return {
        code: error.code,
        msg: newMessage
    };
}

// usage
/*
    searchError("Z001")
    searchError("Z001", [], "v1")
    searchError("Z001", [{ name: "max", data: "data1" }, { name: "min", data: "data2" }])
    searchError("Z001", [{ name: "max", data: "data1" }, { name: "min", data: "data2" }], "v1")
    searchError("Z001", [ data1, data2 ]) // maybe
    searchError("Z001", [{ name: "max", data: "data1" }, { name: "min", data: "data2" }], "v1")
    
*/

module.exports = { searchError, searchErrorV2 };