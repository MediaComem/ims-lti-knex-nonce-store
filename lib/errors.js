class TimestampError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimestampError';
  }
}

class NonceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NonceError';
  }
}

module.exports = {
  TimestampError: TimestampError,
  NonceError: NonceError
};
