# sofria-cli
Command Line wrapper for Proskomma Sofria

# Install dependencies
```shell
npm install
```

# E.g
```shell
node sofria_mediaId.js Abidji_N2ABIWBT_USX
```

# test
Use two test cases:

- Spanish_N2SPNTLA_USX
```shell
# clean output folder:
rm -rf output/Spanish_N2SPNTLA_USX-json/*.*

# run sofria cli
node sofria_mediaId.js test/input/Spanish_N2SPNTLA_USX/ ./output Spanish_N2SPNTLA_USX
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
node sofria_mediaId.js test/input/Akawaio_N2AKEBSS_USX/ ./output Akawaio_N2AKEBSS_USX
```
The above test should create 28 .json files

```shell
ls -1 output/Akawaio_N2AKEBSS_USX-json/ |  wc -l 
```
