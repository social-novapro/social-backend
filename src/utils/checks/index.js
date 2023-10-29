const { searchError } = require("../searchError");
const interactUserSchema = require('../../schemas/interactUserSchema');

async function checkUsername(username) {
    const usernameLcCheck = await interactUserSchema.findOne({ usernameLc: username.toLowerCase() });
    if (usernameLcCheck) return { "allowed" : false, "error" : searchError("C001")};

    const usernameCheck = await interactUserSchema.findOne({ username: username.toLowerCase() });
    if (usernameCheck) return { "allowed" : false, "error" : searchError("C001")};

    if (username.length > 20) return { "allowed" : false, "error" : "Username to long!"};

    const alowedPattern = /^[a-zA-Z._-]+$/;
    const allowedUsername = alowedPattern.test(username);

    if (!allowedUsername) return { "allowed" : false, "error" : searchError("C012")};
    else return { "allowed" : true};
}

async function checkPassword(password) {
    return { "allowed" : true };
};

function checkDisplayname() {

};

async function checkPostContent(content) {
    let myReg = new RegExp("\n", "g");
    var returnedLines = content.match(myReg);
    if (content.length > 512) return searchError("E005");
    else if (returnedLines && returnedLines.length > 10) return searchError("E006");
    else return true;
};

module.exports = { checkUsername, checkDisplayname, checkPostContent, checkPassword };