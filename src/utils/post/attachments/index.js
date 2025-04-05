const interactPostSchema = require("../../../schemas/interactPostSchema");
const { current } = require('../../../../config.json');
const { v4: uuidv4 } = require('uuid');

// add attachments
async function addAttachments(content) {
    if (!content || content == '') return {
        ogContent: content,
        attachments: [],
        newContent: content,
    };

    const spotifyIncludedAttachments = await getSpotifyEmbeds(content);
    const foundAttachments = await checkForAttachments(content, spotifyIncludedAttachments.spotifyEmbeds);

    return {
        ogContent: content,
        attachments: foundAttachments,
        newContent: spotifyIncludedAttachments.newText,
    }
}


// delete attachments
async function removeAttachments({ postID }) {
    const foundPost = await interactPostSchema.findOne({ _id: postID });
    if (!foundPost) return { error: "Post not found" };
    const attachments = foundPost.attachments;
    if (!attachments || attachments.length == 0) return { error: "No attachments found" };

    await interactPostSchema.findOneAndUpdate(
        { _id: postID },
        { $set: { attachments: [] } },
        { upsert: true }
    );
    return { success: true };
}

// edit attachments
async function editAttachments({ postID, content }) {
    if (!content || content == '') return {
        ogContent: content,
        attachments: [],
        newContent: content,
    };

    const removedAttachments = await removeAttachments({ postID });
    if (removedAttachments.error) console.log(removedAttachments);
    const newAttachments = await addAttachments(content);
    return newAttachments;
}


function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (!match || match.length < 2) return undefined;

    return (match && match[2].length === 11) ? match[2] : undefined;
}

async function checkForAttachments(content) {
    const imageFormats = ['.jpg', '.png','.jpeg', '.svg', '.gif']
    const videoFormats = [{'urlEnd': '.mp4', "type": 'mp4'}, {'urlEnd':'.mov','type':'mp4'}, {'urlEnd':'.ogg', 'type': 'ogg'}]

    if (!content) return '';
    const contentArgs = content.split(/[ ]+/)
    var foundImage = false
    var foundSpotifys = 1

    var attachments = []
    for (index = 0; index < contentArgs.length; index++) {
        if (contentArgs[index].startsWith('https://') || (current == 'dev' && contentArgs[index].startsWith('http://'))) {
            for (const imageFormat of imageFormats) {
                if (contentArgs[index].endsWith(imageFormat)) {
                    foundImage = true

                    if (contentArgs[index].startsWith("http://localhost:5002/v1/cdn/static") || contentArgs[index].startsWith("https://interact-api.novapro.net/v1/cdn/static")) {
                        attachments.push({
                            _id: uuidv4(),
                            index: index,
                            type: 'image',
                            host: 'interact',
                            url: contentArgs[index],
                            vuid: contentArgs[index].includes("http://localhost:5002/") ? contentArgs[index].replace("http://localhost:5002/v1/cdn/static/", "") : contentArgs[index].replace("https://interact-api.novapro.net/v1/cdn/static/", "")
                        })
                    } else {
                        attachments.push({
                            _id: uuidv4(),
                            index: index,
                            type: 'image',
                            url: contentArgs[index]
                        })
                    }
                }
            }

            const videoId = getId(contentArgs[index]);
            var foundVideo = false;
            for (const videoFormat of videoFormats) {
                if (foundVideo || !contentArgs[index].includes(videoFormat.urlEnd)) {
                }
                else if (contentArgs[index].startsWith("http://localhost:5002/v1/cdn/static")) {
                    foundImage = true
                    foundVideo = true
                    attachments.push({
                        _id: uuidv4(),
                        index: index,
                        type: 'video',
                        host: 'interact',
                        url: contentArgs[index],
                        vuid: contentArgs[index].replace("http://localhost:5002/v1/cdn/static/", "")
                    })
                }
                else if (contentArgs[index].startsWith("https://interact-api.novapro.net/v1/cdn/static")) {
                    foundImage = true
                    foundVideo = true
                    attachments.push({
                        _id: uuidv4(),
                        index: index,
                        type: 'video',
                        host: 'interact',
                        url: contentArgs[index],
                        vuid: contentArgs[index].replace("https://interact-api.novapro.net/v1/cdn/static/", "")
                    })
                }
                else if (contentArgs[index].endsWith(videoFormat.urlEnd)) {
                    // regular video 
                    foundImage = true
                    foundVideo = true
                    attachments.push({
                        _id: uuidv4(),
                        index: index,
                        type: 'video',
                        host: 'unknown',
                        url: contentArgs[index]
                    })
                }
            }

            if (videoId) {
                foundImage = true
                attachments.push({
                    _id: uuidv4(),
                    index: index,
                    type: 'video',
                    host: 'youtube',
                    url: contentArgs[index],
                    vuid: videoId
                })
            }

            if (contentArgs[index].startsWith("https://huelet.net/w/")) {
                foundImage = true

                const URL = contentArgs[index]
                var videoID = URL.replace("https://huelet.net/w/", "")

                attachments.push({
                    _id: uuidv4(),
                    index: index,
                    type: 'video',
                    host: 'huelet',
                    url: contentArgs[index],
                    vuid: videoID,
                })
            } 

            if (contentArgs[index].startsWith("https://open.spotify.com/embed/")) {
                foundImage = true
                attachments.push({
                    _id: uuidv4(),
                    index: index,
                    type: 'spotify',
                    url: contentArgs[index]
                })
            }
        }
    }

    return attachments;
}

async function getSpotifyEmbeds(text) {
    const spotifyRegex = /(?:https?:\/\/(?:open\.spotify\.com|spotify\.link)\/(?:embed\/)?[a-zA-Z0-9]+\/?[a-zA-Z0-9_-]*)/g;
    const spotifyLinks = text.matchAll(spotifyRegex);

    if (!spotifyLinks) return text;
    
    var newText = text;
    const spotifyEmbeds = [];
    var currentNumber = 0;
    for (const link of spotifyLinks) {
        const spotifyActualURL = link[0];
        spotifyURL = spotifyActualURL.replace("https://", "")
        if (spotifyURL.includes("/embed")) spotifyURL = spotifyURL.replace("/embed", "");

        var spotifySeperations = spotifyURL.split("/");

        var spotifyType = ""
        var spotifyID = ""

        if (spotifyURL.includes("open.spotify")) {
            spotifyType = spotifySeperations[1];
            spotifyID = spotifySeperations[2];
        } else if (spotifyURL.includes("spotify.link")) {
            const res = await fetch(`https://${spotifyURL}`)
            const html = await res.text()

            spotifyURL = html.split('You can also <a class="secondary-action" href="')[1].split('">open this link in your browser.</a>')[0].split("?")[0];
            spotifyURL = spotifyURL.replace("https://", "")
            spotifySeperations = spotifyURL.split("/")

            spotifyType = spotifySeperations[1];
            spotifyID = spotifySeperations[2];
        }

        var spotifyEmbed = `https://open.spotify.com/embed/${spotifyType}/${spotifyID}`;
        spotifyEmbeds.push(spotifyEmbed);
        newText = newText.replace(spotifyActualURL, `{{spotify_${currentNumber}}}`);

        currentNumber++
    }
    
    for (var i = 0; i < spotifyEmbeds.length; i++) {
        newText = newText.replace(`{{spotify_${i}}}`, spotifyEmbeds[i]);
    }

    return {newText, spotifyEmbeds};
}

module.exports = {
    addAttachments,
    removeAttachments,
    editAttachments
}
