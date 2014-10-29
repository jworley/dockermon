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
    var outputData = '# Containers\n\n* mongo_1\n* web_1';
    it('should write to stdout when not specified', function(done) {
      var dockermon = new Dockermon({}),
          output = { write: function() { } },
          mockOutput = sinon.mock(output),
          _loadOutputStream = Dockermon.__get__('_loadOutputStream');

      mockOutput.expects('write').once().withArgs(outputData);
      Dockermon.__set__('outStreamDefault', output);
      dockermon.removeAllListeners();
      _loadOutputStream.call(dockermon);
      dockermon.outputStream(outputData, function() {
        mockOutput.verify();
        done();
      })
    });
    it('should write to the given file when specified', function(done) {
      var outputPath = '/tmp/test.md',
        dockermon = new Dockermon({ output: outputPath }),
        fs = { writeFile: function() { } },
        mockFS = sinon.mock(fs),
        fakeMkdirp = sinon.stub().yields();
        _loadOutputStream = Dockermon.__get__('_loadOutputStream');

      mockFS.expects('writeFile').withArgs(outputPath, outputData).yields();
      Dockermon.__set__('fs', fs);
      Dockermon.__set__('mkdirp', fakeMkdirp);
      dockermon.removeAllListeners();
      _loadOutputStream.call(dockermon);
      dockermon.outputStream(outputData, function() {
        mockFS.verify();
        done();
      })
    });
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
    var publishPorts = {
      "Id": "8dfafdbc3a40",
      "Image": "base:latest",
      "Command": "echo 1",
      "Created": 1367854155,
      "Status": "Exit 0",
      "Ports":[{"PrivatePort": 2222, "PublicPort": 3333, "Type": "tcp"}],
      "SizeRw":12288,
      "SizeRootFs":0
    }, exposedPorts = {
      "Id": "9cd87474be90",
      "Image": "base:latest",
      "Command": "echo 222222",
      "Created": 1367854155,
      "Status": "Exit 0",
      "Ports":[{"PrivatePort": 2222, "Type": "tcp"}],
      "SizeRw":12288,
      "SizeRootFs":0
    }, noPorts = {
      "Id": "3176a2479c92",
      "Image": "base:latest",
      "Command": "echo 3333333333333333",
      "Created": 1367854154,
      "Status": "Exit 0",
      "Ports":[],
      "SizeRw":12288,
      "SizeRootFs":0
    }, allContainers = [ publishPorts, exposedPorts, noPorts];
    it('should only include containers with exposed ports when --only-exposed is true', function(done) {
      var dockermon = new Dockermon({ onlyExposed: true }),
          mockDocker = sinon.mock(dockermon.docker),
          async = { map: function() { } },
          mockAsync = sinon.mock(async),
          _processContainers = Dockermon.__get__('_processContainers');

      Dockermon.__set__('async', async);
      mockDocker.expects('listContainers').yields(null, allContainers);
      mockAsync.expects('map').withArgs([ publishPorts, exposedPorts ]);
      dockermon.removeAllListeners();

      _processContainers.call(dockermon);

      mockDocker.verify();
      mockAsync.verify();
      done();
    });
    it('should only include containers with published ports when --only-published it true', function(done) {
      var dockermon = new Dockermon({ onlyPublished: true }),
          mockDocker = sinon.mock(dockermon.docker),
          async = { map: function() { } },
          mockAsync = sinon.mock(async),
          _processContainers = Dockermon.__get__('_processContainers');

      Dockermon.__set__('async', async);
      mockDocker.expects('listContainers').yields(null, allContainers);
      mockAsync.expects('map').withArgs([ publishPorts ]);
      dockermon.removeAllListeners();

      _processContainers.call(dockermon);

      mockDocker.verify();
      mockAsync.verify();
      done();
    });
  });

  describe('watch', function () {
    it('should watch for new events', function() {
      var dockermon = new Dockermon({ watch: true }),
          mockDocker = sinon.mock(dockermon.docker),
          res = { pipe: function() { }, on: function() { } },
          mockRes = sinon.mock(res);

      mockDocker.expects('getEvents').once().yields(null, res);
      mockRes.expects('pipe').once().returnsThis();
      mockRes.expects('on').withArgs('data');
      dockermon.removeAllListeners();
      dockermon.run();

      mockDocker.verify();
    });
  });
})