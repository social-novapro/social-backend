const interactUserSchema = require("../../../schemas/interactUserSchema");
const { searchErrorV2 } = require("../../searchError");

const possibleThemes = [
    { name: "Post", option: "posts", description: "This will be the post theme of your posts." },
    { name: "Background", option: "background", description: "This will be the main theme of your client." }
]

function isHexColor (hex) {
    return typeof hex === 'string'
        && hex.length === 6
        && !isNaN(Number('0x' + hex))
}

async function editTheme({userID, options }) {
    const data = options;

    // generating possible themes
    const editableAttributes = []
    for (const option of possibleThemes) {
        editableAttributes.push(option.option);
    }
  
    // checking for user
    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData) return searchErrorV2("C009", { userID });

    // current themes
    var colourThemes = {};
    if (!userData.colourTheme) colourThemes = {};
    else colourThemes = userData.colourTheme;

    //console.log(colourThemes)

    // find if any of the themes are in editing
    
    var foundOption = false;
    var foundOptions = {};
    var validOptions = {};

    for (const option of options) {
        if (!editableAttributes.includes(option.option)) continue;
        foundOption = true;
        foundOptions[option.option] = option.value;
        validOptions[option.option] = true;
        colourThemes[option.option] = option.value;

    }

    if (!foundOption) return searchErrorV2("C011", { userID });
    //console.log(colourThemes)
    await interactUserSchema.findOneAndUpdate({ _id: userID }, { $set : { colourTheme: colourThemes }})

    const newUserData = await interactUserSchema.findOne({ _id: userID });
    return newUserData
}

async function getThemes({userID}) {
    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData || !userData.colourTheme) return searchErrorV2("C009", { userID });
    return userData.colourTheme;
}

module.exports = { editTheme, getThemes, possibleThemes }
