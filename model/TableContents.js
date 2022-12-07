const Model = require("./Model");
const IOError = require("../util/IOError");

class TableContents extends Model {
  drop(callback) {
    this.db.executeDDL("DROP TABLE IF EXISTS tableContents", function (err) {
      if (err instanceof IOError) {
        callback(err);
      } else {
        callback();
      }
    });
  }

  createTable(callback) {
    const statement =
      "CREATE TABLE IF NOT EXISTS tableContents(" +
      "code text primary key not null, " +
      "heading text null, " +
      "title text null, " +
      "name text null, " +
      "chapters text not null)";
    this.db.executeDDL(statement, function (err) {
      if (err instanceof IOError) {
        callback(err);
      } else {
        callback();
      }
    });
  }

  load(array, callback) {
    const statement =
      "INSERT INTO tableContents(code, heading, title, name, chapters) " +
      "values (?,?,?,?,?)";
    this.db.bulkExecuteDML(statement, array, function (count) {
      if (count instanceof IOError) {
        callback(count);
      } else {
        console.log("load tableContents success, rowcount", count);
        callback();
      }
    });
  }

  selectAll(callback) {
    const statement =
      "SELECT code, heading, title, name, chapters " +
      "FROM tableContents ORDER BY rowid";
    this.db.select(statement, [], function (results) {
      if (results instanceof IOError) {
        callback(results);
      } else {
        const array = [];
        for (let i = 0; i < results.rows.length; i++) {
          const row = results.rows.item(i);
          const book = {
            code: row.code,
            heading: row.heading,
            title: row.title,
            name: row.name,
            chapters: row.chapters.join(","),
          };
          array.push(book);
        }
        callback(array);
      }
    });
  }
}

module.exports = TableContents;
