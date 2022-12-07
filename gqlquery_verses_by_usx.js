const crypto = require("crypto");
const fse = require("fs-extra");
const DatabaseHandler = require("./util/database");
const VersesModel = require("./model/Verses");
const TableContentsModel = require("./model/TableContents");
const Filesystem = require("./util/filesystem");

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

const generateJsonContentByUSXFile = async function (usxFile) {
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
    const chaptersQuery = `{ documents { bookCode: header(id:"bookCode") title: header(id:"toc") name: header(id:"toc2") heading: header(id:"h") cvIndexes { chapter verses { verse { verseRange text } } } } }`;
    const chaptersResult = pk.gqlQuerySync(chaptersQuery);
    const document = chaptersResult.data.documents[0];

    const bookCode = document.bookCode;
    const title = document.title;
    const name = document.name;
    const heading = document.heading;

    const hashIdVerseRange = new Map();
    const chapterList = [];
    const chapters = chaptersResult.data.documents[0].cvIndexes.map((ci) => {
      chapterList.push(ci.chapter);

      return {
        chapter: ci.chapter,
        verses: ci.verses.reduce(
          (result, verse) =>
            verse.verse.length > 0 &&
            !hashIdVerseRange.has(
              `${ci.chapter}${bookCode}${verse.verse[0].verseRange}`
            )
              ? hashIdVerseRange.set(
                  `${ci.chapter}${bookCode}${verse.verse[0].verseRange}`
                ) &&
                result.concat({
                  verseRange: verse.verse[0].verseRange,
                  text: verse.verse[0].text,
                })
              : result,
          []
        ),
      };
    });

    return {
      bookCode,
      title,
      name,
      heading,
      chapters,
      chapterList,
    };
  }
};

const printError = function (err) {
  if (err) {
    console.error("Populate DB =>", err);
  }
};

const getVersesToInsert = function (usxJson) {
  const versesRows = [];

  if (usxJson.chapters) {
    usxJson.chapters.forEach((chapter) => {
      if (chapter.verses) {
        chapter.verses.forEach((verse) => {
          if (verse.verseRange !== "0" && verse.verseRange !== 0) {
            const reference =
              usxJson.bookCode +
              ":" +
              chapter.chapter +
              ":" +
              removeSpecialChar(verse.verseRange);
            versesRows.push([reference, verse.text]);
          }
        });
      }
    });
  }

  return versesRows;
};

const removeSpecialChar = function (verseNum) {
  const listCharacters = ["\u200f", "\u200c"];
  let newVerseNum = verseNum;

  listCharacters.forEach((character) => {
    newVerseNum = newVerseNum.replace(character, "");
  });

  return newVerseNum;
};

const getTableContentRow = function (usxJson) {
  return [
    usxJson.bookCode,
    usxJson.heading,
    usxJson.title,
    usxJson.name,
    usxJson.chapterList.join(","),
  ];
};

const run = async function (fqPath, datatabaseInput) {
  try {
    console.info("Populate DB - Start process..");

    const newDB = new DatabaseHandler(datatabaseInput);
    const tableContentsModel = new TableContentsModel(newDB);
    const versesModel = new VersesModel(newDB);

    tableContentsModel.drop(printError);
    versesModel.drop(printError);
    tableContentsModel.createTable(printError);
    versesModel.createTable(printError);

    const listFilesToProcess = await Filesystem.getListFileFromDirectory(
      fqPath
    );

    const results = await Promise.all(
      listFilesToProcess.map(async (fileUsxToProcess) => {
        return new Promise(async function (resolve, _) {
          const json = await generateJsonContentByUSXFile(
            fileUsxToProcess.file
          );
          const verseRow = getVersesToInsert(json);
          const tableContentRow = getTableContentRow(json);
          console.info("Populate DB =>", "Complete: ", json.heading);

          resolve({ verseRow, tableContentRow, index: fileUsxToProcess.index });
        });
      })
    );

    if (results.length) {
      results.sort((a, b) => a.index - b.index);

      const verseRows = results.reduce(
        (verseList, result) => verseList.concat(result.verseRow),
        []
      );

      const tableContentRows = results.map((result) => result.tableContentRow);

      if (verseRows.length) {
        versesModel.load(verseRows, printError);
      }

      if (tableContentRows.length) {
        tableContentsModel.load(tableContentRows, printError);
      }

      console.log("Populate DB =>", "success");
    }
  } catch (err) {
    console.error("Populate DB =>", `Unable to read file: ${fqPath}`, err);
  }
};

module.exports.run = run;
