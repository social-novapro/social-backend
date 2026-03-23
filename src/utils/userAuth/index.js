const { searchErrorV2 } = require('../../utils/searchError');
const SHA1 = require("crypto-js/sha1");
const bcrypt = require('bcrypt');
const interactUserSchema = require('../../schemas/interactUserSchema');
const interactEmailVerificationSchema = require('../../schemas/emails/interactEmailVerificationSchema');
const interactUserPrivSchema = require('../../schemas/interactUserPrivSchema');

const PASSWORD_VERSION_V1 = 1;
const PASSWORD_VERSION_V2 = 2;
const PASSWORD_VERSION_V3 = 3;
const BCRYPT_SALT_ROUNDS = 12;

function getPasswordVersion(foundPrivUser) {
    const passwordValue = typeof foundPrivUser.password === 'string' ? foundPrivUser.password : '';

    if (
        foundPrivUser.passwordVersion === PASSWORD_VERSION_V3 &&
        passwordValue.startsWith('$2')
    ) return PASSWORD_VERSION_V3;

    if (foundPrivUser.salted && passwordValue.includes(':')) return PASSWORD_VERSION_V2;

    return PASSWORD_VERSION_V1;
}

async function verifyPasswordWithVersion({ foundPrivUser, password }) {
    const version = getPasswordVersion(foundPrivUser);

    if (version === PASSWORD_VERSION_V3) {
        const valid = await bcrypt.compare(password, foundPrivUser.password);
        return { valid, version };
    }

    if (version === PASSWORD_VERSION_V2) {
        const [salt, key] = (foundPrivUser.password || '').split(':');
        const saltedPassword = SHA1(password).toString();
        return { valid: key == saltedPassword, version };
    }

    return { valid: foundPrivUser.password == password, version };
}

async function upgradePasswordToLatest({ userID, password, version }) {
    if (version === PASSWORD_VERSION_V3) return { success: true };
    return setPassword({ userID, password });
}

// function that can be used to check password
async function checkPassword({ userID, password }) {
    /*
        userID = userID of the user
        password = password of
    */
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: userID });
    if (!foundPrivUser) return searchErrorV2("G004", { userID });

    if (!password || typeof password !== 'string') return searchErrorV2("G005", { userID });

    var returnValue = {
        error: false,
        msg: {},
        correctPassword: false
    }

    const verifyResult = await verifyPasswordWithVersion({ foundPrivUser, password });
    var passwordCorrect = verifyResult.valid;

    // Backwards compatibility path: migrate legacy users to v3 bcrypt on successful login.
    if (passwordCorrect) {
        const upgradeResult = await upgradePasswordToLatest({
            userID,
            password,
            version: verifyResult.version
        });
        if (upgradeResult && upgradeResult.error) return upgradeResult;
    }

    if (passwordCorrect != true) {
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

    if (!password || typeof password !== 'string') return searchErrorV2("G005", { userID });

    const verifyResult = await verifyPasswordWithVersion({ foundPrivUser, password });
    var passwordCorrect = verifyResult.valid;

    if (!passwordCorrect) return searchErrorV2("G005", { userID });
    else return foundPrivUser;
}

async function setPassword({ userID, password }) {
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: userID });
    if (!foundPrivUser) return searchErrorV2("G004", { userID });

    if (!password || typeof password !== 'string') return searchErrorV2("G005", { userID });

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    await interactUserPrivSchema.findOneAndUpdate({
        _id: userID
    }, {        
        salted: true,
        passwordVersion: PASSWORD_VERSION_V3,
        password: hashedPassword
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
        const foundUsername = await interactUserSchema.findOne({ usernameLc: username.toLowerCase() });
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

/* this shouldnt actually be needed to ran more than once after usernameLc is a thing */
async function updateAllUsernameLc() {
    var amountUpdated = 0;
    const updatedUsernames = [];
    const failedUsernames = [];
    const allUsers = await interactUserSchema.find({});

    for (const user of allUsers) {
        const username = user.username;
        if (!username) {
            failedUsernames.push({user, error: searchErrorV2("R012", { userID: user._id})});
            continue;
        }

        const usernameLc = user.username.toLowerCase();
        if (updatedUsernames.includes(usernameLc)) {
            failedUsernames.push({user, error: searchErrorV2("R013", { userID: user._id})});
            continue;
        }

        /* actually updates */
        await interactUserSchema.findOneAndUpdate({ 
            _id: user._id
        }, {
            usernameLc
        });

        updatedUsernames.push(usernameLc);
        amountUpdated++
    }

    return {
        amountUpdated,
        updatedUsernames,
        failedUsernames
    };
}

/* for testing purposeses, reverse of what function above does */
async function undoAllUsernameLc() {
    var amountUpdated = 0;
    const updatedUsernames = [];
    const failedUsernames = [];
    const allUsers = await interactUserSchema.find({});

    for (const user of allUsers) {
        const username = user.username;
        if (!username) {
            failedUsernames.push({user, error: searchErrorV2("R012", { userID: user._id})});
            continue;
        };

        /* actually updates */
        await interactUserSchema.findOneAndUpdate({ 
            _id: user._id
        }, {
            usernameLc: null
        });

        updatedUsernames.push(username);
        amountUpdated++
    };

    return {
        amountUpdated,
        updatedUsernames,
        failedUsernames
    };
}

module.exports = { 
    checkPassword, 
    quickCheckPassword, 
    setPassword, 
    checkTypeLogin,
    updateAllUsernameLc,
    undoAllUsernameLc
};
