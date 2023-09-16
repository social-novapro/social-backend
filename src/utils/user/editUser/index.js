const { v4: uuidv4 } = require("uuid");
const interactThemeSchema = require("../../../schemas/client/interactThemeSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { searchErrorV2 } = require("../../searchError");
const { checktime } = require("../../checktime");

const possibleThemes = [
    { name: "Post", option: "posts", description: "This will be the post theme of your posts." },
    { name: "Background", option: "background", description: "This will be the main theme of your client." }
]

function isHexColor (hex) {
    return typeof hex === 'string'
        && hex.length === 6
        && !isNaN(Number('0x' + hex))
}

/* creates new theme for user */
async function createTheme({ userID, name, privacy, forkID }) {
    const themeID = uuidv4();

    // creates index
    await interactThemeSchema.create({
        _id: themeID,
        theme_name: name ? name : "Untitled Theme",
        userID: userID,
        timestamp: checktime(),
        theme_fork: forkID ? forkID : null,
        privacy: privacy ? privacy : 1,
    });

    // add fork data
    if (forkID) {
        const forkedTheme = await getTheme({themeID: forkID, requestingUser: userID});
        if (forkedTheme.error) {
            await interactThemeSchema.deleteOne({ _id: themeID });
            return searchErrorV2("S006", { userID });
        }; // wont fork

        const forkedThemeData = forkedTheme.colourTheme;
        await interactThemeSchema.findOneAndUpdate({ _id: themeID }, { $set : { colourTheme: forkedThemeData }});
    }


    await setAsDefaultTheme({ userID, themeID });

    // returns new theme
    const foundTheme = await interactThemeSchema.findOne({ _id: themeID });
    return foundTheme;
}

/* sets theme as default for user */
async function setAsDefaultTheme({ userID, themeID }) {
    const themeData = await getTheme({themeID: themeID, requestingUser: userID });
    if (themeData.error) return themeData;

    await interactUserSchema.findOneAndUpdate({ _id: userID }, { $set : { themeData: { themeID: themeID } }});
    
    return themeData;
}

/* edits theme for user */
async function editTheme({userID, options, themeID }) {
    var themeData;
    if (!themeID) themeData = await getUserTheme({userID, requestingUser: userID});
    else themeData = await getTheme({themeID: themeID, requestingUser: userID});
    if (themeData.error) return themeData;

    if (themeData.userID !== userID) return searchErrorV2("S007", { userID });

    // generating possible themes
    const editableAttributes = []
    for (const option of possibleThemes) {
        editableAttributes.push(option.option);
    }

    // current themes
    var colourThemes = {};
    if (!themeData.colourTheme) colourThemes = {};
    else colourThemes = themeData.colourTheme;

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

    if (!foundOption) return searchErrorV2("S008", { userID });
    //console.log(colourThemes)
    //await interactUserSchema.findOneAndUpdate({ _id: userID }, { $set : { colourTheme: colourThemes }})
    await interactThemeSchema.findOneAndUpdate({ _id: themeID }, { $set : { colourTheme: colourThemes }});

    //await interactUserSchema.findOneAndUpdate({ _id: userID }, { $set : { colourTheme: colourThemes }})
    //const newUserData = await interactUserSchema.findOne({ _id: userID });
    const newThemeData = await getTheme({themeID: themeData._id, requestingUser: userID});

    return newThemeData
}

/* gets theme */
async function getTheme({themeID, requestingUser, careEmpty}) {
    const themeData = await interactThemeSchema.findOne({ _id: themeID });
    if (!themeData || careEmpty && !themeData.colourTheme) return searchErrorV2("S005", { userID: requestingUser });

    const validated = await validateTheme({theme: themeData, requestingUser});
    return validated;
    //if (validated && !validated.error) return validated;
    //else return {error:true};
}

/* gets user themes */
async function getUserThemes({userID, requestingUser}) {
    //const themeData = await interactThemeSchema.findOne({ _id: themeID });
    const themes = await interactThemeSchema.find({ userID });
    if (!themes || !themes[0]) return searchErrorV2("S003", { userID });

    const finalThemes = [];
    for (const theme of themes) {
        const validatedTheme = await validateTheme({theme, requestingUser});
        if (validatedTheme && !validatedTheme.error) finalThemes.push(validatedTheme);
    }

    if (!finalThemes || !themes[0]) return searchErrorV2("S002", { userID: requestingUser });
    return finalThemes;
}

/* validates theme, makes sure user is allowed to view */
async function validateTheme({theme, requestingUser}) {
    if (theme.privacy === 1) return theme;
    if (theme.privacy === 2) {
        // code here ig, for when feature comes
    }
    if (theme.privacy === 3) {
        if (theme.userID === requestingUser) return theme;
    }
    
    return searchErrorV2("S002", { userID: requestingUser });
}

/* gets main user theme */
async function getCurrentTheme({userID}) {
    const userData = await interactUserSchema.findOne({ _id: userID });
    if (!userData || !userData.themeData?.themeID) return searchErrorV2("S004", { userID });

    const themeData = await getTheme({themeID: userData.themeData.themeID, userID});
    if (themeData.error) return themeData;
    return themeData;
}

module.exports = { 
    createTheme,
    editTheme, 
    getTheme,
    getUserThemes,
    getCurrentTheme,
    possibleThemes
}
