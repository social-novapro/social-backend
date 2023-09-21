const { v4: uuidv4 } = require("uuid");
const interactThemeSchema = require("../../../schemas/client/interactThemeSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { searchErrorV2 } = require("../../searchError");
const { checktime } = require("../../checktime");
const interactThemeIndexSchema = require("../../../schemas/client/interactThemeIndexSchema");
const { getThemeIndex, updateThemeIndex } = require("../../indexes");

const possibleThemes = [
    { name: "Post", option: "posts", description: "This will be the post theme of your posts." },
    { name: "Background", option: "background", description: "This will be the main theme of your client." },
    { name: "Navigation", option: "navigation", description: "This will be the theme of your navigation in your client." },
    { name: "Secondary Navigation", option: "navSecondary", description: "This will be the secondary theme of your navigation in your client." },
    { name: "Menu", option: "menu", description: "This will be the theme of your menus in your client." },
    { name: "Menu Button", option: "menuButton", description: "This will be the theme of your menu buttons in your client." },
]

/* these must always be set */
var currentCount = 0;
var currentIndex = null;
var currentIndexID = null;

function isHexColor(str) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(str);
}

/* creates new index */
async function createIndex({ prevIndexID }) {
    const indexID = uuidv4();

    currentCount = 0;
    currentIndexID = indexID;

    await interactThemeIndexSchema.create({
        _id: indexID,
        timestamp: checktime(),
        amount: 0,
        prevIndexID: prevIndexID ? prevIndexID : null
    });

    if (prevIndexID) {
        await interactThemeIndexSchema.findOneAndUpdate({
            _id: prevIndexID
        }, {
            nextIndexID: indexID
        });
    }

    await updateThemeIndex({ indexID });
    return indexID;
}

/* prepares a list of themes for discovery */
async function exportIndex({ userID, indexID }) {
    var usingIndexID = indexID;
    if (!usingIndexID) usingIndexID = currentIndexID;
    
    var returnData = {
        indexID: usingIndexID,
        nextIndexID: null,
        prevIndexID: null,
        themes: []
    }
    const indexData = await interactThemeIndexSchema.findOne({ _id: usingIndexID });
    if (!indexData || !indexData) return null;

    returnData.nextIndexID = indexData.nextIndexID;
    returnData.prevIndexID = indexData.prevIndexID;

    for (const themeID of indexData.themeIDs) {
        const themeData = await getTheme({ themeID: themeID._id, requestingUser: userID  });
        if (!themeData) continue;
        returnData.themes.push(themeData);
    }
};

/* gets current index, and sets file variables */
async function getCurrentIndex() {
    currentIndexID = await getThemeIndex();
    
    if (!currentIndexID) currentIndexID = await createIndex({});

    currentIndex = await interactThemeIndexSchema.findOne({ _id: currentIndexID });
    if (!currentIndex) currentIndexID = await createIndex({});

    currentCount = currentIndex.amount;
    currentIndexID = currentIndex._id;
}

/* adds themeID to index */
async function addToIndex({ themeID }) {
    if (!currentIndex) await getCurrentIndex();
    const usedIndexID = currentIndexID;

    currentCount++;

    // updates count and adds theme
    await interactThemeIndexSchema.findOneAndUpdate({
        _id: currentIndexID
    }, {
        amount: currentCount,
        $push: { "themeIDs" : {
            _id: themeID
        }}
    });

    if (currentCount >= 50) {
        const indexIDnew = await createIndex({ prevIndexID: currentIndexID });
        currentIndex = await interactThemeIndexSchema.findOne({ _id: indexIDnew });

    }

    return usedIndexID;
}

async function removeFromIndex({ userID, themeID }) {
    const themeData = await getTheme({ themeID, requestingUser: userID });
    if (!themeData) return searchErrorV2("S013", { userID });
    if (!themeData.indexID) return searchErrorV2("S014", { userID });

    await interactThemeIndexSchema.findOneAndUpdate({
        _id: themeData.indexID
    }, {
        $pull: { "themeIDs" : {
            _id: themeID
        }}
    });

    return { "success": true };
}

/* creates new theme for user */
async function createTheme({ userID, name, privacy, forkID }) {
    if (!currentIndex) await getCurrentIndex();

    const themeID = uuidv4();
    const usedIndexID = await addToIndex({ themeID });

    // creates index
    await interactThemeSchema.create({
        _id: themeID,
        userID: userID,
        indexID: usedIndexID,
        theme_name: name ? name : "Untitled Theme",
        timestamp: checktime(),
        timestamp_edited: checktime(),
        locked: false,
        theme_fork: forkID ? forkID : null,
        privacy: privacy ? privacy : 1,
    });

    // add fork data
    if (forkID) {
        const forkedTheme = await getTheme({ themeID: forkID, requestingUser: userID });
        if (forkedTheme.error) {
            await interactThemeSchema.deleteOne({ _id: themeID }); // deletes new
            return searchErrorV2("S006", { userID });
        }; // wont fork

        const forkedThemeData = forkedTheme.colourTheme; // gets theme data
        await interactThemeSchema.findOneAndUpdate({ _id: themeID }, { $set : { colourTheme: forkedThemeData }});
    }

    await setAsDefaultTheme({ userID, themeID });

    // returns new theme
    const foundTheme = await interactThemeSchema.findOne({ _id: themeID });
    return foundTheme;
}

