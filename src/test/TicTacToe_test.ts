

import { ChatClient, ChatServer } from '../app';
import { TicTacToeManager } from '../browser/games/TicTacToeManager';
import { SocketioHttpServer, SocketioSocketClientSide } from '../comm/impl/socketio';
import { Msg } from '../comm/proto3';


function assert(cond: boolean, ...args: unknown[]) {
    if (!cond) {
        console.error(...args);
        throw 'Error encountered';
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Back-end test of a client joining the available clients for a tic-tac-toe game
 */
const client_joins = async () => {
    const SERVER = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    const MANAGER = SERVER.managerTicTacToe;
    let CLIENT: ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick1', true);

    const msg: Msg<'TicTacToeMsg'> = {timestamp: 'now', hash_nick: CLIENT.hash_nick, command: 'TicTacToeMsg',
        payload: {type: 'join', from: CLIENT.hash_nick}};
    MANAGER.handleMessage(msg);
    assert(MANAGER.pool.includes(CLIENT.hash_nick), 'Client has not joined!');

    SERVER.server.close();
    CLIENT.socket?.close();
};

/**
 * Back-end test of a client leaving the available clients for a tic-tac-toe game
 */
const client_leaves = async () => {
    const SERVER = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    const MANAGER = SERVER.managerTicTacToe;
    let CLIENT: ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick2', true);

    CLIENT.send('TicTacToeMsg', {type: 'join', from: CLIENT.hash_nick});
    CLIENT.send('TicTacToeMsg', {type: 'leave', from: CLIENT.hash_nick});
    await sleep(100);
    assert(!MANAGER.pool.includes(CLIENT.hash_nick), 'Client has not left!');

    SERVER.server.close();
    CLIENT.socket?.close();
};


/**
 * Helper function for tests: inviteAndAccept & leavingActiveGame
 */
function sendInviteAndAccept(MANAGER: TicTacToeManager, CLIENT1: ChatClient, CLIENT2: ChatClient) {
    const msg: Msg<'TicTacToeMsg'> = {timestamp: 'now', hash_nick: CLIENT1.hash_nick, command: 'TicTacToeMsg',
        payload: {type: 'join', from: CLIENT1.hash_nick, to: CLIENT2.hash_nick}};
    MANAGER.handleMessage(msg);
    const msg2: Msg<'TicTacToeMsg'> = {timestamp: 'now', hash_nick: CLIENT2.hash_nick, command: 'TicTacToeMsg',
        payload: {type: 'join', from: CLIENT2.hash_nick, to: CLIENT1.hash_nick}};
    MANAGER.handleMessage(msg2);
}

/**
 * Test if the server correctly adds duos of clients who are in game
 */
const inviteAndAccept = async () => {
    const SERVER = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    const MANAGER = SERVER.managerTicTacToe;
    let CLIENT1: ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick1', true);
    let CLIENT2: ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick2', true);

    sendInviteAndAccept(MANAGER, CLIENT1, CLIENT2);

    for (let i = 0; i < MANAGER.clientsInGame.length; i = i+1) {
        if (MANAGER.clientsInGame[i].includes(CLIENT1.hash_nick)) {
            assert(MANAGER.clientsInGame[i].includes(CLIENT2.hash_nick), 'Clients are not in game!');
            break;
        }
    }

    SERVER.server.close();
    CLIENT1.socket?.close();
    CLIENT2.socket?.close();
};

const leavingActiveGame = async () => {
    const SERVER = new ChatServer(new SocketioHttpServer(3000), undefined, 3000, undefined);
    const MANAGER = SERVER.managerTicTacToe;
    let CLIENT1: ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick1', true);
    let CLIENT2: ChatClient = new ChatClient(new SocketioSocketClientSide('http://localhost:3000'), 'nick2', true);

    sendInviteAndAccept(MANAGER, CLIENT1, CLIENT2);

    const msg: Msg<'TicTacToeMsg'> = {timestamp: 'now', hash_nick: CLIENT1.hash_nick, command: 'TicTacToeMsg',
        payload: {type: 'leave', from: CLIENT1.hash_nick, to: CLIENT2.hash_nick}};
    MANAGER.handleMessage(msg);

    assert(MANAGER.clientsInGame.length == 0, 'Clients have not been removed from in-game clients!');

    SERVER.server.close();
    CLIENT1.socket?.close();
    CLIENT2.socket?.close();
};


const main_tictactoe_test = async () => {

    const tests: (() => Promise<void>)[] = [
        client_joins,
        client_leaves,
        inviteAndAccept,
        leavingActiveGame
    ];


    let nbFailed = 0;

    for (let i = 0; i < tests.length; i++) {
        try {
            await tests[i]();
        } catch (error) {
            console.error(error);
            nbFailed += 1;
        }
    }

    return [nbFailed, tests.length];
};

export default main_tictactoe_test;