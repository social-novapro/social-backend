const interactCategory = require('../../../../schemas/categories/interactCategory');
const { embedSearch, EMBEDING_VERSION } = require('../../../search/embed');
const categories = require('./categories.json');
const { v4: uuidv4 } = require('uuid');
// get all categories, get embeddings for each category
const { whichEnv } = require('../../../../../runMode/whichEnv');
require('dotenv').config({ path: whichEnv()})

const fs = require('fs');
const { checktime } = require('../../../checktime');
const interactCategoryEmbed = require('../../../../schemas/categories/interactCategoryEmbed');
const { cosineSimilarity } = require('../../../search/searchV2');
const { searchErrorV2 } = require('../../../searchError');
// parse categories, then subcategories

var exampleCategoriesVersion = -1;

const targetService = `${process.env.AI_INTERFACE_SERVICE}/v1`; // AI service
/* Assign ids to categories and subcategories */
function assignIds() {
    var currentId = 0;
    var currentparentId = 0;
    var tempCategories = categories;
    for (const category of tempCategories.categories) {
        currentId=0;
        currentparentId++;

        if (!category.id) {
            category.id = currentparentId*100;
        }

        for (const subcategory of category.subCategories) {
            currentId++;
            if (!subcategory.id) {
                subcategory.id = (currentparentId*100)+currentId;
            }
            console.log(subcategory.name, category.name);
        }
    }

    fs.writeFileSync('src/utils/post/categories/startup/categories.json', JSON.stringify(categories, null, 2));
}

async function quickUpdateScriptCategory() {
    // update with new category thing
    const alLCategories = await interactCategoryEmbed.find({});
    for (const category of alLCategories) {
        const categoryUUID = category._id;
        const newUUID = uuidv4();
        console.log("Updating category", category.name, "with new UUID", newUUID, "and old UUID", categoryUUID, "and ID", category.id);
        
        await interactCategoryEmbed.create({
            _id: newUUID,
            categoryUUID: categoryUUID,
            categoryID: category.id,
            content: category.content,
            timestamp: category.timestamp,
            embeddingVersion: category.embeddingVersion,
            embedding: category.embedding,
            categoryExampleVersion: category.categoryExampleVersion,
            categoryExamples: category.categoryExamples,
            categorySentences: category.categorySentences,
        })

        await interactCategoryEmbed.deleteOne({ _id: categoryUUID });
    }
}

async function generateExample({ categoryName, categoryID }) {
    const result = await fetch(targetService+'/categoryExample/'+encodeURIComponent(categoryName), {
        method: 'POST',
    });

    const res = await result.json();
    return res;
}

/* Startup categories */
async function startupCategories() {
    // await quickUpdateScriptCategory()
    // deleteAllCategories();
    // assignExamplesFromOllama();
    // assignIds();
    if (exampleCategoriesVersion == -1) {
        const result = await fetch(targetService+'/ ', {
            method: 'GET',
        });

        const res = await result.json();
        if (!res || res.error) {
            console.error("Error getting example categories version", res);
            searchErrorV2("Q004", { userID: "system"})
            return;
        }
        exampleCategoriesVersion = res.version;
    }

    for (const category of categories.categories) {
        console.log("CHECKING", category.name);
        const myCat = await saveCategoryToDB({ id: category.id, categoryName: category.name, parentCategoryID: null });
        
        for (const subcategory of category.subCategories) {
            console.log("CHECKING", subcategory.name, category.name);
            await saveCategoryToDB({ id: subcategory.id, categoryName: subcategory.name, parentCategoryID: myCat.id });
        }
    }
}

/* Delete all categories from the database */
async function deleteAllCategories() {
    await interactCategory.deleteMany({});
}

/* Get a category from the database */
async function getCategoryFromDB({ categoryName, categoryID }) {
    const lookup = categoryName ? { name: categoryName } : { id: categoryID };
    const foundCategories = await interactCategory.findOne(lookup);
    return foundCategories;
}

/* Get all categories from the database */
async function getCategoriesFromDB() {
    const foundCategories = await interactCategory.find({});
    return foundCategories;
}

