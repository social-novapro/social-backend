const components = require('../components.json');

var componentOrganized = false;
var organizedComponents = [];

function organizeComponentOptions() {
    if (componentOrganized) return organizedComponents;

    const localOrganizedComponents = [];
    const componentTypes = components.componentTypes;
    const componentOptions = components.componentOptions;

    for (const type of componentTypes) {
        const options = {...componentOptions};
        if (type.subtractOptions) {
            for (const subtractOption of type.subtractOptions) {
                delete options[subtractOption];
            }
        }

        localOrganizedComponents.push({
            type: type,
            options: options
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


/* create article */

module.exports = { 
    getComponents
}