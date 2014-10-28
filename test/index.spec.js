var sinon = require('sinon'),
    rewire = require('rewire'),
    assert = require('assert'),
    Dockermon;

describe('dockermon client', function() {
  beforeEach(function () {
    Dockermon = rewire('../lib/index.js');
  });
  describe('input', function() {
    describe('node module', function () {
      var inputPath = 'test.js',
          script = 'module.exports = function(docker, containers, cb) { cb(null, "test"); }';
      beforeEach(function() {
        var mockFS = {
          exists: sinon.stub().withArgs(inputPath).yields(true),
          readFile: sinon.stub().withArgs(inputPath).yields(null, script)
        };

        Dockermon.__set__('fs', mockFS);
      });
      it('should run in an isolated VM', function(done) {
        var vm = { runInNewContext: function() { } },
            mockVM = sinon.mock(vm),
            _loadCallback = Dockermon.__get__('_loadCallback'),
            dockermon = new Dockermon({ input: inputPath });

        Dockermon.__set__('vm', vm);

        mockVM.expects('runInNewContext').once().withArgs(script).returns(function() {});
        dockermon.removeAllListeners();
        dockermon.once('callbackLoaded', function() {
          mockVM.verify();

          done();
        });

        _loadCallback.call(dockermon);
      });
      it('should expect a function to be returned', function(done) {
        var vm = { runInNewContext: function() { return "I'm a little teapot"; } },
            logger = { log: function() {}, error: function() {}},
            mockConsole = sinon.mock(logger);
            _loadCallback = Dockermon.__get__('_loadCallback'),
            dockermon = new Dockermon({ input: inputPath });
        Dockermon.__set__('vm', vm);
        Dockermon.__set__('logger', logger);

        mockConsole.expects('error').once();
        dockermon.removeAllListeners();
        dockermon.once('callbackLoaded', function() {
          mockConsole.verify();

          done();
        });

        _loadCallback.call(dockermon);
      });
    });

    describe('template', function () {
      var templateString = '# Containers\n<% _.forEach(containers, function(c) { %>* <%= c.name %>\n<% } %>',
          templatePath = 'test.jst';
      beforeEach(function() {
        var mockFS = {
          exists: sinon.stub().withArgs(templatePath).yields(true),
          readFile: sinon.stub().withArgs(templatePath).yields(null, templateString)
        };

        Dockermon.__set__('fs', mockFS);
      });
      it('should be compiled', function(done) {
        var _ = { template: function() { } },
            mockLodash = sinon.mock(_),
            _loadCallback = Dockermon.__get__('_loadCallback'),
            dockermon = new Dockermon({ input: templatePath });
        Dockermon.__set__('_', _);

        mockLodash.expects('template').once().withArgs(templateString);
        dockermon.removeAllListeners();
        dockermon.once('callbackLoaded', function() {
          mockLodash.verify();

          done();
        });

        _loadCallback.call(dockermon);
      });
    });
  });

  describe('output', function() {
    it('should write to stdout when not specified');
    it('should write to the given file when specified');
  });

  describe('endpoint', function() {
    it('should accept UNIX path', function() {
      var mockDockerode = sinon.spy();

      Dockermon.__set__('Dockerode', mockDockerode);

      new Dockermon({ endpoint: '/var/run/docker.sock'});

      assert(mockDockerode.calledWith({ socketPath: '/var/run/docker.sock' }));
    });
    it('should accept an IP address and port', function() {
      var mockDockerode = sinon.spy();

      Dockermon.__set__('Dockerode', mockDockerode);

      new Dockermon({ endpoint: '127.0.0.1:2375'});

      assert(mockDockerode.calledWith({ host: 'http://127.0.0.1', port: 2375 }));
    });
  });

  describe('interval', function () {
    it('should accept numerical seconds', function() {
      var interval = 1000,
          fakeSched = 'I am schedule',
          fakeLater = {
            parse: {
              recur: sinon.stub().returnsThis(),
              every: sinon.stub().returnsThis(),
              second: sinon.stub().returns(fakeSched)
            },
            setInterval: sinon.stub()
          },
          dockermon = new Dockermon({ interval: interval });
      Dockermon.__set__('later', fakeLater);

      dockermon.removeAllListeners();
      dockermon.run();

      assert(fakeLater.parse.every.calledWith(interval));
      assert(fakeLater.setInterval.calledOnce);
    });
    it('should accept a CRON string', function() {
      var interval = "* * * * *",
          fakeSched = 'I am schedule',
          fakeLater = {
            parse: {
              cron: sinon.stub().returns(fakeSched)
            },
            setInterval: sinon.stub()
          },
          dockermon = new Dockermon({ interval: interval });
      Dockermon.__set__('later', fakeLater);

      dockermon.removeAllListeners();
      dockermon.run();

      assert(fakeLater.parse.cron.calledWith(interval, false));
      assert(fakeLater.setInterval.calledOnce);
    });
    it('should accept a CRON string with seconds', function() {
      var interval = "* * * * * *",
          fakeSched = 'I am schedule',
          fakeLater = {
            parse: {
              cron: sinon.stub().returns(fakeSched)
            },
            setInterval: sinon.stub()
          },
          dockermon = new Dockermon({ interval: interval });
      Dockermon.__set__('later', fakeLater);

      dockermon.removeAllListeners();
      dockermon.run();

      assert(fakeLater.parse.cron.calledWith(interval, true));
      assert(fakeLater.setInterval.calledOnce);
    });
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