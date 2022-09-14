if (process.argv.length < 2) {
    throw new Error(`usage: sofria-mediaId <USX FILESET DIRECTORY>`);
}

const PARENT_PATH = './output';

const crypto = require('crypto').webcrypto;
const path = require('path');
const fse = require('fs-extra');
const {
    Proskomma
} = require('proskomma');

if (global.crypto !== 'object') {
    global.crypto = {
        getRandomValues: (array) => crypto.getRandomValues(array)
    };
}

function zeroComplete(num, places) {
    return String(num).padStart(places, '0')
}

const offset = process.argv.length > 3 ? Number(process.argv[3]) : 0;
const limit = process.argv.length > 4 ? Number(process.argv[4]) : Infinity;

const pk = new Proskomma();

const fqPath = process.argv[2]
const usxRootDirectory = fqPath.split("/").reverse()[0];

async function getListFileFromDirectory(dirPath) {
    try {
        const filesUsx = await fse.readdir(dirPath);
        const listFiles = [];
        for (const fileUsx of filesUsx) {
            const fileFormat = fileUsx.split(".");
            const name = fileFormat[0] ? fileFormat[0] : "";
            const suffix = fileFormat[1] ? fileFormat[1] : "";

            listFiles.push({
                fullpath: path.join(dirPath, fileUsx),
                name,
                suffix,
                fullname: fileUsx,
            });
        }
        return listFiles;
    } catch (err) {
        console.error(`Unable to read directory: ${dirPath}`, err);
    }
}

async function generateChapterContent(usxFileName, chapter) {
    const chapterQuery = `{documents {sofria(indent: 2, chapter: ${chapter}) } }`;
    const gqlObject = pk.gqlQuerySync(chapterQuery);

    if (gqlObject && gqlObject.data && gqlObject.data.documents[0]) {
        const chapterJson = gqlObject.data.documents[0].sofria;
        writeUsxJsonFile({
            name: usxFileName,
            chapter: chapter,
            jsonContent: chapterJson,
        });
    }
}

async function generateJsonContentByUSXFile(usxFile) {
    const content = fse.readFileSync(usxFile.fullpath).toString();
    const stackChapterContent = [];

    if (content !== "" && usxFile.suffix !== "") {
        pk.importDocument({
            lang: "xxx",
            abbr: ""
        }, usxFile.suffix, content);
        const chaptersQuery = `{documents {cIndexes { chapter } } }`;
        const chaptersResult = pk.gqlQuerySync(chaptersQuery);
        const chapters = chaptersResult
            .data
            .documents[0]
            .cIndexes.map(ci => ci.chapter);
        chapters.forEach(async function(chapter) {
            generateChapterContent(usxFile.name, chapter)
        });
    }

    return stackChapterContent;
}

async function writeUsxJsonFile(usxFile) {
    const folderFile = path.join(PARENT_PATH, `${usxRootDirectory}-json`);
    const newFile = path.join(
        folderFile,
        `${usxFile.name}_${zeroComplete(usxFile.chapter, 3)}.json`,
    );

    try {
        await fse.outputFile(newFile, usxFile.jsonContent);
    } catch (err) {
        console.error(`Error it can not create file: ${newFile} `, err);
    }
}

async function generateJsonContentByUSXFileList(listUSXFiles) {
    const folderFile = path.join(PARENT_PATH, `${usxRootDirectory}-json`);
    await fse.mkdir(folderFile, {
        recursive: true
    });

    listUSXFiles.forEach(async function(usxFile) {
        generateJsonContentByUSXFile(usxFile);
    })
}

async function main() {
    const listFiles = await getListFileFromDirectory(fqPath);

    generateJsonContentByUSXFileList(listFiles.slice(offset, limit));
}

main();
