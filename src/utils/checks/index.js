const { searchError } = require("../searchError")
const interactUserSchema = require('../../schemas/interactUserSchema')

async function checkUsername(username) {
    const usernameCheck = await interactUserSchema.findOne({ username })
    if (usernameCheck) return { "allowed" : false, "error" : searchError("C001")}

    if (username.length > 20) return { "allowed" : false, "error" : "Username to long!"}

    const allowed = "a b c d e f g h i j k l m n o p q r s t u v w x y z 0 1 2 3 4 5 6 7 8 9 . _ -"
    var allowedSet = allowed.split(/[ ]+/)
    
    var foundArgs = []

    for (c of username) {
        for (allowedC of allowedSet) {
            if (allowedC == c.toLowerCase()) foundArgs.push(c)
        }
    }

    if (foundArgs.join("") != username) return { "allowed" : false, "error" : "Username does not reach rules"}
    else return { "allowed" : true}
}

function checkDisplayname() {

}

async function checkPostContent(content) {
    let myReg = new RegExp("\n", "g")
    var returnedLines = content.match(myReg);

    if (returnedLines) if (returnedLines.length > 10) return { "error" : searchError("E006")}
    else return
}

module.exports = { checkUsername, checkDisplayname, checkPostContent }