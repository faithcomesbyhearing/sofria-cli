const path = require('path');
const fse = require('fs-extra');
const {Proskomma} = require('proskomma');

// CLI: sofria-mediaId <USX FILESET DIRECTORY>
// example: sofria-mediaId testdata/ENGESVN_ET-usx
// result: create a corresponding sofria json fileset, eg:
//  1. create testdata/ENGESVN_ET-json/ directory (note that it is adjacent to the USX FILESET DIRECTORY)
//  2. populate it with single-chapter sofria json files (created from the input usx files)

if (process.argv.length !== 5) {
    throw new Error(`usage: sofria-mediaId <USX FILESET DIRECTORY>`);
}

const pk = new Proskomma();

/*
 FIXME: find all files in specified directory which have extension .usx. The expectation is that each usx file contains one book
 Loop over each usx book file and associate with fqPath
 */

// lines 20-33 will be in the book loop, process a single usx book file. Used later, book_id would be of the form 040MAT
const fqPath = xx

const content = fse.readFileSync(fqPath).toString();
const suffix = fqPath.split(".").reverse()[0];
/// FIXME: change xxx and yyy to empty strings
pk.importDocument({lang: "xxx", abbr: "yyy"}, suffix, content);
// I assume that xxx and yyy are embedded in the json somewhere?
const chaptersQuery = `{documents {cIndexes { chapter } } }`;
const chaptersResult = pk.gqlQuerySync(chaptersQuery);
const ret = {};
for (const chapter of chaptersResult.data.documents[0].cIndexes.map(ci => ci.chapter)) {
    const chapterQuery = `{documents {sofria(indent: 2, chapter: ${chapter}) } }`;
    // FIXME: instead of adding the chapter to a larger document to be returned, write one file per chapter
    // example: given an input usx file ENGESVN_ET-usx/040MAT.usx, create ENGESVN_ET-json/040MAT_{chapter}.json
    // where chapter is a zero-padded three-digit integer, one for each chapter in the input usx file.
    // so just use the input filename head, with _{chapter}.json at the end
    chapter_json = JSON.parse(pk.gqlQuerySync(chapterQuery).data.documents[0].sofria);
    // output chapter_json to outfile
}


console.log(JSON.stringify(ret, null, 2));
