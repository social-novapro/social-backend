const { LATEST_API } = require('../../../config.json');
const errorCodes = require('../errorCodes.json');

function searchError(errorCode, usedAPIversion) {
    const apiVersionLookup = usedAPIversion || LATEST_API;

    for (APIVersion of errorCodes.APIversions) {
        if (APIVersion.API == apiVersionLookup) {
            for (error of APIVersion.errorCodes) {
                if (error.code == errorCode) return error;
            };
        };
    };
    
    return searchError("Z001", apiVersionLookup);
};

module.exports = { searchError };