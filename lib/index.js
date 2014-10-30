// Copyright 2014 Jason Worley

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//   http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var async = require('async'),
  crypto = require('crypto'),
  debug = require('debug')('dockermon'),
  Dockerode = require('dockerode'),
  dockerodeOpts = require('dockerode-options'),
  domain = require('domain'),
  EventEmitter = require('events').EventEmitter,
  exec = require('child_process').exec,
  fs = require('fs'),
  JStream = require('jstream'),
  later = require('later'),
  mkdirp = require('mkdirp'),
  path = require('path'),
  util = require('util'),
  vm = require('vm'),
  _ = require('lodash'),
  logger = console,
  outStreamDefault = process.stdout,
  Container = require('./container');

var Dockermon = module.exports = function Dockermon(options) {
  if (!(this instanceof Dockermon)) return new Dockermon(options);

  this.input = options.input;
  this.output = options.output;
  this.endpoint = options.endpoint;
  this.interval = options.interval;
  this.notify = options.notify;
  this.onlyExposed = options.onlyExposed;
  this.onlyPublished = options.onlyPublished
  this.watch = options.watch;
  this.force = options.force;

  this.docker = new Dockerode(dockerodeOpts(this.endpoint));

  this.once('run', _loadCallback.bind(this));
  this.once('callbackLoaded', _loadOutputStream.bind(this));
  this.once('outputStreamLoaded', _initialLoad.bind(this));
};

util.inherits(Dockermon, EventEmitter);

var _generateContext = function(input) {
  var context = {
    module: {
      exports: null
    },
    require: require,
    __dirname: path.dirname(input)
  };

  return context;
};

var _loadCallback = function() {
  var self = this;
  fs.exists(self.input, function(exists) {
    if (!exists) throw new Error('Input must exist');

    fs.readFile(self.input, 'utf-8', function(err, fileContents) {
      if (!!err) {
        logger.error('Error loading input file (%s): %s', self.input, err);
        process.exit();
      } else {
        try {
          var context = _generateContext(self.input);
          var retVal = vm.runInNewContext(fileContents, context, self.input);
          if (typeof retVal !== 'function') throw new Error('Input must be a function');
          self.callback = retVal;
          logger.log('Input (%s) loaded as module', self.input);
          self.emit('callbackLoaded');
        } catch (err) {
          logger.error('Could not load input (%s) as module, encoutered error: %s', self.input, err);
          var compiled = _.template(fileContents);
          self.callback = function(docker, containers, cb) {
            cb(null, compiled({
              containers: containers
            }));
          };

          logger.log('Input (%s) loaded as template', self.input);
          self.emit('callbackLoaded');
        }
      }
    });
  });
};

var _loadOutputStream = function() {
  var self = this;
  if (_.isEmpty(self.output)) {
    self.outputStream = function(data, cb) {
      outStreamDefault.write(data);
      cb();
    }
    self.emit('outputStreamLoaded');
  } else {
    var fullPath = path.resolve(self.output),
      outputDir = path.dirname(fullPath);
    mkdirp(outputDir, function(err) {
      self.outputStream = function(data, cb) {
        fs.writeFile(fullPath, data, cb);
      }
      self.emit('outputStreamLoaded');
    });
  }
};

var _initialLoad = function() {
  var self = this;
  debug('Initial load');
  _processContainers.call(self);

  self.on('run', _processContainers.bind(self));
};

var _notify = function() {
  var self = this;
  exec(self.notify, function(err) {
    if (!!err) {
      logger.error('Error running "%s": %s', self.notify, err);
      process.exit();
    }
  });
}

var _processContainers = function() {
  var self = this;
  debug('Processing containers')
  self.docker.listContainers(function(err, containers) {
    var filteredContainers =
      _.filter(containers, function(item) {
        return (_.any(item.Ports, 'PrivatePort') || !self.onlyExposed) &&
          (_.any(item.Ports, 'PublicPort') || !self.onlyPublished);
      });
    debug(filteredContainers);

    async.map(filteredContainers, function(container, cb) {
      var c = self.docker.getContainer(container.Id);
      c.inspect(function(err, data) {
        if (!!err) {
          cb(err);
        } else {
          cb(null, new Container(data));
        }
      });
    }, _processResults.bind(self));
  });
};

var _processResults = function(err, results) {
  if (!_.isEmpty(results) || self.force) {
    logger.log('Generating based on %d containers', results.length)
    var self = this;
    var d = domain.create();
    d.on('error', function(err) {
      logger.log('Error processing input: %s', err);
      process.exit();
    })

    d.run(function() {
      self.callback(self.docker, results, d.intercept(function(data) {
        d.exit();

        _writeAndNotify.call(self, data);
      }));
    });
  }
};

var _writeAndNotify = function(inputData) {
  if (_.isEmpty(inputData)) {
    return;
  }
  var self = this,
    outputHash, inputHash;
  if (fs.existsSync(self.output)) {
    var fileContents = fs.readFileSync(self.output, 'utf-8');
    debugger;
    outputHash = crypto.createHash('md5').update(fileContents, 'utf-8').digest('hex');
  };

  inputHash = crypto.createHash('md5').update(inputData, 'utf-8').digest('hex');
debugger;
  if (outputHash !== inputHash || _.isEmpty(outputHash)) {
    self.outputStream(inputData, function(err) {
      if (!!err) {
        logger.log('Error writing output: %s', err);
        process.exit();
      }

      if (!_.isEmpty(self.notify)) {
        logger.log('Output (%s) has changed running notify (%s)', self.output, self.notify);
        _notify.call(self);
      } else if (!_.isEmpty(self.output)) {
        logger.log('Output (%s) did not change, not running notify', self.output);
      }
    })
  };
};

Dockermon.prototype.run = function() {
  this.emit('run');
  var db_processContainers = _.debounce(_processContainers.bind(this), 250, {
    maxWait: 1000
  });

  if (this.watch) {
    this.docker.getEvents(function(err, res) {
      res.pipe(new JStream()).on('data', function(obj) {
        debug('Data recieved');
        db_processContainers();
      })
    });
  };

  if (!_.isEmpty(this.interval) ||
    (_.isNumber(this.interval) && this.interval > 0)) {
    var sched;
    if (_.isString(this.interval)) {
      var secondsIncluded = (this.interval.split(' ').length === 6);
      sched = later.parse.cron(this.interval, secondsIncluded);
    } else {
      sched = later.parse.recur().every(this.interval).second();
    }

    if (!!sched) {
      var self = this;
      self.timer = later.setInterval(db_processContainers, sched);
    }
  }
};