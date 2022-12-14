const PromisePool = require("es6-promise-pool");
const Filesystem = require("./util/filesystem");
const crypto = require("crypto");
const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");

if (global.crypto !== "object") {
  global.crypto = {
    getRandomValues: (array) => {
      if (crypto.webcrypto && crypto.webcrypto.getRandomValues) {
        return crypto.webcrypto.getRandomValues(array);
      }

      return crypto.randomBytes(array.length);
    },
  };
}

const zeroComplete = function (num, places) {
  return String(num).padStart(places, "0");
};

const generateChapterContent = function (chapter, usxFile, jsonPathOutput, pk) {
  return new Promise(function (resolve, _) {
    const chapterQuery = `{documents {sofria(indent: 2, chapter: ${chapter}) } }`;
    const gqlObject = pk.gqlQuerySync(chapterQuery);

    if (gqlObject && gqlObject.data && gqlObject.data.documents[0]) {
      const chapterJson = gqlObject.data.documents[0].sofria;
      writeUsxJsonFile(
        {
          name: usxFile.name,
          chapter: chapter,
          jsonContent: chapterJson,
        },
        jsonPathOutput
      );
    }

    resolve(true);
  });
};

const generateJsonContentByUSXFile = function (usxFile, jsonPathOutput) {
  return new Promise(function (resolve, _) {
    const content = fse.readFileSync(usxFile.fullpath).toString();

    if (content !== "" && usxFile.suffix !== "") {
      const pk = new Proskomma();
      pk.importDocument(
        {
          lang: "xxx",
          abbr: "",
        },
        usxFile.suffix,
        content
      );
      const chaptersQuery = `{documents {cIndexes { chapter } } }`;
      const chaptersResult = pk.gqlQuerySync(chaptersQuery);
      const chapters = chaptersResult.data.documents[0].cIndexes.map(
        (ci) => ci.chapter
      );

      let count = 0;
      const promiseChapterProducer = function () {
        if (count < chapters.length) {
          const chapterToProcess = chapters[count];
          ++count;
          return generateChapterContent(
            chapterToProcess,
            usxFile,
            jsonPathOutput,
            pk
          );
        } else {
          return null;
        }
      };

      let poolChapter = new PromisePool(promiseChapterProducer, 6);

      poolChapter.start().then(
        function () {
          console.info(
            "Generate JSON =>",
            `Complete USX File: ${usxFile.fullpath}`
          );
        },
        function (error) {
          console.error(
            "Generate JSON =>",
            `Error processing USX File ${usxFile.fullpath}` + error.message
          );
        }
      );
    }

    resolve(true);
  });
};

const writeUsxJsonFile = async function (usxFile, jsonPathOutput) {
  const newFile = path.join(
    jsonPathOutput,
    `${usxFile.name}_${zeroComplete(usxFile.chapter, 3)}.json`
  );

  try {
    await fse.outputFile(newFile, usxFile.jsonContent);
  } catch (err) {
    console.error(
      "Generate JSON =>",
      `Error it can not create file: ${newFile} `,
      err
    );
  }
};

const run = async function (usxPathInput, jsonPathOutput) {
  console.info("Generate JSON =>", "Generate JSON filese - Start process..");

  const listFilesToProcess = await Filesystem.getListFileFromDirectory(
    usxPathInput
  );

  const folderFile = path.join(jsonPathOutput);
  await fse.mkdir(folderFile, {
    recursive: true,
  });

  let count = 0;
  const promiseFileProducer = function () {
    if (count < listFilesToProcess.length) {
      const usxFileToProcess = listFilesToProcess[count];
      ++count;
      return generateJsonContentByUSXFile(
        usxFileToProcess.file,
        jsonPathOutput
      );
    } else {
      return null;
    }
  };

  let pool = new PromisePool(promiseFileProducer, 2);

  pool.start().then(
    function () {
      console.info(
        "Generate JSON =>",
        `File list (${listFilesToProcess.length}) processing completed`
      );
    },
    function (error) {
      console.error(
        "Generate JSON =>",
        "Error processing file list" + error.message
      );
    }
  );
};

module.exports.run = run;
