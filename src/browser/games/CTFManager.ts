import { ChatServer } from '../../app';
import Channel from '../../channel';
import { CTFMsg, Msg } from '../../comm/proto3';




/**
 * Server implemenation of CTF game for 1 world.
 * The server makes sure this class receives all messages from the right world.
 * 
 * Messages:
 *  Client -> Server
 *  - requestGame:  a client requests to initiate a CTF game
 * 
 *  Server -> Client
 *  - startGame:    the server initiates a game
 *  - info:         an info message is shared
 *  - newRound:     a new round is started (flag position is shared)
 *  - stopGame:     the server ends the game
 */
export class CTFManager {

    server: ChatServer;
    channel: Channel; // The channel of this world
    world: string;
    world_structure: any; // the world topology, 20x30
    flag_pos: {row: number, column: number};
    running: boolean; // True iff a game is currently active
    round: number; // A counter for which round is currently played
    winners: string[]; // A list of hashnicks with the winners (so far)
    participants: string[] // A list of hashnicks with all active participants

    static NUMBER_OF_ROUNDS = 3;

    constructor(server: ChatServer, world: string) {
        this.server = server;
        this.world = world;
        this.channel = this.server.channels.get('#'+world)!;
        const worlds = require('../../../worlds.json');
        this.world_structure = worlds[world];
        this.flag_pos = {row: 0, column: 0};
        this.running = false;
        this.round = 0;
        this.winners = [];
        this.participants = [];
    }
    
    handleMessage(msg: Msg<'CTFMsg'>) {
        if (msg.payload.type == 'requestGame') {
            if (!this.running) {
                this.startGame();
            }
            else {
                this.server.sendUser(msg.hash_nick, 'CTFMsg', {type: 'error', world: this.world, text: '[CTF] You will have to wait until a current active game ends ...'});
            }
        }
    }

    /**
     * Send the given payload to all clients in this world
     */
    sendWorld(payload: CTFMsg) {
        Array.from(this.channel.users.keys()).forEach(id => {
            this.server.sendUser(id, 'CTFMsg', payload);
        });
    }

    startGame() {
        this.round = 0;
        this.winners = [];
        this.participants = [];
        Array.from(this.channel.users.keys()).forEach(id => {
            this.participants.push(id);
        });
        this.running = true;
        this.sendWorld({type: 'startGame', world: this.world});
        this.sendWorld({type: 'info', world: this.world, text: '[CTF] Starting capture-the-flag game'});
        this.newRound();
    }

    newRound() {
        this.round = this.round + 1;
        this.sendWorld({type: 'info', world: this.world,
            text: '[CTF] Round ' + this.round.toString() + '/' + CTFManager.NUMBER_OF_ROUNDS.toString()});
        this.flag_pos = this.getRandomPosition();
        this.sendWorld({type: 'newRound', world: this.world, pos: this.flag_pos});
    }

    /**
     * Method that's called if a client has moved: check if a client has arrived at the flag
     * @param positions A map with the client positions
     */
    positionUpdate(positions: Map<string, {x:number, y:number, skin: string}>) {
        for (let key of positions.keys()) {
            if (!this.participants.includes(key)) {
                continue;
            }
            const pos = positions.get(key)!;
            if (pos.x == this.flag_pos.column && pos.y == this.flag_pos.row) {
                this.winners.push(key);
                
                this.server.updateScore(key, 'CTF', true); // client who captures a flag gets points

                this.sendWorld({type: 'info', world: this.world, text: '[CTF] ' + key.split(':')[1] + ' captured the flag!'});
                if (this.round < CTFManager.NUMBER_OF_ROUNDS) {
                    this.newRound();
                }
                else {

                    this.sendWorld({type: 'info', world: this.world,
                        text: '[CTF] Game finished, winners:' + this.getOverviewWinners()});
                    this.sendWorld({type: 'stopGame', world: this.world});
                    this.running = false;
                }
                return;
            }
        }
    }

    /**
     * Get a string with an overview of the hashnicks of the winners in this.winners
     */
    getOverviewWinners(): string {
        let res = '';
        for (let i=1; i<this.winners.length+1; i=i+1) {
            res = res + '<br>Round ' + i.toString() + ': ' + this.winners[i-1];
        }
        return res;
    }
    /**
     * Return a random valid position
     */
    getRandomPosition(): {row: number, column: number} {
        let pos = {row: 1+Math.floor(Math.random()*19), column: Math.floor(Math.random()*30)};
        while (!this.isValidPosition(pos)){
            pos = {row: 1+Math.floor(Math.random()*19), column: Math.floor(Math.random()*30)};
        }
        return pos;
    }

    /**
     * Is the given position a regular tile?
     * The arguments must be valid indices starting from 0.
     * Note: there are 20 rows and 30 columns
     */
    isValidPosition(args: {row: number, column: number}) {
        const type = this.world_structure[args.row][args.column];
        return type.startsWith('tile') == true;
    }

    removeParticipant(hashnick: string) {
        this.participants = this.participants.filter((e: string) => {return e != hashnick;});
    }
}