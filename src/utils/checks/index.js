const { searchError, searchErrorV2 } = require("../searchError");
const interactUserSchema = require('../../schemas/interactUserSchema');

async function checkUsername(username) {
    const usernameCheck = await interactUserSchema.findOne({ 
        usernameLc: username.toLowerCase() 
    });
    if (usernameCheck) return { "allowed" : false, "reason": "taken", "error" : searchError("C001")};

    if (username.length > 20) return { "allowed" : false, "reason": "to long", "error" : "Username to long!"};

    // const alowedPattern = /^[a-zA-Z._-]+$/;
    const allowedPattern = /^[a-zA-Z0-9._-]+$/;
    const allowedUsername = allowedPattern.test(username);

    if (!allowedUsername) return { "allowed" : false, "reason": "not allowed", "error" : searchError("C012")};
    else return { "allowed" : true};
}

async function checkUserage(userAge) {
    // make sure its a number
    if (isNaN(userAge)) {
        return {"allowed": false, error: searchErrorV2("C031", { userID, options: [{ name: "field", data: "userAge" }, { name: "reason", data: `userAge was not a number.`}] })};
    }
    // make sure user is 13 years old
    const timediff = checktime() - userAge;
    const firstYears = Math.floor(timediff / 31556952000);
    if (firstYears < 13) {
        return {"allowed": false, error: searchErrorV2("C031", { userID, options: [{ name: "field", data: "userAge" }, { name: "reason", data: `user is not 13 years old.`}] })};
    }        
    return {
        "allowed" : true
    }
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

module.exports = { checkUsername, checkUserage, checkDisplayname, checkPostContent, checkPassword };