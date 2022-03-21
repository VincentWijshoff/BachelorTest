import { usage } from 'yargs';

import ChatClient from './app/client';
import ChatServer from './app/server';
import { SocketioHttpServer, SocketioSocketClientSide } from './comm/impl/socketio';



import * as pluginFile from './plugins/plugin';
pluginFile.addPlugins();

// command line parsing:
const argv = usage('Usage: $0 --server --client')
    .help('h')
    .alias('h', 'help')
    .example('$0 --server [--host=hostname]', 'start a chat server')
    .example('$0 --client --nick=me', 'start a chat client')
    .example('$0 --server [--host=hostname] --client --nick=me', 'start both a chat server and a client')
    .epilog('(C) P&O CW 2020-2021')
    .option('server', {
        description: 'start the server',
        type: 'boolean',
        default: false
    })
    .option('host', {
        description: 'host name or IP address of the server',
        type: 'string',
        default: 'localhost'
    })
    .option('client', {
        description: 'start the client',
        type: 'boolean',
        default: false
    })
    .option('public', {
        description: 'public key file location',
        type: 'string'
    })
    .option('private', {
        description: 'private key file location',
        type: 'string'
    })
    .option('nick', {
        description: 'nickname',
        type: 'string'
    })
    .option('port', {
        description: 'The internal port for this server, 2 servers cannot have the same port in the same network. ( > 1023)',
        type: 'number',
        default: 3000
    })
    .option('this_ext_port', {
        description: 'the external port of this server in the p2p ring, standard 3000 unless otherwise given',
        type: 'number',
        default: 3000
    }).option('client_url', {
        description: 'this is the url the client will connect to. example: localhost:3000',
        type: 'string',
        default: 'localhost:3000'
    }).option('ext_adress', {
        description: 'this is the external adress the p2p server will connect to. example: localhost:3500',
        type: 'string',
        default: undefined
    }).option('this_ext_adress', {
        description: 'this is the external adress another server will connect to if the server wants to connect to this server, if blank, it will just be the external ip adress where this server will run. NOTE: if this is filled in, the external port will not be used',
        type: 'string',
        default: undefined
    }).option('CLI', {
        description: 'CLI plugin on or off',
        type: 'boolean',
        default: true
    })
    // eslint-disable-next-line no-unused-vars
    .check((argv, _) => {
        if ((argv.public && !argv.private) || (!argv.public && argv.private)) {
            throw new Error('--public and --private need to be specified at the same time');
        }
        return true;
    })
    // eslint-disable-next-line no-unused-vars
    .check((argv, _) => {
        if (argv.client && !argv.nick) {
            throw new Error('--client and --nick need to be specified at the same time');
        }
        return true;
    }).argv;

// Plugins might add more options, so we can only read the command line arguments here.
const port = argv.port;


// eslint-disable-next-line no-unused-vars
const url = `http://${argv.client_url}`; //REPLACE

if(argv.client) {
    // eslint-disable-next-line no-unused-vars
    let chatClient = argv.public && argv.private ?
        new ChatClient(
            new SocketioSocketClientSide(url),
            argv.nick ?? '',
            argv.CLI,
            argv.public,
            argv.private
        ) : new ChatClient(new SocketioSocketClientSide(url), argv.nick!, argv.CLI);
}
// eslint-disable-next-line no-unused-vars
let chatServer = argv.server ? new ChatServer(new SocketioHttpServer(port), argv.ext_adress, argv.this_ext_port, argv.this_ext_adress) : null;

