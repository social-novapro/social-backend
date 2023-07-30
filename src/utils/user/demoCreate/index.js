const config = require('../../../../config.json');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');

function checkifdev() {
    if (config.current != "dev") return false;
    else return true;
}

const mainHeaderData = {
    'devToken': "2370715d-74c0-44a1-85f2-b36a184066cf",
    'appToken': "d4933638-3949-40f1-9025-380b55cc78c4",
    'Content-Type': 'application/json'
};

var headersBasic = {
    'devToken': "2370715d-74c0-44a1-85f2-b36a184066cf",
    'appToken': "d4933638-3949-40f1-9025-380b55cc78c4",
    'Content-Type': 'application/json'
};

// this is a demo function to create a user
async function demoCreate({ username }) {
    const isdev = checkifdev();
    if (!isdev) return { "error" : "Please use only in developer backend mode."};
    
    // create a user
    const userBody = {
        username, 
        displayName: "test Display",
        password: "testPassword",
        description: "test description",
        pronouns: "test pronouns",
        statusTitle: "test statusTitle"
    }

    const loginData = await sendRequest({
        url: "/v1Priv/post/newUser",
        method: "POST",
        body: userBody,
        headers: headersBasic 
    });

    if (loginData.error || loginData.login!=true) return {error: "error creating user", loginData};
    headersBasic.userToken = loginData.userToken;
    headersBasic.userID = loginData.userID;
    headersBasic.accessToken = loginData.accessToken;

    /* turn user into demo user */
    const userData = await interactUserSchema.findOneAndUpdate({ _id: loginData.userID }, { demo: true });

    /* gets priv */
    const userPrivData = await interactUserPrivSchema.findOne({ _id: loginData.userID });

    // create 10 posts
    const postData = [];
    const postContents = [ "post 1", "post 2", "post 3", "post 4", "post 5", "post 6", "post 7", "post 8", "post 9", "post 10" ];
    for (const post of postContents) {
        const postBody = {
            content: post,
            userID: loginData.userID
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
    const developerToken = await sendRequest({
        url: "/v1Priv/post/newDev",
        method: "POST",
    })

    // create 3 app tokens
    const appTokens = [];
    const appNames = ["app1", "app2", "app3"];

    for (const appName of appNames) {
        const data = {
            appname: appName,
            userdevtoken: developerToken._id
        }

        const appToken = await sendRequest({
            url: "/v1Priv/post/newAppToken",
            method: "POST",
            body: data
        })

        appTokens.push(appToken);
    }

    const loginAppData = [];
    // sign in with each of the apps
    headersBasic.username = userBody.username;
    headersBasic.password = userBody.password;

    for (const appData of appTokens) {
        headersBasic.devToken = appData.devToken;
        headersBasic.appToken = appData._id;

        const login = await sendRequest({
            url: `/v1/auth/userLogin/`,
            method: 'GET'
        })

        loginAppData.push(login);
    }

    // replaces headers to default
    headersBasic.username = null;
    headersBasic.password = null;
    headersBasic.devToken = mainHeaderData.devToken;
    headersBasic.appToken = mainHeaderData.appToken;

    // subscribe to own user
    const subRes = await sendRequest({
        url: `/v1/subscriptions/sub/${loginData.userID}`,
        method: "POST"
    });

    // create replies and quotes
    const repliesAndQuotes = [];
    for (var i=0; i<10;i++) {
        const postID = postData[i]._id;

        const postBody = {
            content: `Test ${i} with ${postID}`,
            userID: loginData.userID,
            replyingPostID: (i<=5) ? postID : null,
            quoteReplyPostID: (i>=5) ? postID : null
        }

        const postRes = await sendRequest({
            url: "/v1/post/createPost",
            method: "POST",
            body: postBody,
        });

        repliesAndQuotes.push(postRes);
    }

    // reply + quote to preexisting post
    const existingPostID = "31634504-da46-4d77-8c44-5dde281bbe32";

    const postBody = {
        content: `Test existing with ${existingPostID}`,
        userID: loginData.userID,
        replyingPostID: existingPostID,
        quoteReplyPostID: existingPostID
    }

    const postRes = await sendRequest({
        url: "/v1/post/createPost",
        method: "POST",
        body: postBody,
    });

    repliesAndQuotes.push(postRes);

    return {
        publicData: {
            loginData,
            userData,
            subRes
        },
        privateData: {
            userPrivData
        },
        developerData: {
            developerToken,
            appTokens,
            loginAppData
        },
        posts: {
            postData,
            repliesAndQuotes
        }
    }

    // ceate 1 login item (done)
    // create 1 dev token (done)
    // create 1 app token (done)
    // create 10 posts (done)
    // create 5 polls
    // create 5 replies to a ceritain post (done)
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
        headers : headers ? headers : headersBasic
    });
    
    try {
        const data = await res.json();
        return data;
    } catch (err) {
        return { error: "error parsing json" };
    }
}

module.exports = {
    demoCreate
}