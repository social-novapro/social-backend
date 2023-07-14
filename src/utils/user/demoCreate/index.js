const config = require('../../../../config.json');
const interactUserSchema = require('../../../schemas/interactUserSchema');

function checkifdev() {
    if (config.current != "dev") return false;
    else return true;
}

var headersBasic = {
    'devToken': "2370715d-74c0-44a1-85f2-b36a184066cf",
    'appToken': "d4933638-3949-40f1-9025-380b55cc78c4",
    'Content-Type': 'application/json'
};

// this is a demo function to create a user
async function demoCreate({ username }) {
    // create a user
    const userBody = {
        username, 
        displayName: "test Display",
        password: "testPassword",
        description: "test description",
        pronouns: "test pronouns",
        statusTitle: "test statusTitle"
    }

    const userData = await sendRequest({
        url: "/v1Priv/post/newUser",
        method: "POST",
        body: userBody,
        headers: headersBasic 
    });

    if (userData.error || userData.login!=true) return {error: "error creating user", userData};
    headersBasic.userToken = userData.userToken;
    headersBasic.userID = userData.userID;
    headersBasic.accessToken = userData.accessToken;

    /* turn user into demo user */
    const turnDemo = await interactUserSchema.findOneAndUpdate({ _id: userData.userID }, { demo: true });

    // create 10 posts
    const postData = [];
    const postContents = [ "post 1", "post 2", "post 3", "post 4", "post 5", "post 6", "post 7", "post 8", "post 9", "post 10" ];
    for (const post of postContents) {
        const postBody = {
            content: post,
            userID: userData.userID
        }

        const postRes = await sendRequest({
            url: "/v1/post/createPost",
            method: "POST",
            body: postBody,
            headers: headersBasic
        });

        postData.push(postRes);
    }

    // create dev token

    // create 3 app tokens


    // sign in with 2 of the apps


    return {
        userData,
        turnDemo,
        postData
    }

    // ceate 1 login item (done)
    // create 1 dev token
    // create 1 app token
    // create 10 posts (done)
    // create 5 polls
    // create 5 replies to a ceritain post
    // vote on 5 polls (including its own, or otherwise)
    // sub to a user
    // like a post

    return {

    }
}

async function sendRequest({ url, method, body, headers }) {
    const res = await fetch(`http://localhost:5002${url}`, {
        method,
        body: JSON.stringify(body),
        headers
    });
    
    try {
        const data = await res.json();
        return data;
    } catch (err) {
        return {error: "error parsing json"};
    }
}

module.exports = {
    demoCreate
}