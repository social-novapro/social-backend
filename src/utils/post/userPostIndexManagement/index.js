const { v4: uuidv4 } = require('uuid');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserPostIndexSchema = require('../../../schemas/postSchemas/interactUserPostIndexSchema');

// create a user post index
async function createUserPostIndex({ prevIndexID }) {
    // set to user schema
    const indexID = uuidv4();
    await interactUserSchema.findOneAndUpdate({ _id: userID }, { postIndexID: indexID });

    // create empty index
    await interactUserPostIndexSchema.create({
        _id: indexID,
        timestamp: checktime(),
        amount: 0,
        prevIndexID: prevIndexID ? prevIndexID : null
    });
}

// get current user post index, or specific user post index
async function getUserPostIndex({ userID, indexID }) {
    if (!indexID) {
        // get current user post index
    }
}

async function pushPostToUserPostIndex({ userID, postID, currentIndexID }) {
    // const post = await interactPostSchema.findOne

}

module.exports = {
    createUserPostIndex,
    getUserPostIndex,
    pushPostToUserPostIndex
};