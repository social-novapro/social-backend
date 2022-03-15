const { checktime } = require('./checktime');
const { createPostIndex, createUserIndex} = require('./createIndex');
const interactPostSchema = require('../database/posts-schema');
const interactUserSchema = require('../database/user-schemas');

async function newUserID() {
    const newID = await createNewID();
    const finalID = await findID(newID, "user");
    createUserIndex(finalID);
    return finalID;
};

async function newPostID() {
    const newID = await createNewID();
    const finalID = await findID(newID, "post");
    createPostIndex(finalID);
    return finalID;
};

module.exports = { newUserID, newPostID };


async function findID(newID, method) {
    var result;
    
    if (method = "post") result = await interactPostSchema.findOne({ _id: newID });
    else if (method = "user") result = await interactUserSchema.findOne({ _id: newID });

    if (!result) return newID;
    else {
        const newCreatedID = createNewID();
        return findID(newCreatedID, method);
    };
};


function createNewID() {
    const num1 = randomNumber();
    const num2 = randomNumber();
    var res = num1.concat(checktime());
    var res2 = res.concat(num2);
    var root1 = Math.sqrt(res2);
    const additionroot1 = root1 + checktime();
    const newID = Math.floor(additionroot1);
    const newIDString = newID.toString();
    const verfiedID = verfiyID(newIDString);
    return verfiedID;
};

function verfiyID(newID) {
    if (newID.length != 13) {
        if (newID.length < 13) {
            const num3 = randomNumber();
            const newIDString = num3.toString();
            const newCreationID = newIDString.concat(num3);
            return verfiyID(newCreationID);
        } else {
            const newCreationID = newID.substring(0, 8);
            return verfiyID(newCreationID);
        };
    } else return newID;
};

function randomNumber() {
    const num = Math.floor(Math.random() * 99) + 10;
    var string = num.toString();
    return string;
};