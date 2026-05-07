const router = require('express').Router();
const bodyParser = require('body-parser');
const { searchErrorV2 } = require('../../utils/searchError');
const { whichEnv } = require('../../../runMode/whichEnv');
require('dotenv').config({ path: whichEnv()})

// Legacy Routes Imports (still used)
const getAPI = require('./get');
const postAPI = require('./post');

// Feature Routes Imports
const serverStatus = require('./serverStatus');
const authAPI = require('./auth');
const adminAPI = require('./admin');
const polls = require('./polls');
const emails = require('./emails');
const users = require('./users');
const posts = require('./posts');
const notifications = require('./notifications');
const feeds = require('./feeds');
const search = require('./search');
const { createProxyMiddleware } = require('http-proxy-middleware');
const articles = require('./articles');

// Legacy Routes (still used)
router.use('/get', getAPI);
router.use('/post', postAPI);

// Feature Routes
router.use('/serverStatus', serverStatus);
router.use('/auth', authAPI);
router.use('/admin', adminAPI);  
router.use('/polls', polls);
router.use('/emails', emails);
router.use('/users', users);
router.use('/posts', posts);
router.use('/subscriptions', notifications);
router.use('/notifications', notifications);
router.use('/feeds', feeds);
router.use('/search', search);

// re-routes
router.use('/ai', async (req, res, next) => {
    let targetService = `${process.env.AI_INTERFACE_SERVICE}/v1`//"http://localhost:5004/v1"; // AI service
    console.log("Proxying request to AI service")
    try {
        createProxyMiddleware({
            target: targetService,
            changeOrigin: true,
            selfHandleResponse: false, // Let the backend handle the response
            on: {
                proxyReq: (proxyReq, req, res) => {
                    console.log("Forwarding request to AI service")
                    // Forward request headers
                    Object.keys(req.headers).forEach((key) => {
                        proxyReq.setHeader(key, req.headers[key]);
                    });

                    // Forward request body
                    if (req.body) {
                        console.log("Forwarding request body to AI service")
                        const bodyData = JSON.stringify(req.body);
                        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                        proxyReq.write(bodyData);
                        proxyReq.end(); // Ensure the request is completed
                    }
                }
            },
        })(req, res, next);
    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// re-routes
router.use('/cdn', bodyParser.json(), async (req, res, next) => {
    let targetService = `${process.env.CDN_SERVICE}/v1`//"http://localhost:5004/v1"; // AI service
    console.log("Proxying request to CDN service")
    try {
        createProxyMiddleware({
            target: targetService,
            changeOrigin: true,
            selfHandleResponse: false, // Let the backend handle the response
            onProxyReq: (proxyReq, req, res) => {
                // req.pipe(proxyReq); // Stream request directly

                // Forward request headers
                Object.keys(req.headers).forEach((key) => {
                    proxyReq.setHeader(key, req.headers[key]);
                });
            },
        })(req, res, next);
    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// re-routes
router.use('/video_embed', bodyParser.json(), async (req, res, next) => {
    let targetService = `${process.env.VIDEO_EMBED}`
    console.log("Proxying request to video embed service")
    try {
        createProxyMiddleware({
            target: targetService,
            changeOrigin: true,
            selfHandleResponse: false, // Let the backend handle the response
            onProxyReq: (proxyReq, req, res) => {
                // Forward request headers
                Object.keys(req.headers).forEach((key) => {
                    proxyReq.setHeader(key, req.headers[key]);
                });
            },
        })(req, res, next);
    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.use('/articles', articles);

// Legacy Routes
// GET
router.get('/get/allPosts/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I008", { userID: req.headers.userid }));
})
router.get('/get/bookmarks/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I012", {userID: req.headers.userid}));
});
router.get('/get/notifications/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I007",{ userID: req.headers.userid }));
});
router.get('/get/post/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2('I009', { userID: req.headers.userid }))
})
router.get('/get/postEditHistory/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I016", { userID: req.headers.userid }));
})
router.get('/get/postLikedBy/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I015", { userID: req.headers.userid }));
});
router.get('/get/postReplies/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I018", { userID: req.headers.userid }))
})
router.get('/get/subscriptions/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I003", { userID: req.headers.userid }));
});
router.get('/get/userFeed/:userid', async (req, res) => {
    return res.status(400).send(searchErrorV2("I002", { userID: req.headers.userid }));
})
router.get('/get/search/', async (req, res) => {
    // // redirect to new search via code
    // const result = await fetch('http://127.0.0.1:5002/v1/search/v1', { method: 'GET', headers: req.headers });
    // const data = await result.json();
    // if (data.error) return res.status(400).send(data);
    // return res.status(200).send(data);   
    return res.status(400).send(searchErrorV2("I020", { userID: req.headers.userid }));
});
router.get('/get/taguserSearch/', async (req, res) => {
    return res.status(400).send(searchErrorV2('I021', { userID: req.headers.userid }));
});
router.get("/get/user/:userID", async (req, res) => {
    return res.status(400).send(searchErrorV2('I022', { userID: req.headers.userid}))
})
router.get("/get/userByID/:userID", async (req, res) => {
    return res.status(400).send(searchErrorV2('I023', { userID: req.headers.userid}))
})
router.get("/get/username/:username", async (req, res) => {
    return res.status(400).send(searchErrorV2('I024', { userID: req.headers.userid}))
})
router.get('/get/following/:userID', async (req, res) => {
    return res.status(400).send(searchErrorV2('I025', { userID: req.headers.userid})) 
});
router.get('/get/followers/:userID', async (req, res) => {
    return res.status(400).send(searchErrorV2('I026', { userID: req.headers.userid})) 
});
// POST
router.post('/post/createPost/', async (req, res) => {
    return res.status(400).send(searchErrorV2('I010', { userID: req.headers.userid }))
});
router.post('/post/savePost/', async (req, res) => {
    return res.status(400).send(searchErrorV2('I011', { userID: req.headers.userid }));
});
router.post('/post/subUser/:subUserID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I004", { userID: req.headers.userid }));
});
router.post('/post/followUser/:followUserID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I027", { userID: req.headers.userid }));
});
// DELETE
router.delete('/delete/dismissNotification/:notificationID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I006", { userID : req.headers.userid }));
})
router.delete('/delete/removePost/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I013", {userID: req.headers.userid}));
})
router.delete('/delete/unlikePost/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I014", { userID: req.headers.userid }))
})
router.delete('/delete/unsubUser/:unsubUserID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I005", { userID: req.headers.userid }));
});
router.delete('/delete/unfollowUser/:unfollowUserID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I028", { userID: req.headers.userid }));
});
// PUT
router.put('/put/editPost/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I019", { userID: req.headers.userid }));
})
router.put('/put/likePost/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I017", { userID: req.headers.userid }));
})
router.put('/put/userEdit/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I029", { userID: req.headers.userid }));
})
router.put('/put/editUsername/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I030", { userID: req.headers.userid }));
})
router.put('/put/editDisplayname/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I031", { userID: req.headers.userid }));
})


module.exports = router;
