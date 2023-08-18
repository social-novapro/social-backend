const interactEmailVerificationSchema = require("../../../schemas/emails/interactEmailVerificationSchema");
const { v4: uuidv4 } = require("uuid");
const { checkPassword, setPassword } = require("../../userAuth");
const { checktime } = require("../../checktime");
const { searchError } = require("../../searchError");

async function requestForgotPass({ }) {

}

async function confirmForgotPass({ }) {

}

/*
 * could pre-store new password instead? instead of needing to do it with url
 * can use the same confirm function, and the request forgot adds new password in the pre-store value
 * or you know, just not do that and do it the way i was doing it already
 */
async function requestChangePass({ userID, password }) {
    if (!userID) return searchError("Z002", [{ name: "msg", data: "no userID provided"}] );
    if (!password) return searchError("Z002", [{ name: "msg", data: "no passsword provided"}] );

    const foundEmailVer = await interactEmailVerificationSchema.findOne({ userID });
    if (!foundEmailVer) return searchError("N014");
    
    const passwordCorrect = await checkPassword({ userID, password});
    if (passwordCorrect.error) return passwordCorrect;

    const passVerID = await createPassVerID({ emailID: foundEmailVer._id, action: "change" });

    await sendEmailChangePass({ email: foundEmailVer.email, userID, passVerID })

    return { "status" : "success" };
}

async function confirmChangePass({ passVerID, newPass, oldPass }) {
    if (!passVerID) return searchError("Z002", [{ name: "msg", data: "no passVerID provided"}] );
    if (!newPass) return searchError("Z002", [{ name: "msg", data: "new passsword was not provided"}] );
    if (!oldPass) return searchError("Z002", [{ name: "msg", data: "old passsword was not provided"}] );
    
    const foundEmailVer = await interactEmailVerificationSchema.findOne({ replacePassVerID: passVerID });
    if (!foundEmailVer) return searchError("N014");

    const { userID } = foundEmailVer;

    const passwordCorrect = await checkPassword({ userID, oldPass });
    if (passwordCorrect.error) return passwordCorrect;

    const setPass = await setPassword({ userID, newPass });
    if (setPass.error) return setPass;

    return { "status" : "success" };
}

async function createPassVerID({ emailID, action }) {
    const verificationID = uuidv4();

    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: emailID
    }, {
        _id: emailID,
        shouldForgotPass: action=="forgot" ? true : false,
        shouldChangePass: action=="change" ? true : false,
        replacePassVerID: verificationID,
        timestampReplacePass: checktime()
    })

    return verificationID;
}

// send password verification
async function sendEmailForgotPass({ email, userID, passVerID }) {
    const mainURL = current == "prod" ? `https://interact.novapro.net` : "http://localhost:5500";
    const verURL = `${mainURL}/emails/?forgotPassword=${passVerID}/`;
    //const verURL = `https://interact-api.novapro.net/v1/emails/requests/verification/${emailVerID}/`;
    
    await emailSender({
        users: [{
            email: email,
            userID: userID,
            bbc: false
        }],
        type: 0,
        subject: "Forgot Password Interact",
        content: `Please update your password. Open: ${verURL} to verify. Thank you.`,
        htmlElement: {
            h1: "Verify your email at Interact",
            p: "Please verify your email",
            a: `${verURL}`,
        }
    });

    return { "status": "success"  };
}


// send password verification
async function sendEmailChangePass({ email, userID, passVerID }) {
    const mainURL = current == "prod" ? `https://interact.novapro.net` : "http://localhost:5500";
    const verURL = `${mainURL}/emails/?replacePassword=${passVerID}/`;
    //const verURL = `https://interact-api.novapro.net/v1/emails/requests/verification/${emailVerID}/`;
    
    await emailSender({
        users: [{
            email: email,
            userID: userID,
            bbc: false
        }],
        type: 0,
        subject: "Change Password Interact",
        content: `Please update your password. Open: ${verURL} to verify. Thank you.`,
        htmlElement: {
            h1: "Verify your email at Interact",
            p: "Please verify your email",
            a: `${verURL}`,
        }
    });

    return { "status": "success"  };
}

module.exports = { 
    requestForgotPass, 
    confirmForgotPass,
    requestChangePass,
    confirmChangePass,
}