/* Get all categories embeddings from the database */
async function getCategoriesEmbeddingsFromDB() {
    const foundCategories = await interactCategoryEmbed.find({});
    return foundCategories;
}

/* Save a category or subcategory to the database */
async function saveCategoryToDB({ id, categoryName, parentCategoryID }) {
    // save category to database
    // might not have subcategory if its main category (e.g. "Technology")
    const foundCategory = await interactCategory.findOne({ id: id });
    const foundExamples = await interactCategoryEmbed.find({ categoryID: id });
    var toUpdateExamples = false;
    var toUpdateEmbeddings = false;

    const foundExample = (foundExamples && foundExamples.length > 0) ? foundExamples[0] : null;
    if (!foundExample) toUpdateExamples = false;

    if (foundCategory) {
        var updatedCategory = false;
        var reason = null;

        // make sure name is correct
        if (foundCategory.name != categoryName) {
            updatedCategory = true;
            reason = `Name is incorrect. Found: ${foundCategory.name}, Expected: ${categoryName}`;
        }

        // make sure version is correct
        if (foundCategory.version != categories.version) {
            updatedCategory = true;
            reason = `Version is incorrect. Found: ${foundCategory.version}, Expected: ${categories.version}`;

            if (foundCategory.version < categories.exampleUpdateVer) {
                // if version is less than certian version, need to redo examples
                toUpdateExamples = true;
            }

            if (foundCategory.version < categories.embedUpdatedVer) {
                console.log("should need to update embeddings");
                // if version is less than certian version, need to redo embeddings
                toUpdateEmbeddings = true;
            }
        }
        // make sure has examples entry, and not to many
        else if (!foundExamples || foundExamples.length <= 0 || foundExamples.length > 1) {
            updatedCategory = true;
            toUpdateExamples = true;
            reason = `Examples are missing, or to many entries. Found: ${foundExamples ? foundExamples.length : 0}, Expected: 1`;
        }
        else if (foundExample.embeddingVersion != EMBEDING_VERSION) {
            updatedCategory = true;
            toUpdateEmbeddings = true;
            reason = `Embedding version is incorrect. Found: ${foundExample.embeddingVersion}, Expected: ${EMBEDING_VERSION}`;
        }
        // make sure has sentences and examples needed
        else if ((!foundExample.categoryExamples || !foundExample.categorySentences) || (foundExample.categoryExamples <= 0 || foundExample.categorySentences <= 0) || (foundExample.categoryExamples.length < 5)) {
            updatedCategory = true;
            toUpdateExamples = true;
            reason = `Category examples or sentences are missing, or to many entries. Found: ${foundExample.categoryExamples ? foundExample.categoryExamples.length : 0}, Expected: >0`;
        }

        // make sure example version is correct
        else if (!foundExample.categoryExampleVersion || foundExample.categoryExampleVersion != exampleCategoriesVersion) {
            updatedCategory = true;
            toUpdateExamples = true;
            reason = `Category example version is incorrect. Found: ${foundExample.categoryExampleVersion}, Expected: ${exampleCategoriesVersion}`;
            await interactCategoryEmbed.findOneAndUpdate({
                categoryID: id,
                content: categoryName,
            }, {
                categoryExampleVersion: exampleCategoriesVersion,
            })
        }

        // make sure parent ID is correct
        // parentID was not found, but was found in DB
        else if (
            (!parentCategoryID && foundCategory.parentCategoryID) || 
            (parentCategoryID && !foundCategory.parentCategoryID) ||
            (parentCategoryID && !foundCategory.isSubCategory) ||
            (foundCategory.isSubCategory && !parentCategoryID) ||
            (parentCategoryID == null && foundCategory.parentCategoryID != null) // make sure
        ) {
            updatedCategory = true;
            reason = `Parent ID found or not found when expected. Found: ${foundCategory.parentCategoryID}, Expected: ${parentCategoryID}`;
        }
        // make sure parentId is correct
        if (
            (parentCategoryID != null && foundCategory.parentCategoryID != null) &&
            (parentCategoryID != foundCategory.parentCategoryID)
        ) {
            updatedCategory = true;
            reason = `Parent ID is incorrect. Found: ${foundCategory.parentCategoryID}, Expected: ${parentCategoryID}`;
        }

        if (!updatedCategory) return foundCategory;
        await interactCategory.deleteOne({ id: id });
        if (toUpdateExamples) {
            await interactCategoryEmbed.deleteMany({ categoryID: id });
        }
        console.log("--- DELETED", id, reason);
    }

    const newCategory = await interactCategory.create({
        _id: uuidv4(),
        id: id,
        name: categoryName,
        timestamp: checktime(),
        version: categories.version,
        embeddingVersion: EMBEDING_VERSION,
        isSubCategory: parentCategoryID != null ? true : false,
        parentCategoryID: parentCategoryID ? parentCategoryID : null,
    });

    if (toUpdateExamples) {
        console.log("--- Updating Examples for", categoryName, "with ID", id);
        await updateCategoryExamples({ newCategory, categoryID: id, categoryName: categoryName });
    } else if (toUpdateEmbeddings) {
        console.log("--- Updating Embeddings for", categoryName, "with ID", id);
        await updateCategoryExampleEmbeddings({ newCategory, categoryID: id, categoryName: categoryName });
    } else {
        await interactCategoryEmbed.findOneAndUpdate(
            { _id: foundExample },
            {
                categoryUUID: newCategory._id,
            }
        );
    
        return newCategory;
    }

    return newCategory;
}

