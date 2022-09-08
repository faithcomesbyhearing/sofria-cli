const path = require('path');
const fse = require('fs-extra');
const {Proskomma} = require('proskomma');

// CLI: sofria-mediaIDs <SOURCE DIRECTORY> <FCBH LANGUAGE CODE> <TRANSLATION ACRONYM>
// last two arguments are defined in 
// https://docs.google.com/document/d/1qWbrPWoofjh9ltqic6J6ybdMq06TsJIDVnmJ_su3boQ/edit#heading=h.ezbopy32kofh
// example: sofria-mediaId testdata/ENGESVN_ET ENG ESV  
// result: create sofria json mediaIDs, specifically:
//  1. create appropriate mediaID directories in current working directory
//  2. in the above, create one sofria json file for each usx file found in SOURCE DIRECTORY

if (process.argv.length !== 5) {
    throw new Error(`usage: sofria-mediaId <SOURCE DIRECTORY> <FCBH LANGUAGE CODE> <TRANSLATION ACRONYM>`);
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
// replace xxx with FCBH LANGUAGE CODE; similarly, replace yyy with TRANSLATION ACRONYM
pk.importDocument({lang: "xxx", abbr: "yyy"}, suffix, content);
const chaptersQuery = `{documents {cIndexes { chapter } } }`;
const chaptersResult = pk.gqlQuerySync(chaptersQuery);
const ret = {};
for (const chapter of chaptersResult.data.documents[0].cIndexes.map(ci => ci.chapter)) {
    const chapterQuery = `{documents {sofria(indent: 2, chapter: ${chapter}) } }`;
    // FIXME: instead of adding the chapter to a larger document to be returned, write the chapter out to the filesystem
    // outfile = first seven of directory name (eg ENGESVN) + "_" + book_id + "_" + ${chapter}
    // filename example: ENGESV_040MAT_1.json
    // do we want to name json files consistently with audio files?  eg ENGESVN_ET-json/ENGESVN_ET_B001_MAT_001.json
    // per https://docs.google.com/document/d/1ytVKiyzTXmPsEz170UHTlZ8NXeXxUOrqNgpPurm_AGE/edit#heading=h.y3ecefloodui
    // upside: consistency.  downside: change from current practice (who cares?).  
    // bummer: text mediaIDs have a _ which is also the delimiter in our filename convention
    chapter_json = JSON.parse(pk.gqlQuerySync(chapterQuery).data.documents[0].sofria);
    // output chapter_json to outfile
}


console.log(JSON.stringify(ret, null, 2));
