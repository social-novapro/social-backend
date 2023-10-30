const { searchErrorV2 } = require('../../utils/searchError');
const SHA1 = require("crypto-js/sha1");
const { useID } = require("@dothq/id");
const interactUserSchema = require('../../schemas/interactUserSchema');
const interactEmailVerificationSchema = require('../../schemas/emails/interactEmailVerificationSchema');
const interactUserPrivSchema = require('../../schemas/interactUserPrivSchema');

// function that can be used to check password
async function checkPassword({ userID, password }) {
    /*
        userID = userID of the user
        password = password of
    */
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: userID });
    if (!foundPrivUser) return searchErrorV2("G004", { userID });

    var returnValue = {
        error: false,
        msg: {},
        correctPassword: false
    }

    var passwordCorrect = false;
    if (foundPrivUser.salted) {
        const [salt, key] = foundPrivUser.password.split(":");
        const saltedPassword = SHA1(password).toString();

        if (key != saltedPassword) {
            return searchErrorV2("G005", { userID });
        }
        passwordCorrect=true
    }
    else {
        if (foundPrivUser.password != password) {
            return searchErrorV2("G005", { userID });
        }
        else {
            const foundUsername = await interactUserSchema.findOne({ _id: userID });
            const saltedPassword = `${useID(2)}:${SHA1(password).toString()}`
    
            await interactUserPrivSchema.findOneAndUpdate({
                _id: foundUsername._id
            }, {        
                salted: true,
                password: saltedPassword
            }, {
                upsert: true
            });
        }

        passwordCorrect=true
    }

    if (passwordCorrect!=true) {
        return searchErrorV2("G005", { userID });
    }

    if (passwordCorrect == true){
        returnValue.correctPassword = true
        return returnValue
    }

    return searchErrorV2("G005", { userID });
}

async function quickCheckPassword({ userID, password }) {
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: userID });
    if (!foundPrivUser) return searchErrorV2("G004", { userID });

    var passwordCorrect = false;
    if (foundPrivUser.salted) {
        const [salt, key] = foundPrivUser.password.split(":");
        const saltedPassword = SHA1(password).toString();
        if (key != saltedPassword) return searchErrorV2("G005", { userID });
        passwordCorrect=true
    }
    else {
        if (foundPrivUser.password != password) return searchErrorV2("G005", { userID });
        passwordCorrect=true
    }

    if (!passwordCorrect) return searchErrorV2("G005", { userID });
    else return foundPrivUser;
}

async function setPassword({ userID, password }) {
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: userID });
    if (!foundPrivUser) return searchErrorV2("G004", { userID });

    const saltedPassword = `${useID(2)}:${SHA1(password).toString()}`;

    await interactUserPrivSchema.findOneAndUpdate({
        _id: userID
    }, {        
        salted: true,
        password: saltedPassword
    }, {
        upsert: true
    });

    return { "success" : true };
}

async function checkTypeLogin({ username, allowEmailUnverified }) {
    // if email regex
    const emailRegex = /\S+@\S+\.\S+/;
    const emailUsed = emailRegex.test(username) ? true : false;

    var returnData = {
        foundUserID: null,
        usernameFound: null,
        foundUser: null,
        emailFound: null,
        emailVerified: null
    }

    // username login
    if (!emailUsed) {
        const foundUsernameLc = await interactUserSchema.findOne({ usernameLc: username.toLowerCase() });
        if (!foundUsernameLc) return searchErrorV2("G003", { userID: username });

        const foundUsername = await interactUserSchema.findOne({ username });
        if (foundUsername && !foundUsernameLc) {
            /* adds LC to db properly */
            await interactUserSchema.findOneAndUpdate({
                _id: foundUsername._id
            }, {        
                usernameLc: username.toLowerCase()
            }, {
                upsert: true
            });
        }
        if (!foundUsername) return searchErrorV2("G003", { userID: username });

        // gets email data if it exists
        const foundEmailUser = await interactEmailVerificationSchema.findOne({ userID: foundUsername._id });
        if (foundEmailUser) {
            returnData.emailFound = foundEmailUser.email;
            returnData.emailVerified = foundEmailUser.verified;
        }

        returnData.foundUserID = foundUsername._id;
        returnData.usernameFound = foundUsername.username;
        returnData.foundUser = foundUsername;
    }

    // email login
    if (emailUsed) {
        const email = username;
        const foundEmailUser = await interactEmailVerificationSchema.findOne({ email });
        if (!foundEmailUser) return searchErrorV2("G003", { userID: "unknown" });
        if (foundEmailUser) {
            returnData.emailFound = foundEmailUser.email;
            returnData.emailVerified = foundEmailUser.verified;
        }
        // if email is not verified, and email unverified is not allowed then return error
        if (foundEmailUser.verified != true && !allowEmailUnverified) return searchErrorV2("G006", { userID: foundEmailUser.userID });

        // gets username data
        const foundUsername = await interactUserSchema.findOne({ _id: foundEmailUser.userID });
        if (!foundUsername) return searchErrorV2("G003", { userID: foundEmailUser._id });

        returnData.foundUserID = foundUsername._id;
        returnData.usernameFound = foundUsername.username;
        returnData.foundUser = foundUsername;
    }

    return returnData;
}

module.exports = { checkPassword, quickCheckPassword, setPassword, checkTypeLogin };
