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

var path = require('path'),
    fs = require('fs'),
    debug = require('debug')('dockermon')
    Dockermon = require('./index');

function toRelative(pt) {
  if(pt.substr(0,1) == path.sep) return pt;
  return path.join(process.cwd(), pt);
}

var cli = require('yargs')
  .usage('Usage: $0 [options] -i <source>')
  .strict()
  .options('input', {
    alias: 'i',
    desc: 'Either as .js file to execute on change or a .jst template to generate on change',
    default: ''
  })
  .options('output', {
    alias: 'o',
    desc: 'Location to output result to in file system. The output is sent to stdout if not specified'
  })
  .options('help', {
    alias: 'h',
    description: 'Show this help documentation'
  })
  .options('version', {
    alias: 'v',
    description: 'Display version number'
  })
  /*.options('config', {
    alias: 'c',
    description: 'Use the specified config instead of the command-line options'
  })*/
  .options('endpoint', {
    alias: 'e',
    description: 'Docker Remote API endpoint. This will default to the value of `DOCKER_HOST`',
    default: process.env.DOCKER_HOST || '/var/run/docker.sock'
  })
  .options('interval', {
    alias: 'I',
    description: 'Regenerate from input at given interval (either provided as number of seconds or as CRON string)',
    default: 0
  })
  .options('notify', {
    alias: 'n',
    description: 'Run command after template or module has been ran'
  })
  .options('only-exposed', {
    alias: 'x',
    description: 'Only include containers with exposed ports',
    default: false
  })
  .options('only-published', {
    alias: 'p',
    description: 'Only include containers with published ports',
    default: false
  })
  .options('watch', {
    alias: 'w',
    description: 'Run continuously and monitors Docker container events'
  })
  .options('force', {
    alias: 'f',
    default: true,
    description: 'Run input even if no containers are found'
  })
  .check(function(argv) {
    if (argv.v || argv.h) return;
    var inputPath = toRelative(argv.input || '');
    if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
      throw 'Invalid value for `input`';
    }
  });

var argv = cli.argv;

if (argv.h) {
  cli.showHelp();
  process.exit();
} else if (argv.v) {
  var pkgInfo = { name: 'dockerman', version: '0.1.1' };
  console.log('%s %s', pkgInfo.name, pkgInfo.version);
  process.exit();
}

argv.input = toRelative(argv.input);
new Dockermon(argv).run();