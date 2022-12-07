const sqlite3 = require("sqlite3");
const IOError = require("./IOError");

class DatabaseHandler {
  database;

  constructor(databasePath) {
    this.database = new sqlite3.Database(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON");
    this.database.exec("PRAGMA encoding = 'UTF-8'");
  }

  select(statement, values, callback) {
    this.database.all(statement, values, function (err, results) {
      if (err) callback(new IOError(err));
      callback(results);
    });
  }

  bulkExecuteDML(statement, array, callback) {
    const that = this;
    this.database.serialize(function () {
      that.database.exec("BEGIN TRANSACTION", function (err) {
        if (err) callback(new IOError(err));
      });
      const stmt = that.database.prepare(statement, function (err) {
        if (err) callback(new IOError(err));
      });

      for (const element of array) {
        stmt.run(element, function (err) {
          if (err) callback(new IOError(err));
        });
      }

      that.database.exec("END TRANSACTION", function (err) {
        if (err) callback(new IOError(err));
        callback(array.length);
      });
    });
  }

  executeDDL(statement, callback) {
    this.database.exec(statement, function (err) {
      if (err) callback(new IOError(err));
      callback();
    });
  }

  close() {
    this.database.close();
  }
}

module.exports = DatabaseHandler;
