dockermon
====

`dockermon` is a monitoring tool for [Docker][docker]. dockermon allows for the execution of Javascript modules in response to docker events or the rendering of templates.

===

### Installation

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

### Usage

```
Usage: dockermon [options] -i <source>

Options:
  --input, -i           Either as .js file to execute on change or a .jst template to generate on change                  [default: ""]
  --output, -o          Location to output result to in file system. The output is sent to stdout if not specified      
  --help, -h            Show this help documentation                                                                    
  --version, -v         Display version number                                                                          
  --endpoint, -e        Docker Remote API endpoint. This will default to the value of `DOCKER_HOST`                       [default: "/tmp/docker.sock"]
  --interval, -I        Regenerate from input at given interval (either provided as number of seconds or as CRON string)  [default: 0]
  --notify, -n          Run command after template or module has been ran                                               
  --only-exposed, -x    Only include containers with exposed ports                                                        [default: false]
  --only-published, -p  Only include containers with published ports                                                      [default: false]
  --watch, -w           Run continuously and monitors Docker container events                                           
  --force, -f           Run input even if no containers are found                                                         [default: true]
```
[docker]: https://docker.com
[releases]: https://github.com/jworley/dockermon/releases
