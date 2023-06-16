const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');

async function confirmRemove({ emailVerID }) {
    const removed = await removeEmail({ email, userID, password});
}
async function removeEmail({ email, userID, password }) {
    // if user decides to remove the email
    // check if email is verified
//     await interactUserPrivSchema.findOneAndUpdate({
//         _id: userID,
//         password: password,
//         email: email
//     }, {

}

// sends a request to remove email
async function requestRemove({ email, userID, password }) {
    // const 
}

module.exports = { removeEmail, requestRemove };