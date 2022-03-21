## How to run the current code

You can get a help message on your screen by doing
```console
$ node . -h
```

You can read there that you can start the server by doing
```console
$ node . --server
```
If debugs are turned off (see later), there should be no messages on screen. If no messages appear the server is running correctly.

The code has a lot of debug statements which are not being printed by default.
To turn on debug output you can do e.g.
```console
$ DEBUG=chat:* node . --server
```
On Windows you have to set the debug with the following command:
```console
$ set DEBUG=chat:*
```
Now the debug is always activated in that window.


## Current setup

The code is currently created to run via browser, however it can also be ran via command line.

First we give the options apliable when creating a server. You can choose the port on which the server shoul run by doing: 
```console
$ node . --server --port=3500
```
This wil create a server on the port 3500. This is used via browser as wel as via command line.

### Browser client

When a server is started up, a client is created by going to
```console
http://localhost:3000
```
If the server has a custom port, it should be filled in after ':'. When a client is connected via browser, it has to follow the steps on screen, if any questions still present itself, a FAQ can be found within the browser by simply clicking the FAQ button on the right hand side off the screen after logging in.

### CLI client

When you want to connect a client to the server via CLI you do:
```console
$ node . --client --nick=Bart_Simpson
```

If the port on the server was not 3000, the client should be started as:
```console
$ node . --client --nick=Bart_Simpson --port=3500
```
There aare additional options which can be explored by typing:
```console
$ node . -h
```
After a client is connected, it can send messages and use all given commands. If a command is not clear, it can be cleared out by typing
```console
$ /command -h
```
and it should be cleared out.

## Random remarks

* Version numbers for npm packages follow the *semantic versioning* system:
  "{major version number}.{minor version number}.{patch number}". See
  <https://semver.org>.

