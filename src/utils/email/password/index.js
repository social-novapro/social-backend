const interactEmailVerificationSchema = require("../../../schemas/emails/interactEmailVerificationSchema");
const { v4: uuidv4 } = require("uuid");
const { checkPassword, setPassword } = require("../../userAuth");
const { checktime } = require("../../checktime");
const { searchError } = require("../../searchError");

async function requestForgotPass({ email }) {
    if (!email) return searchError("Z002", [{ name: "msg", data: "no email provided while changing password"}] );

    const foundEmailVer = await interactEmailVerificationSchema.findOne({ email });
    if (!foundEmailVer) return searchError("N014");
    const {userID} = foundEmailVer;
    // will still allow if not verified, due to forgot password
    
    const passVerID = await createPassVerID({ emailID: foundEmailVer._id, action: "forget" });
    await sendEmailForgotPass({ email: foundEmailVer.email, userID, passVerID })

    return { "status" : "success" };
}

async function confirmForgotPass({ passVerID }) {
    if (!passVerID) return searchError("Z002", [{ name: "msg", data: "no passVerID provided"}] );
    
    const foundEmailVer = await interactEmailVerificationSchema.findOne({ replacePassVerID: passVerID });
    if (!foundEmailVer) return searchError("N014");

    const { email, userID } = foundEmailVer;

    // sets new password
    const newPass = uuidv4()
    const setPass = await setPassword({ userID, newPass });
    if (setPass.error) return setPass;

    await emailConfirmForgotPassword({ email, userID, newPassword: newPass })
    
    return { "status" : "success", "msg" : "Check your email for the new password." };
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
    if (!foundEmailVer.verified) return searchError("N028")
    
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

    const { userID, email } = foundEmailVer;
    
    const passwordCorrect = await checkPassword({ userID, oldPass });
    if (passwordCorrect.error) return passwordCorrect;

    const setPass = await setPassword({ userID, newPass });
    if (setPass.error) return setPass;
    await emailConfirmChangePassword({ email, userID })
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

// send password change confirmation
async function emailConfirmChangePassword({ email, userID }) {
    const mainURL = current == "prod" ? `https://interact.novapro.net` : "http://localhost:5500";
    
    await emailSender({
        users: [{
            email: email,
            userID: userID,
            bbc: false
        }],
        type: 0,
        subject: "Password Updated",
        content: `Your password has been updated. Open: ${mainURL} to proceed to Interact. Thank you.`,
        htmlElement: {
            h1: "Password Updated",
            p: `Your password was updated, you can now proceed to Interact, and it is recommended to change the password after logging back in.`,
            a: `${mainURL}`,
        }
    });

    return { "status": "success"  };
}

// send password forgot confirmation
async function emailConfirmForgotPassword({ email, userID, newPassword }) {
    await emailSender({
        users: [{
            email: email,
            userID: userID,
            bbc: false
        }],
        type: 0,
        subject: "Password Updated",
        content: `Your password has been updated. Your new password is ${newPassword} Open: ${mainURL} to proceed to Interact. Thank you.`,
        htmlElement: {
            h1: "Password Updated",
            p: `Your password was updated to <b>${newPassword}</b> please proceed to Interact, and it is recommended to change the password after logging back in.`,
            a: `${mainURL}`,
        }
    });

    return { "status": "success"  };
}

// send password forgot verification
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
            h1: "Confirm forget password.",
            p: "Please update your password",
            a: `${verURL}`,
        }
    });

    return { "status": "success"  };
}


// send password change verification
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
            h1: "Confirm change password.",
            p: "Please update your password",
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