async function updateCategoryExamples({ newCategory, categoryID, categoryName }) {
    const embedding = await embedSearch({ content: categoryName });

    // Category Example Schema
    const generatedExamples = await generateExample({ categoryName, categoryID });
    if (!generatedExamples || generatedExamples.error || generatedExamples.length <= 0) {
        console.error("Error generating examples for category", categoryName, generatedExamples);
        searchErrorV2("Q005", { userID: "system", options: [ {name: "categoryName", data: categoryName}, {name: "categoryID", data: categoryID} ] })
        return newCategory;
    }

    const categoryExamples = [];
    const categorySentences = [];
    // make "categoryExamples" and "categorySentences" array
    for (const example of generatedExamples) {
        if (!example || !example.response) {
            searchErrorV2("Q005", { userID: "system", options: [ {name: "categoryName", data: categoryName}, {name: "categoryID", data: id} ] })
            return console.error("Error generating example for category", categoryName, example);
        }
        const embeddings = await getExampleEmbedding({ newCategory, categoryName, exampleContent: example.response });
        categoryExamples.push(embeddings.categoryExample);
        categorySentences.push(...embeddings.categorySentences);
    }

    // get and embed examples
    await interactCategoryEmbed.create({
        _id: uuidv4(),
        categoryUUID: newCategory._id,
        categoryID: newCategory.id,
        content: newCategory.name,
        timestamp: checktime(),
        embeddingVersion: EMBEDING_VERSION,
        embedding: JSON.stringify(embedding.embedding.embedding),
        categoryExampleVersion: generatedExamples[0].versionNumber,
        categoryExamples: categoryExamples,
        categorySentences: categorySentences,
    });

    return newCategory;
}

