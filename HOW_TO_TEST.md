This is a file with a listing of implemented features, and how to test them in practice.

# CLI
To create a server: node . --server
To create a client: node . --client --nick="nickName"
A CLI is automatically initiated for the client. 

A command can be given to the CLI by: \commandName --parameterName=argument input for main parameter
A summarization of all commands can be given by typing in the command: \help
A summarization of the command and its parameters can be given by typing in the command: \help commandName
Parameters should be given in the same order as the help text given by \help commandName shows them.

Autocomplete:
The autocomplete works by going up and down in the option list. An option can be chosen by pressing the tab key.

Test:
The test can be run by: npm run-script test_CLI.

# HTTPS
Building this project (*npm run-script build*) automatically generates an https-key and a certificate. These are both used by the client and the server when you run them from within the main folder.
The server is associated with a key and a certificate, the client can use a certificate to authenticate the server and its domain.

When a client attempts to connect to a server, there are two options:

1. If there's a match with a host that's listed in 'trusted_servers.json', then the connection will be closed if the certificate of the server does not match with the trusted certificate of the client (to prevent MITM attacks).
2. A client can also connect to a server that is not listed in 'trusted_servers.json'. In this case, the connection will not be closed, but the client will get a log message that mentions the security issues of the connection. The connection is still encrypted, but the client is vulnerable to MITM attacks

Option 1 can be tested by just building the project and starting a connection. Option 2 can be tested by editing 'trusted_servers.json' (removing the 'localhost' entry).

# Reconnect
Building this project (*npm run-script build*) automatically generates a keypair. This keypair can be used by a client. The script for generating a keypair is src/bin/generate_keypair.ts

There are two options to initialize a client:

1. *node . --client --nick=my_nick*: When you don't specify which keys to use, a keypair is automatically generated and saved in keys/publicKey.pem and keys.privateKey.pem
2. *node . --client --nick=my_nick --public=keys/my_public_key.pem --private=my_private_key.pem*: You can also specify the locations of the keypair you want to use.

(Remark: '.' points to dist/index.js)

Essentially, these keys are used to verify clients. When a client attempts to connect, the server sends a request to sign a message. The client cannot do anything until he sends a valid signature. If the signature isn't valid, the client is disconnected by the server (can be tested: use a wrong private key with client initialization option 2).


# Channels

Clients can create, join and leave channels. Once joined to a channel, clients can send messages to this channel which all clients on the channel will recieve. If they are an admin of a channel, they also have the authority to delete the channel. A channel also will be deleted after 2 seconds of being empty, meaning there is no client in the channel. 

The test cases are located in src/test/channels_test.ts file. These cases will verify the basic implementation of the channels mentioned above. The test can be run with the command: npm run-script test. This will run the main test file (src/test/test.ts). This should give a perfect score. 

It is also possible to test the implementation manually. After creating a server and some clients, as described in the CLI section in this file, the next commands can be used to test. It is suggested to enter *set debug=chat:* * before activating the server/clients (for windows) or *DEBUG=chat:* ... * (for Linux). That way a lot of information will be available, allowing to understand the program better.

Create a channel: /create-channel *channelName*
Join a channel: /join-channel *channelName*
Leave a channel: /leave-channel *channelName*
Send a message to a channel: /send-channel --channelName=*channelName* *message*
Delete a channel: /delete-channel *channelName*
Print all channels: /print-all-channels

The first command can take optional arguments, listed by the command */help create-channel*. These arguments allow to activate or alter some channel features.

As clarification when studying the test file: the reason being that there should be five channels after creating only two channels, is that there are three clients created. Each of these clients automatically creates a channel of their own. This feature was implemented by reconnect and is explained above. 


# Plugins
The different plugins and their index files are situated in the /src/plugins folder. In this folder you can also find a pluginsConfig.json file. To activate a plugin you need to set the 'active' status to true in this file. If you want to test the behaviour of a certain plugin than it's obviously necessairy that the plugin state is active. There are two ways to test the plugin structure, you can run the pluginTest.ts file to see if the plugins behave correctly, or you can start a server with a client and some plugins and than sexamine the specific behaviour of the plugins, both methods are specified below.

