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
        verses: ci.verses.reduce((result, verse) => {
          verse.verse.forEach((verseContent) => {
            if (
              !hashIdVerseRange.has(
                `${ci.chapter}${bookCode}${verseContent.verseRange}`
              )
            ) {
              hashIdVerseRange.set(
                `${ci.chapter}${bookCode}${verseContent.verseRange}`
              );
              result = result.concat({
                verseRange: verseContent.verseRange,
                text: verseContent.text,
              });
            }
          });

          return result;
        }, []),
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

const removeAlphabetLetters = function (string) {
  const regex = /[a-zA-Z]/g;
  return string.replace(regex, "");
};

const getVerseRowsFromChapters = function (verses, chapter, bookCode) {
  const result = [];

  verses.forEach((verse) => {
    if (verse.verseRange !== "0" && verse.verseRange !== 0) {
      const verseRange = removeSpecialChar(verse.verseRange);
      const reference = bookCode + ":" + chapter + ":" + verseRange;

      const verseRangeArray = verseRange.split(/[-,]/g);
      // Maybe, a verse is represented as NUMBER + Letter e.g. "3a" or similar
      // So, we need to separate the NUMBER to store it into an number column for
      // handle the sorting process
      const verseStart = parseInt(removeAlphabetLetters(verseRangeArray[0]));
      const verseEnd =
        verseRangeArray.length > 1
          ? parseInt(removeAlphabetLetters(verseRangeArray[1]))
          : null;
      result.push({
        reference,
        verseSequence: verseStart,
        verseEnd: verseEnd,
        text: verse.text,
      });
    }
  });

  return result;
};

const getListVerseSequence = function (verses) {
  const verseByChapter = [];

  verses.forEach((verse) => {
    verseByChapter.push(verse.verseSequence);
    if (verse.verseEnd !== null) {
      const verseRangeDiff = verse.verseEnd - verse.verseSequence;
      // we need to populate the range of verses from verseSequence to verseEnd including verseEnd
      if (verseRangeDiff > 0) {
        for (let idx = 1; idx <= verseRangeDiff; ++idx) {
          verseByChapter.push(verse.verseSequence + idx);
        }
      }
    }
  });

  return verseByChapter;
};

const getMissedVerses = function (verseSequenceList) {
  for (let vidx = 0; vidx < verseSequenceList.length - 1; ++vidx) {
    const verseSequenceDiff =
      verseSequenceList[vidx + 1] - verseSequenceList[vidx];

    if (verseSequenceDiff > 1) {
      const missedVerses = [];
      for (let idx = 1; idx < verseSequenceDiff; ++idx) {
        missedVerses.push(verseSequenceList[vidx] + idx);
      }

      return missedVerses;
    }
  }

  return [];
};

const getVersesToInsert = function (usxJson) {
  let versesRows = [];

  if (usxJson.chapters) {
    usxJson.chapters.forEach((chapter) => {
      if (chapter.verses) {
        // Get list of verse rows to insert but with a object format.
        // verse = {reference, verseSequence, verseEnd, text}
        const versesListByChapter = getVerseRowsFromChapters(
          chapter.verses,
          chapter.chapter,
          usxJson.bookCode
        );

        // Get a list of numbers that indicates the list of verses by chapter e.g. [1,2,3,4,...,n]
        const verseSequenceList = getListVerseSequence(versesListByChapter);
        verseSequenceList.sort((nextVerse, prevVerse) => nextVerse - prevVerse);

        // Validate if the list of verses has missed verses checking if the list of numbers is not sequential list
        const missedVerses = getMissedVerses(verseSequenceList);

        if (missedVerses.length > 0) {
          throw new Error(
            `ERROR: verses: ${missedVerses.join(",")} in Book: ${
              usxJson.bookCode
            } Chapter: ${chapter.chapter} are missing.`
          );
        }

        const chapterVersesRows = versesListByChapter.map((verse) => [
          verse.reference,
          verse.verseSequence,
          verse.text,
        ]);
        chapterVersesRows.sort(
          (nextVerse, prevVerse) => nextVerse[1] - prevVerse[1]
        );

        versesRows = versesRows.concat(chapterVersesRows);
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

module.exports.getListVerseSequence = getListVerseSequence;
module.exports.getVerseRowsFromChapters = getVerseRowsFromChapters;
module.exports.getMissedVerses = getMissedVerses;
module.exports.getVersesToInsert = getVersesToInsert;
module.exports.run = run;
