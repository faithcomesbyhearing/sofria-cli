const fse = require("fs-extra");
const generateJsonHandler = require("./sofria_mediaId");
const populateDBHandler = require("./gqlquery_verses_by_usx");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

yargs(hideBin(process.argv))
  .command(
    "run [directory]",
    "process the USX directory",
    (yargs) => {
      return yargs.positional("directory", {
        describe: "Folder where it should iterate to process the USX files",
        demandOption: true,
        default: "",
      });
    },
    (argv) => {
      if (argv.directory) {
        if (!fse.existsSync(argv.directory)) {
          throw new Error(`ERROR: directory: ${argv.directory} must exist.`);
        }

        if (!argv.directory.endsWith("/")) {
          argv.directory += "/";
        }

        if (argv.generateJson) {
          generateJsonHandler.run(argv.directory, argv.generateJson);
        }

        if (argv.populateDb) {
          let missingVersesAllowed = null;
          if (argv.missingVersesAllowed) {
            try {
              missingVersesAllowed = JSON.parse(argv.missingVersesAllowed);
            } catch (error) {
              throw new Error(
                `Error parsing JSON: ${argv.missingVersesAllowed}`
              );
            }
          }
          populateDBHandler.run(
            argv.directory,
            argv.populateDb,
            missingVersesAllowed
          );
        }
      } else {
        console.error("Directory path is required");
        process.exit(1);
      }
    }
  )
  .option("generate-json", {
    alias: "gj",
    type: "string",
    description:
      "Directory path where it will generate the formatted json files",
  })
  .option("populate-db", {
    alias: "pdb",
    type: "string",
    description: "Sqlite Database path where it will be the verses",
  })
  .option("missing-verses-allowed", {
    alias: "mva",
    type: "string",
    description:
      "JSON string about indexed array is sorted by book, chapter, and missing verses allowed list",
  })
  .strictCommands()
  .demandCommand(1)
  .fail(function (msg, err) {
    if (err) throw err;
    console.error("Error!");
    console.error(msg);
    process.exit(1);
  })
  .parse();
