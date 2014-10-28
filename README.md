# dockermon

[![Dependencies](http://img.shields.io/david/jworley/dockermon.svg?style=flat-square)][david]
[![Build Status](http://img.shields.io/travis/jworley/dockermon.svg?style=flat-square)][build]
[![NPM Version](http://img.shields.io/npm/v/dockermon.svg?style=flat-square)][npm]
[![Github Version](http://img.shields.io/github/release/jworley/dockermon.svg?style=flat-square)][releases]

`dockermon` is a monitoring tool for [Docker][docker]. dockermon allows for the execution of Javascript modules in response to docker events or the rendering of templates.

## Installation

dockermon can be installed from NPM using:

```
$ npm install -g dockermon
```

There are also a binary version of available in the [releases][releases].
Download the binary, untar it, and add it to you PATH

```
$ wget https://github.com/jworley/dockermon/releases/download/v0.1.1/dockermon-linux-amd64-0.1.1.tar.gz
$ tar -zxvf dockermon-linux-amd64-0.1.1.tar.gz
$ ./dockermon
```

## Usage

```
Usage: dockermon [options] -i <source>

Options:
  --input, -i           Either as .js file to execute on change or a .jst template to generate on change                  [default: ""]
  --output, -o          Location to output result to in file system. The output is sent to stdout if not specified      
  --help, -h            Show this help documentation                                                                    
  --version, -v         Display version number                                                                          
  --endpoint, -e        Docker Remote API endpoint. This will default to the value of `DOCKER_HOST`                       [default: "/var/run/docker.sock"]
  --interval, -I        Regenerate from input at given interval (either provided as number of seconds or as CRON string)  [default: 0]
  --notify, -n          Run command after template or module has been ran                                               
  --only-exposed, -x    Only include containers with exposed ports                                                        [default: false]
  --only-published, -p  Only include containers with published ports                                                      [default: false]
  --watch, -w           Run continuously and monitors Docker container events                                           
  --force, -f           Run input even if no containers are found                                                         [default: true]
```

## Documentation

Documentation is available in the [Wiki][wiki]

## Donations

I code, therefore I am. To be honest I'd be writing this regardless but if you want to say thanks it would be greatly appreciated.

[![Gratipay](http://img.shields.io/gratipay/indyjworley.svg?style=flat-square)][gratipay]
[![Donate Coins](http://img.shields.io/badge/donate-coins-blue.svg?style=flat-square)][coins]

## License

[Apache 2.0][license]

[docker]: https://docker.com
[releases]: https://github.com/jworley/dockermon/releases
[npm]: https://www.npmjs.org/package/dockermon
[david]: https://david-dm.org/jworley/dockermon
[wiki]: https://github.com/jworley/dockermon/wiki
[license]: https://github.com/jworley/dockermon/blob/master/LICENSE
[gratipay]: https://gratipay.com/indyjworley/
[coins]: http://gravaco.in/741ca5ac451e12b8b1c50f285b7ccc2a
[build]: https://travis-ci.org/jworley/dockermon