Before trying any of these methods, be sure to do *npm install* in a terminal.

## pluginTest.ts file
The pluginTest.ts file can be found in the main folder and is used to test the basic behaviour of the different plugins. You can run this file to see which active plugins behave correctly. What we see as correct behaviour for every plugin is defined below.

Correct behaviour: 
1. The first plugin is the Eliza chatbot plugin. This plugin behaves correctly if it only generates answers when it's spoken to with the right prompt (defined at initialization). If it receives messages that don't start with the correct prompt, the bot needs to ignore these.
2. The seconds plugin is the CoronaBot plugin. This plugin must only give you the coronanumbers of a specific country if it's adressed with the right prompt (defined at initialization). If the message doesn't start with the right prompt or if the country is not specified or invalid the CoronaBot must not return any corona numbers.
3. The third plugin is the rot13 encryption plugin. This plugin must encrypt and decrypt every message that it sends or receives.

PluginTest can be run by using the npm script *pluginTest*. This wil firstly build all typescript files and run the test accordingly. If all tests succes you will receive *ALL PLUGIN TESTS PASSED* message.

## Specific plugin testing
to get extra information you can active the debug module with *set DEBUG=chat:* *.

To test the specific behaviour of the plugins you can create a server with *node . --server*. Once the server is created, you can create a client to send messages to the plugins with *node . --client --nick='Your nickname'*

### ElizaBot
To get all options for starting up an ElizaBot you can use *node . -h*, here you can see all the different Eliza startup options. To create a simple Eliza bot, you can use *node. --eliza-bot --eliza-bot-prompt="Your-prompt"*.

The Eliza bot acts like a chatclient so you can minimize the command window in which you started Eliza and use another command window to chat with the bot. To addres Eliza you can use the command */shout-to-all your-prompt your-message*. This is the only way to make Eliza answer your messages.

Eliza will automatically send a message if you haven't said anything for a while. To end the conversation with Eliza and terminate its actions you can send a termination message of the form */shout-to-all your-prompt termination-message*. Some examples of valid termination messages are 'Goobye', 'Exit, and 'Bye'.

### CoronaBot
The functionality of the CoronaBot is very similar to that of the ElizaBot. The same command can be used to see all the startup options. If you want to initialize a CoronaBot you can use the same command as that of the ElizaBot except for the word *eliza*, this needs to be *corona* in this case.

To get the daily Coronanumbers from the CoronaBot you can use the command */shout-to-all your-prompt your-country*. The country that you want the information from needs to be the country that you specify in the *your-country* part of the command.

### rot13
To test if this bot actually encrypts and decrypts your messages you must have the DEBUG statements activate. This can be done as explained above.

Create a new chatclient and send a message to the server using the command */shout-to-all message.* The DEBUG statements will show you the encrypted and decrypted versions of the message that you sent to the server.

# P2P architecture
There is a working P2P server architecture implemented. To test the basic functionality off this architecture, the testfile can be run using the test script created in the package.json file. This will test is the servers can be started up and if some basic features work. To test manually, servers can be started up as follow:

A first server:
```
node . --server
```
This will start a first server on your network on port 3000, this port can be changed using the --port= option. To start up a second server, some information off the first server needs to be given, this will printed on creation off the first server.
```
node . --server --port=3005 --ext_adress=localhost:3000
```
Important is that 2 servers cannot share a port on the same network, so the --port needs to be added here. The external adress is the ip adress and port off any off the other servers that were started up, this information can be obtained by looking at the terminal where any server was already started up. You can also give the external port or adress using the --this_ext_adress and --this_ext_port options, for more information use --help. A client can connect to any server on startup using:
```
node . --client --nick=... --client_url=localhost:3005
```
Where client_url is the adress off the server.
A client can use CLI commands to ask all the ip adresses that are on the P2P ring and conenct to any off them using the correct commands. For more information type /help p2p in de client terminal.
A thing to test is the correct connection and disconnection off the servers in the P2P ring. Also the connection off the client to any off the servers and the channels transfering correctly.

A Functionality that is not implemented is when a server disconnects, it will not transfer the connections off the users to other servers in the P2P loop, so the connected users will just disconnect completely from the server ring.