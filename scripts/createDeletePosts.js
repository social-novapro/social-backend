require('dotenv').config({ path: 'secret.env' })

const {
    INTERACT_ACCESS_TOKEN,
    INTERACT_APP_TOKEN,
    INTERACT_DEV_TOKEN,
    INTERACT_USER_ID,
    INTERACT_USER_TOKEN
} = process.env;

const fakePosts = [
    "Just whipped up the most delicious avocado toast! Who needs fancy brunch spots when you can DIY?",
    "Reached a new personal record at the gym today! Feeling unstoppable!",
    "Trying out a new skincare routine tonight. Fingers crossed for that glow!",
    "Can't get enough of this cozy rainy day vibe. Perfect excuse for a movie marathon!",
    "Feeling inspired after attending a thought-provoking TED talk. Ready to change the world!",
    "Just adopted the sweetest rescue pup! Meet our newest family member, Bella.",
    "Obsessed with this new book I'm reading. Who else loves getting lost in a good story?",
    "Spent the day exploring hidden gems in the city. It's amazing what you can discover in your own backyard!",
    "Cooking up a storm in the kitchen tonight. Who wants to come over for dinner?",
    "Finally mastered that tricky yoga pose I've been working on. Namaste, everyone!",
    "Channeling my inner artist with a DIY painting session. Who knew creativity could be so therapeutic?",
    "Just finished a 10k run for charity. Nothing beats the feeling of giving back!",
    "Feeling grateful for good friends and spontaneous adventures. Life is meant to be lived!",
    "Attempting a digital detox this weekend. Time to unplug and reconnect with the real world.",
    "Transformed my balcony into a mini oasis with plants and fairy lights. So serene!",
    "Trying out a plant-based diet for the week. Wish me luck on this veggie journey!",
    "Embarking on a solo travel adventure. Ready to embrace new cultures and make unforgettable memories!",
    "Indulging in some self-care Sunday rituals. Face masks, bubble baths, and all the pampering!",
    "Just signed up for a photography class. Excited to capture the beauty of everyday moments!",
    "Spontaneous road trip with no destination in mind. Sometimes you just have to go where the wind takes you!",
    "Stumbled upon a quaint little bookstore and couldn't resist buying a stack of new reads. Bookworm bliss!",
    "Feeling rejuvenated after a weekend retreat in nature. Nothing like fresh air and scenic views to recharge the soul.",
    "Cooking up a storm in the kitchen tonight. Who wants to come over for dinner?",
    "Finally conquered my fear of public speaking. It's amazing what you can achieve when you step out of your comfort zone!",
    "Savoring every moment of this lazy Sunday morning. Coffee, pajamas, and no agenda. Perfection!",
    "Just finished a DIY home renovation project. Who knew I had such handy skills?",
    "Embarking on a 30-day fitness challenge. Time to level up and crush those goals!",
    "Feeling nostalgic listening to old school jams from my high school days. Music truly is timeless.",
    "Just enrolled in a cooking class to expand my culinary skills. Watch out, Gordon Ramsay!",
    "Spending the day volunteering at a local animal shelter. Nothing warms the heart quite like furry cuddles.",
    "Impromptu picnic in the park with friends. Sunshine, snacks, and laughter – what more could you ask for?",
    "Ventured off the beaten path and discovered a hidden waterfall. Nature truly is awe-inspiring!",
    "Just finished a DIY home renovation project. Who knew I had such handy skills?",
    "Embarking on a 30-day fitness challenge. Time to level up and crush those goals!",
    "Feeling nostalgic listening to old school jams from my high school days. Music truly is timeless.",
    "Just enrolled in a cooking class to expand my culinary skills. Watch out, Gordon Ramsay!",
    "Spending the day volunteering at a local animal shelter. Nothing warms the heart quite like furry cuddles.",
    "Impromptu picnic in the park with friends. Sunshine, snacks, and laughter – what more could you ask for?",
    "Ventured off the beaten path and discovered a hidden waterfall. Nature truly is awe-inspiring!",
    "Indulging in some retail therapy today. Sometimes a little shopping spree is all you need to lift your spirits!",
    "Just binge-watched an entire season of my favorite TV show. The ultimate lazy day indulgence!",
    "Feeling inspired after attending a motivational seminar. Ready to chase my dreams with renewed vigor!",
    "Treating myself to a spa day because self-love is the best love.",
    "Exploring a new hobby: pottery! Who knew playing with clay could be so therapeutic?",
    "Just booked a spontaneous getaway to recharge and unwind. Adventure awaits!",
    "Whipping up a batch of homemade cookies to satisfy my sweet tooth. Who wants to join me for a baking session?",
    "Reflecting on the simple joys of life today. Sometimes it's the little things that bring the most happiness.",
    "Embarking on a digital decluttering spree. Out with the old, in with the organized!",
    "Enjoying a lazy Sunday brunch with bottomless mimosas. Because why not?",
    "Feeling grateful for good health, good friends, and the endless possibilities the future holds. Here's to making every moment count!"
];

async function createPosts() {
    const postIDs = [];
    for (const post of fakePosts) {
        const postID = await sendRequest(post);
        postIDs.push(postID);
    }

    
    // for (const postID of postIDs) {
    //     await delPost(postID);
    // }
}

async function sendRequest(content) {
    const test = await fetch("http://localhost:5002/v1/posts/create", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,fr;q=0.8",
            "content-type": "application/json",
            "accesstoken": INTERACT_ACCESS_TOKEN,
            "apptoken": INTERACT_APP_TOKEN,
            "devtoken": INTERACT_DEV_TOKEN,
            "userid": INTERACT_USER_ID,
            "usertoken": INTERACT_USER_TOKEN,
            "sec-ch-ua": "\"Google Chrome\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "Referer": "http://localhost:5500/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": "{\"userID\":\"53f53307-e2f4-4451-afe5-73d76cb86b71\",\"content\":\""+content+"\",\"linkedPollID\":null}",
        "method": "POST"
    });

    const result = await test.json();
    console.log(result);
    return result._id;
}

async function delPost(postID) {
    const test = await fetch("http://localhost:5002/v1/posts/remove/"+postID, {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9,fr;q=0.8",
          "content-type": "application/json",
          "accesstoken": INTERACT_ACCESS_TOKEN,
          "apptoken": INTERACT_APP_TOKEN,
          "devtoken": INTERACT_DEV_TOKEN,
          "userid": INTERACT_USER_ID,
          "usertoken": INTERACT_USER_TOKEN,
          "sec-ch-ua": "\"Google Chrome\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "Referer": "http://localhost:5500/",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "DELETE"
    });
    const result = await test.json();
    console.log(result);
    return true;
}

async function startTest() {
    await createPosts();
}

startTest()

