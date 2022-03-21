# functional requirements
Here, the user-observable-requirements will be listed. These should all be observable by any user and we will not go into detail as to how these work:
* A user should be able to see startup options after using the command node . -h or node . --help.

* If a user wants to start up a server, the user should be able to using the command node . --server with the possibility of using extra arguments found in the startup options.

* When a user wants to join a chat server he/she can do this using the command node . --client --nick=*your_nick*. Additonal options (e.g. --public, --private) can be found in the startup options menu.

* Once a user has joined the server, the user can type several commands. The possible commands can be seen by typing: / . These commands can be scrolled through by using the arrows on your keyboard and auto-filled with the tab button. The following commands are currently implemented:
    * exit: exit the server
    * set-default:  set a default command when typing a message
    * show-default:  shows the default command when typing a message
    * help: gives an explanation by the given command
    * shout-to-all: send a message to everyone on the server
    * create-channel: create a channel with a given channel name
    * join-channel: join a channel with the given channel-name
    * leave-channel: leave the given channel
    * send-channel: send the channel a message
    * delete-channel: delete a given channel
* If a user wants to use plugins he/she should open the pluginsConfig.json and put true/false on the active entry on the plugins that should be active/inactive. These can be started up using the configuration in the startup menu options:
    * Eliza-bot: A chat-bot that will chat with a user when spoke to
    * Corona-bot: a chat bot that will give the latest corona numbers when spoken to
    * Rot-13: an encryption bot that will encrypt and decrypt messages
* Any user should be able to join multiple channels
* In principle, there can only be one user with a given nick, unless you use identical public keys. In other words, it's only possible to start multiple clients with the same nick if you use the same keypair for these clients.
* When a user disconnects, he has a timespan of 5 minutes to reconnect. After this timespan, his nick becomes inactive and anyone can join using that nick (and an arbitrary keypair).

# security requirements

Like the functional requirements, we will only refer to the observable requirements visible to the users.

## integrity requirements
Here we desciribe an upper bound on the externally observable behaviours exhibited by the system. In other words, we will describe which behaviours cannot be present in our system:
* An error should always be handled by the system, so no user should ever run into an error.

* A user should never be closed down at random.
* A server should never be closed down at random
* A client that uses a specific nickname cannot be impersonated by a different client with a different public key. As long as your private key is kept safe and sound, you are guaranteed your identity (= nickname) cannot be stolen.
* When you do not get a disclaimer warning you that there's no trusted certificate for the given domain as a client, you can trust the server (no MITM attacks)
## confidentiality requirements
Here we will describe an upper bound on the information that flows from the system to the environment. We describe which information should not become knowable to particular external parties. We will differ 2 cases here:
* The key that is associated with the certificate of the server

* The private keys of clients
* The exchanged messages cannot be exposed (they are encrypted)
## availability requirements
The server should be able to handle a reasonable amount of clients, but an effective limit is not known.

# Non-functional requirements
* All testcases can be run using 'npm run-script test'. These test cases cover the basic functionality of all features.

* Debugging is possible using the DEBUG=... prefix in terminal (cf. README.md)
