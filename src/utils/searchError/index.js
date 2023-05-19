const { LATEST_API } = require('../../../config.json');
const errorCodes = require('../errorCodes.json');

function searchError(errorCode, options, usedAPIversion) {
    console.log(errorCode)
    console.log(options)
    const apiVersionLookup = usedAPIversion || LATEST_API;

    for (APIVersion of errorCodes.APIversions) {
        if (APIVersion.API == apiVersionLookup) {
            for (error of APIVersion.errorCodes) {
                if (error.code == errorCode){
                    if (error.options) return textReplacements({ error, options })
                    else return error;
                }
            };
        };
    };
    
    return searchError("Z001", apiVersionLookup);
};

function textReplacements({ error, options }) {
    var newMessage = error.msg;

    for (const errorOption of error.options) {
        var foundReplacement = false;
        for (const option of options) {
            if (option.name == errorOption.name) {
                if (option.data) {
                    foundReplacement = true;
                    newMessage = newMessage.replace(errorOption.replacement, option.data)
                }
            }
        }

        if (foundReplacement != true) newMessage = newMessage.replace(errorOption.replacement, errorOption.default)
    }

    var newError = error;
    newError.msg = newMessage;

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
    
*/

module.exports = { searchError };