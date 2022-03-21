import { ChatServer } from '../../app';
import { Msg } from '../../comm/proto3';

/**
 * Class managing all messages related to the tic-tac-toe game played between two clients
 * 
 * Supported messages:
 *  - join (a client wants to play)
 *  - leave (a client is no longer interested to play)
 *  - invite (a client invites another client to play)
 *  - accept (a client accepts an invite from another client)
 *  - abort (an invitation is canceled or refused)
 *  - move (a client does a move)
 *  - exit (an existing game is closed)
 */
export class TicTacToeManager {

    /**
     * Array containing the hash:nick's of clients who want to play.
     * All clients in this.pool must be in the 'Searching' state (see TicTacToe.ts).
     * This pool is synchronized with every client that's a member of the pool
     * 
     * The server automatically removes clients if they either sent an invite or received one.
     * If this invite is canceled by the inviting client or refused by the invited client,
     * the 2 clients in question join the pool again. Both clients send a 'join' message if this is the case.
     * 
     * Naturally, clients who close the start screen before entering a game are also removed from the pool.
     * In this case, the leaving client sends a 'leave' message to the server.
     * 
     * Finally, a client is removed from the pool if he disconnects abruptly.
     */
    pool: string[];

    /**
     * An array with elements [A, B] where A and B are the hash:nick's of clients that are currently
     * engaged in an active game.
     * Clients included in this array are always is the 'In game' state (see TicTacToe.ts).
     */
    clientsInGame: string[][]
    server: ChatServer;

    constructor(server: ChatServer) {
        this.server = server;
        this.pool = [];
        this.clientsInGame = [];
    }

    handleMessage(msg: Msg<'TicTacToeMsg'>) {
        const fields = msg.payload;
        if (fields.type == 'join') {
            this.handleJoin(msg);
        }
        else if (fields.type == 'leave') {
            this.handleLeave(msg);
        }
        else if (fields.type == 'invite') {
            this.handleInvite(msg);
        }
        else if (fields.type == 'accept') {
            this.handleAccept(msg);
        }
        else if (fields.type == 'exit') {
            this.handleExit(msg);
        }
        else {
            // abort, rematch and move messages are simply sent to the recipient
            this.server.sendUser(fields.to!, 'TicTacToeMsg', fields);
        }
        
    }

    sendToPool(msg: Msg<'TicTacToeMsg'>) {
        for (let i=0; i < this.pool.length; i=i+1) {
            this.server.sendUser(this.pool[i], 'TicTacToeMsg', msg.payload);
        }
    }

    /**
     * Handle the event of a new client joining the pool of clients that are
     * searching for an opponent.
     */
    handleJoin(msg: Msg<'TicTacToeMsg'>) {
        const fields = msg.payload;

        this.sendToPool(msg); // Notify other clients

        // Send a series of 'join' messages to this client (syncing pool)
        for (let i=0; i < this.pool.length; i=i+1) {
            this.server.sendUser(fields.from, 'TicTacToeMsg', {type: 'join', from: this.pool[i]});
        }

        this.pool.push(fields.from); // Add the sender to the pool
    }


    /**
     * Remove this client from the pool. If this client was in the pool,
     * then send this message to the remaining members of the pool.
     */
    handleLeave(msg: Msg<'TicTacToeMsg'>) {
        const l = this.pool.length;
        this.removeFromPool(msg.payload.from);
        if (this.pool.length < l) {
            this.sendToPool(msg);
        }
    }

    /**
     * If a client disconnects, the following actions need to be taken:
     *  - the hash:nick is removed from this.pool using this.handleLeave
     *  - the hash:nick is also removed from this.clientsInGame (if necessary)
     *  - an exit message is sent to the client this client was playing a game against
     * 
     * @param hash_nick The hash:nick of the client that disconnected
     */
    handleDisconnect(hash_nick: string) {
        const leaveMsg: Msg<'TicTacToeMsg'> = {command: 'TicTacToeMsg', payload: {type: 'leave', from: hash_nick},
            timestamp: (new Date()).toUTCString(), hash_nick: hash_nick};
        this.handleLeave(leaveMsg);
        for (let i = 0; i < this.clientsInGame.length; i = i+1) {
            if (this.clientsInGame[i].includes(hash_nick)) {
                // Send exit message to opponent
                const opponent = (hash_nick == this.clientsInGame[i][0]) ? this.clientsInGame[i][1] : this.clientsInGame[i][0];
                this.server.sendUser(opponent, 'TicTacToeMsg', {type: 'exit', from: hash_nick, to: opponent});
                // Remove these clients from this.clientsInGame
                this.removeFromClientsInGame(hash_nick);
                return;
            }
        }
    }

    /**
     * Handler for an invite message. Actions:
     *  - Notify the recipient about this invite
     *  - Remove these clients from the pool using this.handleLeave
     */
    handleInvite(msg: Msg<'TicTacToeMsg'>) {
        // Send invite to recipient
        this.server.sendUser(msg.payload.to!, 'TicTacToeMsg', msg.payload);

        const leaveMsgFrom: Msg<'TicTacToeMsg'> = {command: 'TicTacToeMsg', payload: {type: 'leave', from: msg.payload.from},
            timestamp: (new Date()).toUTCString(), hash_nick: msg.payload.from};
        this.handleLeave(leaveMsgFrom);
        const leaveMsgTo: Msg<'TicTacToeMsg'> = {command: 'TicTacToeMsg', payload: {type: 'leave', from: msg.payload.to!},
            timestamp: (new Date()).toUTCString(), hash_nick: msg.payload.to!};
        this.handleLeave(leaveMsgTo);
    }

    /**
     * Handler for an accept message. Actions:
     *  - Notify the recipient about this accept
     *  - Add these clients to this.clientsInGame
     */
    handleAccept(msg: Msg<'TicTacToeMsg'>) {
        this.server.sendUser(msg.payload.to!, 'TicTacToeMsg', msg.payload);
        this.clientsInGame.push([msg.payload.from, msg.payload.to!]);
    }


    /**
     * Handler for an exit message. Actions:
     *  - Notify the recipient about this exit
     *  - Remove these clients from this.clientsInGame
     */
    handleExit(msg: Msg<'TicTacToeMsg'>) {
        this.server.sendUser(msg.payload.to!, 'TicTacToeMsg', msg.payload);
        this.removeFromClientsInGame(msg.payload.from);
    }


    /**
     * Remove a given hashnick from this.pool
     */
    removeFromPool(hashnick: string) {
        this.pool = this.pool.filter((e: string) => {return e != hashnick;});
    }

    /**
     * Remove a given hashnick from this.clientsInGame.
     * This client's opponent is of course also removed.
     */
    removeFromClientsInGame(hashnick: string) {
        this.clientsInGame = this.clientsInGame.filter((e: string[]) => {
            return e.includes(hashnick);
        });
    }
}