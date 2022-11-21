class IOError {
  constructor(err) {
    if (err.code && err.message) {
      this.code = err.code;
      this.message = err.message;
    } else {
      this.code = 0;
      this.message = JSON.stringify(err);
    }
  }
}

module.exports = IOError;
