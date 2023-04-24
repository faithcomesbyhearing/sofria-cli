const populateDBHandler = require("../gqlquery_verses_by_usx");
const test = require("tape");

const versesTest1 = [
  { verseRange: "1", text: "chapter 1 test 1" },
  { verseRange: "2", text: "chapter 1 test 2" },
  { verseRange: "3-4", text: "chapter 1 test 3-4" },
  { verseRange: "4", text: "chapter 1 test 4" },
  { verseRange: "4a", text: "chapter 1 test 4a" },
  { verseRange: "4b", text: "chapter 1 test 4b" },
];

const versesTest2 = [
  { verseRange: "1", text: "chapter 2 test 1" },
  { verseRange: "2", text: "chapter 2 test 2" },
  { verseRange: "3", text: "chapter 2 test 3" },
  { verseRange: "4", text: "chapter 2 test 4" },
  { verseRange: "4a", text: "chapter 2 test 4a" },
];

const versesTest3 = [
  { verseRange: "1", text: "chapter 3 test 1" },
  { verseRange: "2", text: "chapter 3 test 2" },
  { verseRange: "3", text: "chapter 3 test 3" },
  { verseRange: "3a", text: "chapter 3 test 3a" },
  { verseRange: "4", text: "chapter 3 test 4" },
  { verseRange: "4a", text: "chapter 3 test 4a" },
  { verseRange: "4b", text: "chapter 3 test 4b" },
  { verseRange: "4c", text: "chapter 3 test 4c" },
];

const versesTest4 = [
  { verseRange: "1", text: "chapter 4 test 1" },
  { verseRange: "2", text: "chapter 4 test 2" },
  { verseRange: "8", text: "chapter 4 test 8" },
];

const versesTest5 = [
  { verseRange: "1", text: "chapter 5 test 1" },
  { verseRange: "2", text: "chapter 5 test 2" },
  { verseRange: "3", text: "chapter 5 test 3" },
  { verseRange: "4-5", text: "chapter 5 test 4-5" },
  { verseRange: "6", text: "chapter 5 test 6" },
];

const versesTest6 = [
  { verseRange: "1", text: "chapter 6 test 1" },
  { verseRange: "2", text: "chapter 6 test 2" },
  { verseRange: "3", text: "chapter 6 test 3" },
  { verseRange: "4-20", text: "chapter 6 test 4-20" },
  { verseRange: "21", text: "chapter 6 test 21" },
];

const versesTest7 = [
  { verseRange: "1", text: "chapter 7 test 1" },
  { verseRange: "2", text: "chapter 7 test 2" },
  { verseRange: "3", text: "chapter 7 test 3" },
  { verseRange: "4", text: "chapter 7 test 4" },
  { verseRange: "5-6a", text: "chapter 7 test 5-6a" },
  { verseRange: "6b", text: "chapter 7 test 6b" },
];

const usxJsonTest = {
  bookCode: "bookCodeTest",
  chapters: [
    { verses: versesTest1, chapter: 1 },
    { verses: versesTest2, chapter: 2 },
    { verses: versesTest3, chapter: 3 },
  ],
};

const versesListByChapter = populateDBHandler.getVerseRowsFromChapters(
  versesTest1,
  1,
  "bookCodeTest"
);

test("Verse Rows From Chapters test", function (t) {
  t.plan(3);

  const lastIndex = versesListByChapter.length - 1;

  t.equal(versesListByChapter.length, 6);

  t.equal(versesListByChapter[lastIndex].verseSequence, 4);
  t.equal(versesListByChapter[lastIndex].text, "chapter 1 test 4b");
});

const verseRow = populateDBHandler.getVersesToInsert(usxJsonTest);

test("Verse Rows To Insert", function (t) {
  t.plan(3);

  const lastIndex = verseRow.length - 1;

  t.equal(verseRow.length, 19);

  const verse_sequence = verseRow[lastIndex][1];
  const verse_text = verseRow[lastIndex][2];

  t.equal(verse_sequence, 4);
  t.equal(verse_text, "chapter 3 test 4c");
});

test("Missed Verse test", function (t) {
  t.plan(1);

  const usxJsonTesTemp = {
    bookCode: "bookCodeTest",
    chapters: [
      { verses: versesTest1, chapter: 1 },
      { verses: versesTest2, chapter: 2 },
      { verses: versesTest3, chapter: 3 },
      { verses: versesTest4, chapter: 4 },
    ],
  };

  try {
    populateDBHandler.getVersesToInsert(usxJsonTesTemp);
  } catch (err) {
    t.equal(
      err.message,
      "ERROR: verses: 3,4,5,6,7 in Book: bookCodeTest Chapter: 4 are missing."
    );
  }
});

