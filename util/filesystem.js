const fse = require("fs-extra");
const path = require("path");

class Filesystem {
  static async getListFileFromDirectory(dirPath) {
    try {
      const filesUsx = await fse.readdir(dirPath);
      return filesUsx.map((fileUsx, index) => {
        const fileFormat = fileUsx.split(".");
        const name = fileFormat[0] ? fileFormat[0] : "";
        const suffix = fileFormat[1] ? fileFormat[1] : "";

        return {
          index,
          file: {
            fullpath: path.join(dirPath, fileUsx),
            name,
            suffix,
            fullname: fileUsx,
          },
        };
      });
    } catch (err) {
      console.error(`Unable to read directory: ${dirPath}`, err);
    }
  }
}

module.exports = Filesystem;
