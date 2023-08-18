const interactUserPrivSchema = require('../../schemas/interactUserPrivSchema');
const { searchErrorV2 } = require('../../utils/searchError');
const SHA1 = require("crypto-js/sha1");
const { useID } = require("@dothq/id")


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

    return searchError("G005");
}

async function setPassword({ userID, password }) {
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: userID });
    if (!foundPrivUser) return searchError("G004");

    var passwordCorrect = false;
    if (foundPrivUser.salted) {
        const [salt, key] = foundPrivUser.password.split(":");
        const saltedPassword = SHA1(password).toString();
        if (key != saltedPassword) return searchError("G005");
        passwordCorrect=true
    }
    else {
        if (foundPrivUser.password != password) return searchError("G005");
        passwordCorrect=true
    }

    if (!passwordCorrect) return searchError("G005");
    else return foundPrivUser;
}

module.exports = { checkPassword, setPassword };
