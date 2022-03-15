const developerToken = require('../../schemas/developer/developerToken');
const developerAppToken = require('../../schemas/developer/developerAppToken');
const { searchError } = require('../searchError');

async function checkDevTokens(devToken, appToken) {
    if (!devToken && !appToken) return { "authorized": false, "error" : searchError("A004")};
    if (!devToken) return { "authorized": false, "error" : searchError("A005")};
    if (!appToken) return { "authorized": false, "error" : searchError("A006")};

    const checkDevToken = await developerToken.findOne({_id: devToken});
    const checkAppToken = await developerAppToken.findOne({_id: appToken});
    
    if (!checkDevToken && !checkAppToken) return { "authorized": false, "error" : searchError("A001")};
    else if (!checkDevToken) return { "authorized": false, "error" : searchError("A002")};
    else if (!checkAppToken) return { "authorized": false, "error" : searchError("A003")};
   
    if (checkAppToken.devToken != checkDevToken._id) return { "authorized": false, "error" : "Provided App token is not matched with provided Dev token"};

    var APIUsesDev;
    var APIUsesApp;

    if (!checkDevToken.APIUses) APIUsesDev = 0;
    else APIUsesDev = checkDevToken.APIUses;

    if (!checkAppToken.APIUses) APIUsesApp = 0;
    else APIUsesApp = checkAppToken.APIUses;

    await developerToken.findOneAndUpdate({_id: devToken}, { APIUses: APIUsesDev + 1  });
    await developerAppToken.findOneAndUpdate({_id: appToken}, { APIUses: APIUsesApp + 1  });

    return { "authorized": true };
}

module.exports = { checkDevTokens };