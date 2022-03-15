const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');

function addAccessToken(userID, accessToken) {
    await interactUserPrivSchema.findOneAndUpdate(
        { _id: userID }, 
        { $push : { acessToken: accessToken } }
    );
};

module.exports = { addAccessToken };