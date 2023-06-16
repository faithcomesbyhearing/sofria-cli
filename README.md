# sofria-cli

Command Line wrapper for Proskomma Sofria

# Install dependencies

```shell
npm install
```

# Description

This client will create and populate the tables: tableContents and verses into a sqlite DB using a folder of USX files.

1. The `tableContents` table will store data related to each book and the fields are:

```sql
tableContents(code, heading, title, name, chapters)
```

- The `code` field is the Book Code
- The `heading` field is the `h` tag that belongs USX file
- The `title` field is the `toc` tag that belongs USX file
- The `name` field is the Book name ("toc2" tag)
- The `chapters` field is a string with each chapter that belongs to a specific book separated by commas e.g. `1,2,3,4,...,23`

2. The `verses` table will store data related to each verse for each book and the fields are:

```sql
verses(reference, verse_sequence, text)
```

- The `reference` field is a string related to book code, chapter number and verse range e.g. `ACT:13:38-39`. The reference value has the following format:

```sql
BOOK_CODE:CHAPTER_NUMBER:VERSE_RANGE
```

- The `text` field is verse content.

- The `verse_sequence` field is a number column to guarantece that the verses records can be sorted correctly from biblebrain when it (biblebrain) pulls these records. Occasionally, a verse range is represented as NUMBER + Letter e.g. "3a" so, we need to separate the NUMBER to store it into an number column for sorting. This number will be stored into `verse_sequence` field

# E.g

```shell
node sofria_mediaId.js Abidji_N2ABIWBT_USX
```

# test sofria_mediaId

Use two test cases:

- Spanish_N2SPNTLA_USX

```shell
# clean output folder:
rm -rf output/Spanish_N2SPNTLA_USX-json/*.*

# run sofria cli
node biblebrain_uploader.js run test/input/Spanish_N2SPNTLA_USX/ --generate-json=./output/Spanish_N2SPNTLA_USX-json
```

The above test should create 150 .json files

```shell
ls -1 output/Spanish_N2SPNTLA_USX-json/ |  wc -l
```

- Akawaio_N2AKEBSS_USX

```shell
# clean output folder:
rm -rf output/Akawaio_N2AKEBSS_USX-json/*.*

# run sofria cli
node biblebrain_uploader.js run test/input/Akawaio_N2AKEBSS_USX/ --generate-json=./output/Akawaio_N2AKEBSS_USX-json
```

The above test should create 28 .json files

```shell
ls -1 output/Akawaio_N2AKEBSS_USX-json/ |  wc -l
```

- ENGNKJO1ET

```shell
# clean output folder:
rm -rf output/ENGNKJO1ET-json/*.*
# run sofria cli
node biblebrain_uploader.js run test/input/ENGNKJO1ET/ --generate-json=./output/ENGNKJO1ET-json
```

The above test should create 200 .json files

```shell
ls -1 output/ENGNKJO1ET-json/ |  wc -l
```

# unit tests

```shell
node tests/gqlquery_verses_by_usx.test.js
```

# test verses

## Case 1

```shell
# clean JSON output folder:
rm -rf output/Akawaio_N2AKEBSS_USX-json/*.*
```

```shell
# clean output folder:
rm -rf ./output/Akawaio_N2AKEBSS_USX-db
```

```shell
# create output folder:
mkdir ./output/Akawaio_N2AKEBSS_USX-db
```

```shell
# create db file:
touch ./output/Akawaio_N2AKEBSS_USX-db/Akawaio_N2AKEBSS_USX.db
```

```shell
node biblebrain_uploader.js run test/input/Akawaio_N2AKEBSS_USX/ --populate-db=./output/Akawaio_N2AKEBSS_USX-db/Akawaio_N2AKEBSS_USX.db --generate-json=./output/Akawaio_N2AKEBSS_USX-json
```

- Outcome

```shell
Generate JSON filese - Start process..
Populate DB - Start process..
Complete:  MAꞌSIU
success
File list (1) processing completed
Complete USX File: test/input/Akawaio_N2AKEBSS_USX/040MAT.usx
load verses success, rowcount 1069
load tableContents success, rowcount 1
```

The above test should create 28 .json files as well

```shell
ls -1 output/Akawaio_N2AKEBSS_USX-json/ |  wc -l
```

## Case 2

```shell
# clean JSON output folder:
rm -rf output/TXQWYIN_ET-json/*.*
```

```shell
# clean output folder:
rm -rf ./output/TXQWYIN1ET-db
```

```shell
# create output folder:
mkdir ./output/TXQWYIN1ET-db
```

```shell
# create db file:
touch ./output/TXQWYIN1ET-db/TXQWYIN1ET.db
```

```shell
node biblebrain_uploader.js run test/input/TXQWYIN1ET/ --populate-db=./output/TXQWYIN1ET-db/TXQWYIN_ET.db --generate-json=./output/TXQWYIN_ET-json
```

- Outcome

```shell
Generate JSON => Generate JSON filese - Start process..
Populate DB - Start process..
Populate DB => Complete:  Markus
Populate DB => success
Generate JSON => File list (1) processing completed
Generate JSON => Complete USX File: test/input/TXQWYIN1ET/041MRK.usx
load verses success, rowcount 634
load tableContents success, rowcount 1
```

The above test should create 16 .json files as well

```shell
ls -1 output/TXQWYIN_ET-json/ |  wc -l
```

## Case 3

```shell
# clean JSON output folder:
rm -rf ./output/SPNBDAO_ET-json/*.*
```

```shell
# clean output folder:
rm -rf ./output/SPNBDAO_ET-db
```

```shell
# create output folder:
mkdir ./output/SPNBDAO_ET-db
```

```shell
# create db file:
touch ./output/SPNBDAO_ET-db/SPNBDAO_ET.db
```

```shell
node biblebrain_uploader.js run test/input/Spanish_N2SPNBDA_USX/ --populate-db=./output/SPNBDAO_ET-db/SPNBDAO_ET.db --generate-json=./output/SPNBDAO_ET-json --missing-verses-allowed="{ \"MAT\": { \"17\" : [21], \"18\" : [11], \"23\" : [14] } }"
```

- Outcome

```shell
Generate JSON => Generate JSON filese - Start process..
Populate DB - Start process..
Populate DB => Complete:  Mateo
Populate DB => success
Generate JSON => File list (1) processing completed
Generate JSON => Complete USX File: test/input/Spanish_N2SPNBDA_USX/040MAT.usx
load verses success, rowcount 1068
load tableContents success, rowcount 1
```

The above test should create 28 .json files as well

```shell
ls -1 output/SPNBDAO_ET-json/ |  wc -l
```

# Recommendations

- Execute prettier command before each commit

```shell
./node_modules/.bin/prettier --write "./**/*.{js,jsx,ts,tsx,md}"
```
