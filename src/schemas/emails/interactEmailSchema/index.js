const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonreqString = {
    type: String,
    required: false
};
const reqNum = {
    type: Number,
    required: true
};
const reqBool = {
    type: Boolean,
    required: true
};

const htmlElement = mongoose.Schema({
    h1: nonreqString,
    p: nonreqString,
    a: nonreqString,
    ahref: nonreqString
})

const userSend = mongoose.Schema({
    _id: nonreqString,
    email: nonreqString,
    failed: reqBool,
    isBCC: reqBool,
});

/* email.type
    0X = user
        00 = email verification
        01 = welcome
        02 = password reset
            hidden content
    1X = Post
        10 = new post
        11 = post edited
        12 = post deleted
    2X = DM
        20 = new dm
            hidden content
        21 = dm request
            hidden content
    3x = mention
        30 = new mention
        31 = someone replied to your post
        32 = someone liked your post
        33 = someone quoted your post
    4x = notification
        40 = user posted
        41 = notification request
    5x = other
        50 = other  
        51 = unknown
    0= default email
    1= password reset request
    2= dm notification
    3= post notificatoin
    4= mention notification
*/

const interactEmailSchema = mongoose.Schema({
    _id: reqString,
    timestamp: reqNum,
    failed: reqBool,
    users: [userSend],
    type: reqNum,
    subject: reqString,
    content: nonreqString,
    html: htmlElement,
});


module.exports = mongoose.model('interact-email', interactEmailSchema);