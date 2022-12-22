const Model = require("./Model");
const IOError = require("../util/IOError");

class Verses extends Model {
  createTable(callback) {
    const statement =
      "CREATE TABLE IF NOT EXISTS verses(" +
      "sequence integer not null primary key," +
      "reference text not null, " +
      "verse_sequence integer not null, " +
      "text text not null)";
    this.db.executeDDL(statement, function (err) {
      if (err instanceof IOError) {
        callback(err);
      } else {
        callback();
      }
    });
  }

  load(array, callback) {
    const uniqueTest = new Map();
    let priorVerse = null;
    for (const element of array) {
      const key = element[0];
      if (uniqueTest.has(key)) {
        console.log(
          "Duplicate verse reference " +
            key +
            " after " +
            uniqueTest.get(key) +
            " and " +
            priorVerse
        );
      }
      uniqueTest.set(key, priorVerse);
      priorVerse = key;
    }
    const statement =
      "INSERT INTO verses(reference, verse_sequence, text) VALUES (?,?,?)";
    this.db.bulkExecuteDML(statement, array, function (count) {
      if (count instanceof IOError) {
        callback(count);
      } else {
        console.log("load verses success, rowcount", count);
        callback();
      }
    });
  }

  getVerses(values, callback) {
    const numValues = values.length || 0;
    const array = [];
    for (let i = 0; i < numValues; i++) {
      array[i] = "?";
    }
    const statement =
      "SELECT reference, verse_sequence, text FROM verses WHERE reference IN (" +
      array.join(",") +
      ") order by rowid";
    this.db.selectSSIF(statement, values, function (results) {
      if (results instanceof IOError) {
        callback(results);
      } else {
        if (results.length < 3) {
          callback(new IOError({ code: 0, message: "No Rows Found" }));
        } else {
          callback(results);
        }
      }
    });
  }

  drop(callback) {
    this.db.executeDDL("DROP TABLE IF EXISTS verses", function (err) {
      if (err instanceof IOError) {
        callback(err);
      } else {
        callback();
      }
    });
  }
}

module.exports = Verses;
