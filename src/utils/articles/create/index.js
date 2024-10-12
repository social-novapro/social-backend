const { v4: uuidv4 } = require('uuid');
const { checktime } = require('../../checktime');
const components = require('../components.json');
const interactArticleComponentSchema = require('../../../schemas/articles/interactArticleComponentSchema');
const interactArticleSchema = require('../../../schemas/articles/interactArticleSchema');

var componentOrganized = false;
var organizedComponents = [];

function organizeComponentOptions() {
    if (componentOrganized) return organizedComponents;

    const localOrganizedComponents = [];
    const componentTypes = components.componentTypes;
    const componentOptions = components.componentOptions;

    for (const type of componentTypes) {
        const options = [...componentOptions];
        if (type.subtractOptions) {
            for (const subtractOption of type.subtractOptions) {
                delete options[subtractOption];
            }
        }

        localOrganizedComponents.push({
            type: type,
            options: options,
        });
    }

    componentOrganized = true;
    organizedComponents = localOrganizedComponents;
    return localOrganizedComponents;
}

/* get components */
async function getComponents() {
    const components = organizeComponentOptions();
    return components;
}

async function uploadArticle(userID, article, method="draft") {
    if (!userID) return { error: true }
    if (!article) return { error: true }

    const { title, topic, components } = article;
    const articleID = uuidv4();
    
    // check article hubID and blogID
    // check for valid article components

    // if any articles unvalid, save to draft and return error
    const invalidComponents = [];
    const validComponents = [];
    var currentComponent = 0;
    const hubID = null;
    
    for (const component of components) {
        console.log(component)
        const compType = organizeComponentOptions().find(comp => comp.type.id == component.type.id);
        if (!compType) {
            invalidComponents.push({error: "not found", component})
            continue;
        }
        console.log("compType", compType)
        var foundInvalidType = false;
        const optionsSet = {};
        for (const option in component.options) {
            // if (options.)
            const compOption = compType.options.find(optionA => optionA.dbName == component.options[option].dbName);
            if (!compOption) {
                console.log("inv", component.options[option].dbName)
                foundInvalidType = true;
                continue;
            }
            console.log("option", option)
            optionsSet[option] = component.options[option].value
        }
        if (foundInvalidType) {
            invalidComponents.push({error: "type", component})
            continue
        };
        console.log("optionsSet", optionsSet)

        const newArticleComp = {
            _id: uuidv4(),
            articleID: articleID,
            order: currentComponent,
            componentID: compType.type.id,
            timestamp: checktime(),
            ...optionsSet
            // font_size: component.options["font_size"].value
        }
        console.log("newArticleComp", newArticleComp)
        // const newArticle
        const componentSave = await interactArticleComponentSchema.create(newArticleComp);
        console.log("savedComp", componentSave)

        currentComponent++;
        validComponents.push(componentSave);
    }
    console.log("invalidComponents", invalidComponents)

    if (invalidComponents[0]) return invalidComponents;

    const articleSave = {
        _id: articleID,
        hubID: hubID ?? "main", // change
        topicID: topic ?? "main", // change
        userID: userID,
        indexID: "empty For now", // change
        timestamp: checktime(),
        title: title
    }

    const savedArticle = await interactArticleSchema.create(articleSave);

    return {
        article: savedArticle,
        components: validComponents,
    }
}


/* create article */

module.exports = { 
    getComponents,
    uploadArticle
}