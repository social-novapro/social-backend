const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const { searchErrorV2 } = require('../../searchError');

async function getData(userID) {
    const UserData = await interactUserSchema.findOne({_id: userID});
    if (!UserData) return res.status(400).send(searchErrorV2("B001", { userID }));
    
    const UserPrivData = await interactUserPrivSchema.findOne({_id: userID});
    if (!UserPrivData) return res.status(400).send(searchErrorV2("B001", { userID }));

    const EmailVer = await interactEmailVerificationSchema.findOne({userID: userID});

    const EmailSettings = await interactEmailSettingSchema.findOne({_id: userID});
    const returnData = {
        email: UserPrivData?.email ? UserPrivData.email : "None Set",
        emailSetting: EmailVer?.email ? EmailVer.email : false,
        verified: EmailVer?.verified ? true : false,
        timestampVerified: EmailVer?.timestampVerified ? EmailVer.timestampVerified : null,
        removeRequest: EmailVer?.shouldRemoveEmail ? true : false,
        emailSettings: EmailSettings 
    }

    return returnData;
}

module.exports = { getData }