test("Missed Range Verse diff = 1 test", function (t) {
  t.plan(5);

  const usxJsonTesTemp = {
    bookCode: "bookCodeTest",
    chapters: [
      { verses: versesTest1, chapter: 1 },
      { verses: versesTest2, chapter: 2 },
      { verses: versesTest3, chapter: 3 },
      { verses: versesTest5, chapter: 4 },
    ],
  };

  const verseRow = populateDBHandler.getVersesToInsert(usxJsonTesTemp);
  const lastIndex = verseRow.length - 1;

  t.equal(verseRow.length, 24);

  const lastVerseSequence = verseRow[lastIndex][1];
  const lastVerseText = verseRow[lastIndex][2];

  t.equal(lastVerseSequence, 6);
  t.equal(lastVerseText, "chapter 5 test 6");

  const rangeVerseSequence = verseRow[lastIndex - 1][1];
  const rangeVerseText = verseRow[lastIndex - 1][2];

  t.equal(rangeVerseSequence, 4);
  t.equal(rangeVerseText, "chapter 5 test 4-5");
});

test("Missed Verse Range diff > 1 test", function (t) {
  t.plan(5);

  const usxJsonTesTemp = {
    bookCode: "bookCodeTest",
    chapters: [
      { verses: versesTest1, chapter: 1 },
      { verses: versesTest2, chapter: 2 },
      { verses: versesTest3, chapter: 3 },
      { verses: versesTest6, chapter: 4 },
    ],
  };

  const verseRow = populateDBHandler.getVersesToInsert(usxJsonTesTemp);
  const lastIndex = verseRow.length - 1;

  t.equal(verseRow.length, 24);

  const lastVerseSequence = verseRow[lastIndex][1];
  const lastVerseText = verseRow[lastIndex][2];

  t.equal(lastVerseSequence, 21);
  t.equal(lastVerseText, "chapter 6 test 21");

  const rangeVerseSequence = verseRow[lastIndex - 1][1];
  const rangeVerseText = verseRow[lastIndex - 1][2];

  t.equal(rangeVerseSequence, 4);
  t.equal(rangeVerseText, "chapter 6 test 4-20");
});

test("Same verse number but with different sub-category a and b", function (t) {
  t.plan(5);

  const usxJsonTesTemp = {
    bookCode: "bookCodeTest",
    chapters: [
      { verses: versesTest1, chapter: 1 },
      { verses: versesTest7, chapter: 2 },
    ],
  };

  const verseRow = populateDBHandler.getVersesToInsert(usxJsonTesTemp);
  const lastIndex = verseRow.length - 1;

  t.equal(verseRow.length, 12);

  const lastVerseSequence = verseRow[lastIndex][1];
  const lastVerseText = verseRow[lastIndex][2];

  t.equal(lastVerseSequence, 6);
  t.equal(lastVerseText, "chapter 7 test 6b");

  const rangeVerseSequence = verseRow[lastIndex - 1][1];
  const rangeVerseText = verseRow[lastIndex - 1][2];

  t.equal(rangeVerseSequence, 5);
  t.equal(rangeVerseText, "chapter 7 test 5-6a");
});

test("Missed Verse allowed test", function (t) {
  t.plan(2);

  const usxJsonTesTemp = {
    bookCode: "bookCodeTest",
    chapters: [
      { verses: versesTest1, chapter: 1 },
      { verses: versesTest2, chapter: 2 },
      { verses: versesTest3, chapter: 3 },
      { verses: versesTest4, chapter: 4 },
    ],
  };

  const missingVersesAllowedB = {
    bookCodeTest: { 4: [3, 4, 5, 6, 7] },
  };

  const verseRow = populateDBHandler.getVersesToInsert(
    usxJsonTesTemp,
    missingVersesAllowedB
  );
  const lastIndex = verseRow.length - 1;
  const lastVerseText = verseRow[lastIndex][2];

  t.equal(verseRow.length, 22);
  t.equal(lastVerseText, "chapter 4 test 8");
});

test("Incomplete Missed Verse allowed test", function (t) {
  t.plan(1);

  const usxJsonTesTemp = {
    bookCode: "bookCodeTest",
    chapters: [
      { verses: versesTest1, chapter: 1 },
      { verses: versesTest2, chapter: 2 },
      { verses: versesTest3, chapter: 3 },
      { verses: versesTest4, chapter: 4 },
    ],
  };

  const missingVersesAllowedB = {
    bookCodeTest: { 4: [3, 4, 5] },
  };

  try {
    populateDBHandler.getVersesToInsert(usxJsonTesTemp, missingVersesAllowedB);
  } catch (err) {
    t.equal(
      err.message,
      "ERROR: verses: 6,7 in Book: bookCodeTest Chapter: 4 are missing."
    );
  }
});