async function getExampleEmbedding({ newCategory, categoryName, exampleContent}) {
    console.log("GETTING EXAMPLE EMBEDDING", categoryName, exampleContent);
    const exampleID = uuidv4();

    const exampleContentLc = exampleContent.toLowerCase();
    console.log(exampleContent)

    // PROBLEM IS HERE SOMEWHERE
    const example_embedding = await embedSearch({ content: exampleContentLc });
    console.log("--- EMBEDING EXAMPLE", exampleContentLc);
    const categoryExample = {
        _id: exampleID,
        categoryEmbedID: newCategory.id,
        content: exampleContentLc,
        embeddingVersion: EMBEDING_VERSION,
        embedding: JSON.stringify(example_embedding.embedding.embedding),
    };

    const categorySentences = [];

    for (const sentence of example_embedding.embedding.sentences) {
        const sentenceID = uuidv4();
        categorySentences.push({
            _id: sentenceID,
            exampleID: exampleID,
            content: sentence.sentence,
            embeddingVersion: EMBEDING_VERSION,
            embedding: JSON.stringify(sentence.embedding),
        });
    }
    return {
        categoryExample: categoryExample,
        categorySentences: categorySentences,
    }
}
async function updateCategoryExampleEmbeddings({ newCategory, categoryID, categoryName }) {
    const foundExamples = await interactCategoryEmbed.findOne({ categoryID: categoryID });
    if (!foundExamples) {
        console.error("No examples found for category", categoryName);
        searchErrorV2("Q005", { userID: "system", options: [ {name: "categoryName", data: categoryName}, {name: "categoryID", data: categoryID} ] })
        return;
    }

    // const categoryExamples = [];
    // for (const example of foundExamples.categoryExamples) {
    const categoryExamples = [];
    const categorySentences = [];
    // make "categoryExamples" and "categorySentences" array
    for (const example of foundExamples.categoryExamples) { // .content
        if (!example || !example.content) {
            searchErrorV2("Q005", { userID: "system", options: [ {name: "categoryName", data: categoryName}, {name: "categoryID", data: categoryID} ] })
            return console.error("Error generating embedding for category", categoryName, example);
        }
        const embeddings = await getExampleEmbedding({ newCategory, categoryName, exampleContent: example.content });
        categoryExamples.push(embeddings.categoryExample);
        categorySentences.push(...embeddings.categorySentences);
        // compare 
        console.log("COMPARING EMBEDING", example.content, example._id);
        console.log(example.embedding)
        console.log(embeddings.categoryExample.embedding)
        console.log("SAME EMBEDDING:", JSON.parse(example.embedding) == JSON.parse(embeddings.categoryExample.embedding));
        const similarity = cosineSimilarity(
            JSON.parse(example.embedding),
            [JSON.parse(embeddings.categoryExample.embedding)],
            [example.content],
            [categoryName],
        );
        console.log("Cosine Similarity:", similarity);
    }

    const embedding = await embedSearch({ content: categoryName });
    console.log("--- EMBEDING", categoryName)

    await interactCategoryEmbed.findOneAndUpdate({
        categoryID: categoryID,
        content: categoryName,
    }, {
        categoryExamples: categoryExamples,
        categorySentences: categorySentences,
        embedding: JSON.stringify(embedding.embedding.embedding),
        timestamp: checktime(),
        embeddingVersion: EMBEDING_VERSION,
    })
}

// Get runtime information about categories, including embeddings and examples
// quickTest()
// "6d6a2acd-bc9b-4272-bf46-c8a904315f08"
async function getCategoryRuntimeInfo() {
    const categories = await getCategoriesFromDB();
    const categoryEmbeddings = await getCategoriesEmbeddingsFromDB();
    const catEmbeddings = [];
    const catExamples = [];
    const catExampleSentences = {};
    const catExampleContent = [];
    const catNames = [];
    const exampleIDs = [];

    for (const cat of categoryEmbeddings.sort((a, b) => a.categoryID - b.categoryID)) {
        // push category examples 
        for (const example of cat.categoryExamples ?? []) {
            if (!example || !example.embedding) continue;
            catExamples.push(example);

            catEmbeddings.push(JSON.parse(example.embedding ?? "[]"));
            catNames.push(cat.content);
            catExampleContent.push(example.content);
            exampleIDs.push(example._id);
            catExampleSentences[example._id] = [];
            
            for (const sentence of cat.categorySentences ?? []) {
                if (!sentence || !sentence.embedding) continue;
                if (sentence.exampleID == example._id) catExampleSentences[example._id].push(sentence);
            }
        }
    }
   
    return {
        categories: categories,
        catEmbeddings: catEmbeddings,
        catNames: catNames,
        categoryEmbeddings: categoryEmbeddings,
        catExamples: catExamples,
        catExampleContent: catExampleContent,
        exampleIDs: exampleIDs,
        catExampleSentences: catExampleSentences,
    }
}

module.exports = { startupCategories, getCategoriesFromDB, getCategoriesEmbeddingsFromDB, getCategoryFromDB, getCategoryRuntimeInfo };