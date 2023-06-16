const fse = require("fs-extra");
const generateJsonHandler = require("./sofria_mediaId");
const populateDBHandler = require("./gqlquery_verses_by_usx");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const directoryArgConfig = (yargs) => {
  return yargs.positional("directory", {
    describe: "Folder where it should iterate to process the USX files",
    demandOption: true,
    default: "",
  });
};

const validateDirectory = (directory) => {
  if (!fse.existsSync(directory)) {
    throw new Error(`ERROR: directory: ${directory} must exist.`);
  }

  if (!directory.endsWith("/")) {
    directory += "/";
  }

  return directory;
};

const parseMissingVersesAllowed = (missingVersesAllowed) => {
  let parsed = null;
  if (missingVersesAllowed) {
    try {
      parsed = JSON.parse(missingVersesAllowed);
    } catch (error) {
      throw new Error(`Error parsing JSON: ${missingVersesAllowed}`);
    }
  }
  return parsed;
};

const commandHandler = async (argv) => {
  if (!argv.directory) {
    console.error("Directory path is required");
    process.exit(1);
  }

  argv.directory = validateDirectory(argv.directory);

  if (argv.generateJson) {
    await generateJsonHandler.run(argv.directory, argv.generateJson);
  }

  if (argv.populateDb) {
    const missingVersesAllowed = parseMissingVersesAllowed(
      argv.missingVersesAllowed
    );
    await populateDBHandler.run(
      argv.directory,
      argv.populateDb,
      missingVersesAllowed
    );
  }
};

yargs(hideBin(process.argv))
  .command(
    "run [directory]",
    "process the USX directory",
    directoryArgConfig,
    commandHandler
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
