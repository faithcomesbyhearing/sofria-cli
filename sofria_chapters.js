const path = require("path");
const fse = require("fs-extra");
const { Proskomma } = require("proskomma");
if (process.argv.length !== 3) {
  throw new Error(`Expected exactly 1 argument (srcPath)`);
}
const fqPath = path.resolve(process.argv[2]);
if (!fse.existsSync(fqPath)) {
  throw new Error(`srcPath '${fqPath}' does not exist`);
}
const pk = new Proskomma();
const content = fse.readFileSync(fqPath).toString();
const suffix = fqPath.split(".").reverse()[0];
pk.importDocument({ lang: "xxx", abbr: "yyy" }, suffix, content);
const chaptersQuery = `{documents {cIndexes { chapter } } }`;
const chaptersResult = pk.gqlQuerySync(chaptersQuery);
const ret = {};
for (const chapter of chaptersResult.data.documents[0].cIndexes.map(
  (ci) => ci.chapter
)) {
  const chapterQuery = `{documents {sofria(indent: 2, chapter: ${chapter}) } }`;
  ret[`${chapter}`] = JSON.parse(
    pk.gqlQuerySync(chapterQuery).data.documents[0].sofria
  );
}
console.log(JSON.stringify(ret, null, 2));