/* deletes theme for user */
async function deleteTheme({ userID, themeID }) {
    const themeData = await getTheme({themeID: themeID, requestingUser: userID });
    if (themeData.error) return themeData;

    if (themeData.locked) return searchErrorV2("S011", { userID });
    if (themeData.userID !== userID) return searchErrorV2("S012", { userID });

    await removeFromIndex({ userID, themeID });
    await interactThemeSchema.findOneAndDelete({ _id: themeID });
    await unsetUserTheme({ userID, themeID });

    // TODO: unset theme for all users using theme
    // can add an array with all users using theme inside theme schema

    return themeData;
}

/* sets theme for user, to be used by router */
async function setUserTheme({ userID, themeID }) {
    const changeTheme = await setAsDefaultTheme({ userID, themeID });
    if (changeTheme.error) return changeTheme;
    return changeTheme;
}

/* unsets theme for user */
async function unsetUserTheme({ userID }) {
    const currentUser = await interactUserSchema.findOne({ _id: userID });
    if (!currentUser) return searchErrorV2("S013", { userID });
    if (!currentUser.themeData) return searchErrorV2("S013", { userID });
    if (!currentUser.themeData.themeID) return searchErrorV2("S013", { userID });

    await interactUserSchema.findOneAndUpdate({ _id: userID }, { $set : { themeData: { themeID: null } }});
    return {success: true};
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

    if (!themeID) themeData = await getCurrentTheme({userID, requestingUser: userID});
    else themeData = await getTheme({themeID: themeID, requestingUser: userID});

    if (themeData.error) return themeData;

    // check if user is allowed to edit
    if (themeData.userID !== userID) return searchErrorV2("S007", { userID });
    var changedData = false;

    if (themeData.locked) return searchErrorV2("S010", { userID });

    // generating possible themes
    const editableAttributes = []
    for (const option of possibleThemes) {
        editableAttributes.push(option.option);
    }

    // current themes
    var colourThemes = {};
    if (!themeData.colourTheme) colourThemes = {};
    else colourThemes = themeData.colourTheme;

    // find if any of the themes are in editing
    
    var foundOption = false;
    var foundOptions = {};
    var validOptions = {};

    for (const option of options) {
        if (option.option === "name") {
            // change name
            if (option.value !== themeData.theme_name) {
                await interactThemeSchema.findOneAndUpdate({ _id: themeID }, { $set : { theme_name: option.value }});
                changedData = true;
            }
            continue;
        }
        if (option.option === "privacy") {
            // change name
            if (option.value !== themeData.privacy) {
                await interactThemeSchema.findOneAndUpdate({ _id: themeID }, { $set : { privacy: option.value }});
                changedData = true;
            }
            continue;
        }
        if (option.option === "locked") {
            // change name
            if (option.value == true) {
                // can lock theme
                await interactThemeSchema.findOneAndUpdate({ _id: themeID }, { locked: option.value });
                changedData = true;
            }
            continue;
        }

        if (!editableAttributes.includes(option.option)) continue;
        if (!isHexColor(option.value)) continue;

        foundOption = true;
        foundOptions[option.option] = option.value;
        validOptions[option.option] = true;
        colourThemes[option.option] = option.value;
    }

    if (foundOption) {
        await interactThemeSchema.findOneAndUpdate({ 
            _id: themeID 
        }, { 
            $set : { 
                colourTheme: colourThemes 
            },  
            timestamp_edited: checktime() 
        });
    };

    // nothing was updated
    if (!foundOption && !changedData) return searchErrorV2("S008", { userID });

    const newThemeData = await getTheme({themeID: themeData._id, requestingUser: userID});
    return newThemeData
}

/* gets theme */
async function getTheme({themeID, requestingUser, careEmpty}) {
    const themeData = await interactThemeSchema.findOne({ _id: themeID });
    if (!themeData || careEmpty && !themeData.colourTheme) return searchErrorV2("S005", { userID: requestingUser });

    const validated = await validateTheme({theme: themeData, requestingUser});
    return validated;
}

/* gets user themes */
async function getUserThemes({userID, requestingUser}) {
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

    const themeData = await getTheme({themeID: userData.themeData.themeID, requestingUser: userID});
    if (themeData.error) return themeData;
    return themeData;
}

module.exports = { 
    createTheme,
    deleteTheme,
    editTheme, 
    getTheme,
    exportIndex,
    getUserThemes,
    getCurrentTheme,
    setUserTheme,
    unsetUserTheme,
    possibleThemes
}
