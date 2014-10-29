var Container = require('../lib/container'),
  assert = require('assert'),
  containerInspect = {
    "Id": "4fa6e0f0c6786287e131c3852c58a2e01cc697a68231826813597e4994f1d6e2",
    "Created": "2013-05-07T14:51:42.041847+02:00",
    "Path": "date",
    "Args": [],
    "Name": "/awesomesauce_1",
    "Config": {
      "Hostname": "4fa6e0f0c678",
      "User": "",
      "Memory": 0,
      "MemorySwap": 0,
      "AttachStdin": false,
      "AttachStdout": true,
      "AttachStderr": true,
      "PortSpecs": null,
      "Tty": false,
      "OpenStdin": false,
      "StdinOnce": false,
      "Env": [
        "CUSTOM=variable"
      ],
      "Cmd": [
        "date"
      ],
      "Dns": null,
      "Image": "joeregistry/awesomesauce:latest",
      "Volumes": {},
      "VolumesFrom": "",
      "WorkingDir": ""
    },
    "State": {
      "Running": false,
      "Pid": 0,
      "ExitCode": 0,
      "StartedAt": "2013-05-07T14:51:42.087658+02:01360",
      "Ghost": false
    },
    "Image": "f7481e01405705c8cd543508ae0467464c63ab671f18512c7c93bf31f3602579",
    "NetworkSettings": {
      "IpAddress": "172.17.0.19",
      "IpPrefixLen": 0,
      "Gateway": "172.17.42.1",
      "Bridge": "",
      "PortMapping": null,
      "Ports": {
        "3000/tcp": null
      }
    },
    "SysInitPath": "/home/kitty/go/src/github.com/docker/docker/bin/docker",
    "ResolvConfPath": "/etc/resolv.conf",
    "Volumes": {},
    "HostConfig": {
      "Binds": null,
      "ContainerIDFile": "",
      "LxcConf": [],
      "Privileged": false,
      "PortBindings": {
        "80/tcp": [{
          "HostIp": "0.0.0.0",
          "HostPort": "49153"
        }]
      },
      "Links": ["/name:alias"],
      "PublishAllPorts": false,
      "CapAdd": ["NET_ADMIN "],
      "CapDrop": ["MKNOD"]
    }
  };

describe('Container class', function () {
  var container;

  beforeEach(function () {
    container = new Container(containerInspect);
  });

  it('should contain the raw response', function () {
    assert.deepEqual(container.rawContainer, containerInspect);
  });

  it('should contain the id', function () {
    assert.equal(container.id, "4fa6e0f0c6786287e131c3852c58a2e01cc697a68231826813597e4994f1d6e2");
  });

  it('should contain the name', function () {
    assert.equal(container.name, '/awesomesauce_1');
  });

  it('should contain the gateway', function () {
    assert.equal(container.gateway, '172.17.42.1');
  });

  it('should contain the image', function () {
    assert.deepEqual(container.image, { registry: 'joeregistry', repo: 'awesomesauce', tag: 'latest'});
  });

  it('should parse environment variables', function() {
    assert.deepEqual(container.env, { CUSTOM: 'variable' });
  });

  it('shuuld parse IP Addresses', function() {
    assert.deepEqual(container.addresses, [{ ipAddress: '172.17.0.19', port: '3000' }]);
  });
});