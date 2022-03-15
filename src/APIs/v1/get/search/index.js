const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { lookupkey } = req.headers;
    
    const UserData = await interactUserSchema.find();
    const PostData = await interactPostSchema.find();

    const lookupKeylower = lookupkey.toLowerCase();
    var usersFound = [];

    for (user of UserData) {
        var username;
        var displayname;

        if (lookupkey == user._id) usersFound.push(user);
        else if (user.username && user.displayName) {
            username = user.username.toLowerCase();
            displayname = user.displayName.toLowerCase();

            if (username.startsWith(lookupKeylower) && displayname.startsWith(lookupKeylower)) usersFound.push(user);
            else if (username.startsWith(lookupKeylower)) usersFound.push(user);
            else if (displayname.startsWith(lookupKeylower)) usersFound.push(user);
        } else if (user.username) {
            username = user.username.toLowerCase();
            if (username.startsWith(lookupKeylower)) usersFound.push(user);
        } else if (user.displayName) {
            displayname = user.username.toLowerCase();

            if (displayname.startsWith(lookupKeylower)) usersFound.push(user);
        };
    };

    var postsFound = [];

    for (post of PostData) {
        var username;
        var displayname;

        if (post.content) {
            content = post.content.toLowerCase();

            if (content.toLowerCase().startsWith(lookupKeylower) || lookupkey == post._id) {
                var type;
                var postData = post;
                var userData;

                if (post.userID) {
                    type = { "type" : "post", "user" : "included" };
                    userData = await interactUserSchema.findOne({ _id: post.userID});
                } else type = { "type" : "post" };

                var sendPost = { type, postData, userData};

                postsFound.push(sendPost);
            };
        };
    };

    /* OLD SEARCHING FUNCTION
    const lookupArgs = lookupkey.toLowerCase().split("")

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
    }*/

    var found = {
        usersFound,
        postsFound
    };

    return res.status(200).send(found);
})

module.exports = router;