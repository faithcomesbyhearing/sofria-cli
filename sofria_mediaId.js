if (process.argv.length < 2) {
    throw new Error(`usage: sofria-mediaId <USX FILESET DIRECTORY>`);
}

const PARENT_PATH = './output';

const PromisePool = require('es6-promise-pool')
const crypto = require('crypto');
const path = require('path');
const fse = require('fs-extra');
const {
    Proskomma
} = require('proskomma');

if (global.crypto !== 'object') {
    global.crypto = {
        getRandomValues: (array) => {
            if (crypto.webcrypto && crypto.webcrypto.getRandomValues) {
                return crypto.webcrypto.getRandomValues(array);
            }

            return crypto.randomBytes(array.length);
        }
    };
}

function zeroComplete(num, places) {
    return String(num).padStart(places, '0')
}

const fqPath = process.argv[2]
const usxRootDirectory = fqPath.split("/").reverse()[0];

let outputDir = process.argv[3];

if (outputDir) {
    if (!fse.existsSync(outputDir)) {
        throw new Error(`ERROR: Output directory: ${outputDir} must exist.`);
    }

    if (!outputDir.endsWith("/")) {
        outputDir += "/";
    }
} else {
    outputDir = PARENT_PATH;
}

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

function generateChapterContent(chapter, usxFile, pk) {
    return new Promise(function (resolve, _) {
        const chapterQuery = `{documents {sofria(indent: 2, chapter: ${chapter}) } }`;
        const gqlObject = pk.gqlQuerySync(chapterQuery);

        if (gqlObject && gqlObject.data && gqlObject.data.documents[0]) {
            const chapterJson = gqlObject.data.documents[0].sofria;
            writeUsxJsonFile({
                name: usxFile.name,
                chapter: chapter,
                jsonContent: chapterJson,
            });
        }

        resolve(true);
    });
}

function generateJsonContentByUSXFile(usxFile) {
    return new Promise(function (resolve, _) {
        const content = fse.readFileSync(usxFile.fullpath).toString();

        if (content !== "" && usxFile.suffix !== "") {
            const pk = new Proskomma();
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

            let count = 0;
            const promiseChapterProducer = function () {
                if (count < chapters.length) {
                    const chapterToProcess = chapters[count];
                    ++count;
                    return generateChapterContent(chapterToProcess, usxFile, pk)
                } else {
                    return null
                }
            };

            let poolChapter = new PromisePool(promiseChapterProducer, 4)

            poolChapter.start()
                .then(function () {
                    console.log(`Complete USX File: ${usxFile.fullpath}`);
                }, function (error) {
                    console.log(`Error processing USX File ${usxFile.fullpath}` + error.message);
                });
        }

        resolve(true);
    });
}

async function writeUsxJsonFile(usxFile) {
    const folderFile = path.join(outputDir, `${usxRootDirectory}-json`);
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

async function main() {
    console.log('Start process..');

    const listFilesToProcess = await getListFileFromDirectory(fqPath);
    const folderFile = path.join(outputDir, `${usxRootDirectory}-json`);
    await fse.mkdir(folderFile, {
        recursive: true
    });

    let count = 0;
    const promiseFileProducer = function () {
        if (count < listFilesToProcess.length) {
            const usxFileToProcess = listFilesToProcess[count];
            ++count;
            return generateJsonContentByUSXFile(usxFileToProcess)
        } else {
            return null
        }
    };

    let pool = new PromisePool(promiseFileProducer, 5)

    pool.start()
        .then(function () {
            console.log(`File list (${listFilesToProcess.length}) processing completed`);
        }, function (error) {
            console.log('Error processing file list' + error.message);
        });
}

main();
