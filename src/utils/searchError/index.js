const { LATEST_API } = require('../../../config.json');
const errorCodes = require('../errorCodes.json');

function searchError(errorCode, options, usedAPIversion) {
    const apiVersionLookup = usedAPIversion || LATEST_API;

    for (APIVersion of errorCodes.APIversions) {
        if (APIVersion.API == apiVersionLookup) {
            for (error of APIVersion.errorCodes) {
                if (error.code == errorCode){
                    if (error.options && error.options[0]) return textReplacements({ error, optionsInput: options });
                    else return error;
                }
            };
        };
    };
    
    return searchError("Z001", [], apiVersionLookup);
};

function textReplacements({ error, optionsInput }) {
    var newMessage = error.msg.slice();

    for (const errorOption of error.options) {
        var foundReplacement = false;

        if (optionsInput && optionsInput[0]) {
            for (const option of optionsInput) {
                if (option.name == errorOption.name) {
                    if (option.data) {
                        foundReplacement = true;
                        newMessage = newMessage.replace(errorOption.replacement, option.data)
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
    
*/

module.exports = { searchError };