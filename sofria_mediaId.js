const path = require('path');
const fse = require('fs-extra');
const {Proskomma} = require('proskomma');

// CLI: sofria-mediaId <USX FILESET DIRECTORY>
// example: sofria-mediaId testdata/ENGESVN_ET-usx
// result: create a corresponding sofria json fileset, eg:
//  1. create testdata/ENGESVN_ET-json/ directory (note that it is adjacent to the SOURCE directory)
//  2. create one sofria json file therein, for each usx file found in SOURCE

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
// replace xxx with first chars 0-2 of USX FILESET DIRECTORY and yyy with chars 3-5
// note that 0-2 is FCBH language code and 3-5 are the renditionID (which can be distinct per writing system)
// see https://docs.google.com/document/d/1qWbrPWoofjh9ltqic6J6ybdMq06TsJIDVnmJ_su3boQ/edit#heading=h.ezbopy32kofh for more info
pk.importDocument({lang: "xxx", abbr: "yyy"}, suffix, content);
// I assume that xxx and yyy are embedded in the json somewhere?
const chaptersQuery = `{documents {cIndexes { chapter } } }`;
const chaptersResult = pk.gqlQuerySync(chaptersQuery);
const ret = {};
for (const chapter of chaptersResult.data.documents[0].cIndexes.map(ci => ci.chapter)) {
    const chapterQuery = `{documents {sofria(indent: 2, chapter: ${chapter}) } }`;
    // FIXME: instead of adding the chapter to a larger document to be returned, write one file per chapter
    // example: given an input usx file ENGESVN_ET-usx/040MAT.usx, create ENGESVN_ET-json/040_MAT_{chapter}.json
    // where chapter is a zero-padded three-digit integer, one for each chapter in the input usx file
    // BTW: it'd be nicer if dbp-etl also separated the book order number and the book code with a _
    chapter_json = JSON.parse(pk.gqlQuerySync(chapterQuery).data.documents[0].sofria);
    // output chapter_json to outfile
}


console.log(JSON.stringify(ret, null, 2));
