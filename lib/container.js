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

var _ = require('lodash');

var Container = module.exports = function Container(container) {
  if (!(this instanceof Container)) return new Container(container);

  this.rawContainer = container;
  this.id = container.Id;
  this.name = container.Name;
  this.addresses = _.map(container.NetworkSettings.Ports, function(hostConfig, port) {
    var portNum = port.split('/')[0];

    return { ipAddress: container.NetworkSettings.IPAddress, port: portNum };
  });
  this.gateway = container.NetworkSettings.Gateway;
  this.env = { };
  _.forEach(container.Config.Env, function(envVar) {
    var parts = envVar.split('=');
    this.env[parts[0]] = parts[1];
  }, this);
  this.image = { registry: '', repo: '', tag: '' };
  if (container.Config.Image.indexOf('/') > -1) {
    var parts = container.Config.Image.split('/');
    this.image.registry = parts[0];
    this.image.repo = parts[1];
  } else {
    this.image.repo = container.Config.Image;
  }

  if (this.image.repo.indexOf(':') > -1) {
    var parts = this.image.repo.split(':');
    this.image.repo = parts[0];
    this.image.tag = parts[1];
  };
};
