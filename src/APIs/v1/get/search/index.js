const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema')


router.get('/', async (req, res) => {
    const { lookupkey } = req.headers
    
    const UserData = await interactUserSchema.find()
    const PostData = await interactPostSchema.find()

    // const lookupArgs = lookupkey.split(/[ ]+/)

    const lookupArgs = lookupkey.toLowerCase().split("")
    var found = []

    for (user of UserData) {
        if (user.username) {
            var lookingArg = []
            const usernameArgs = user.username.toLowerCase().split("")
            for (argLook of lookupArgs) {
                lookingArg.push(argLook)
                const lookingUsername = []
                for (argUsername of usernameArgs) {
                    lookingUsername.push(argUsername)
                    if (lookingUsername.join("")==lookingArg) {
                        found.push({"username":user.username})
                    }
                }
                if (lookingArg.join("")==user.username.toLowerCase()) {
                    found.push({"username":user.username})
                }
            }
        }
        if (user.displayName) {
            var lookingArg = []
            const usernameArgs = user.displayName.toLowerCase().split("")
            for (argLook of lookupArgs) {
                lookingArg.push(argLook)
                const lookingUsername = []
                for (argUsername of usernameArgs) {
                    lookingUsername.push(argUsername)
                    if (lookingUsername.join("")==lookingArg) {
                        found.push({"displayname":user.displayName})
                    }
                }
                if (lookingArg.join("")==user.displayName.toLowerCase()) {
                    found.push({"displayname":user.displayName})
                }
            }
        }
    }

    return res.status(200).send(found);
})

module.exports = router

