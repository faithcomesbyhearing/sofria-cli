const path = require('path');
const fse = require('fs-extra');
const {Proskomma} = require('proskomma');

// CLI: sofria-mediaId <directory> <language> <version>
// example: sofria-mediaId testdata/ENGESVN_ET ENG ESV

if (process.argv.length !== 5) {
    throw new Error(`usage: sofria-mediaId <directory> <LANGUAGE> <VERSION>`);
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
// replace xxx with language from command input; similarly, replace yyy with version 
pk.importDocument({lang: "xxx", abbr: "yyy"}, suffix, content);
const chaptersQuery = `{documents {cIndexes { chapter } } }`;
const chaptersResult = pk.gqlQuerySync(chaptersQuery);
const ret = {};
for (const chapter of chaptersResult.data.documents[0].cIndexes.map(ci => ci.chapter)) {
    const chapterQuery = `{documents {sofria(indent: 2, chapter: ${chapter}) } }`;
    // FIXME: instead of adding the chapter to a larger document to be returned, write the chapter out to the filesystem
    // outfile = first seven of directory name (eg ENGESVN) + "_" + book_id + "_" + ${chapter}
    // filename example: ENGESV_040MAT_1.json
    chapter_json = JSON.parse(pk.gqlQuerySync(chapterQuery).data.documents[0].sofria);
    // output chapter_json to outfile
}


console.log(JSON.stringify(ret, null, 2));
