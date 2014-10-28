describe('dockermon client', function() {
  describe('input', function() {
    describe('node module', function () {
      it('should run in an isolated VM');
      it('should expect a function to be returned');
    });

    describe('template', function () {
      it('should be compiled');
    });
  });

  describe('output', function() {
    it('should write to stdout when not specified');
    it('should write to the given file when specified');
  });

  describe('endpoint', function() {
    it('should accept UNIX path');
    it('should accept an IP address and port');
  });

  describe('interval', function () {
    it('should accept numerical seconds');
    it('should accept a CRON string');
    it('should accept a CRON string with seconds');
  });

  describe('notify', function () {
    it('should execute the given command when the file changes');
    it('should not execute the command if the file remains unchanged');
  });

  describe('filters', function () {
    it('should only include containers with exposed ports when --only-exposed is true');
    it('should only include containers with published ports when --only-published it true');
  });

  describe('watch', function () {
    it('should watch for new events');
  });
})