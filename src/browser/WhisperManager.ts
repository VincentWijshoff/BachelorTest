/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/// <reference lib="dom" />

import { ChatClient } from '../app';
import { log } from './key_handler';

/**
 * Class containing all functionality related to the 'whisper' command
 */
export class WhisperManager {

    client: ChatClient;
    /**
     * The range of whisper messages expressed in 'blocks',
     * possible values in [1,20] (the rooms are 20x30)
     */
    range: number;
    /**
     * It's possible to exclude some clients from receiving whisper messages.
     * This array contains hashes or nicks of clients that are excluded.
     */
    ostracized: string[];

    static DEFAULT_RANGE = 10;


    constructor(client: ChatClient) {
        this.client = client;
        this.range = WhisperManager.DEFAULT_RANGE;
        this.ostracized = [];
    }

    handleMessage(msg: string) {
        if (msg.startsWith('/range')) {
            this.handleRange(msg);
        }
        else if (msg == '/show') {
            this.handleShow();
        }
        else if (msg == '/reset') {
            this.handleReset();
        }
        else if (msg.startsWith('/ostracize')) {
            this.handleOstracize(msg);
        }
        else if (msg.startsWith('/')) {
            log('[FAILED]: Please enter valid input. Type help for suggestions.');
        }
        else {
            this.handleWhisper(msg);
        }
    }

    /**
     * Handler of the /range command: configure range of whisper
     */
    handleRange(msg: string) {
        const args = msg.split(' ');
        const r = parseInt(args[args.length - 1], 10);
        if (!(r > 0 && r < 21)) {
            log('[FAILED]: Please enter a valid range in [1, 20].');
            return;
        }
        this.range = r;
        log('[SUCCESS]: Whisper range updated to ' + r.toString());
    }

    /**
     * Show all recipients of a whisper message.
     */
    handleShow() {
        log('[SUCCESS]: Printing clients:');
        for (let hashnick of this.client.clientPositions.keys()) {
            if (!this.isOstracized(hashnick)
                && this.getDistance(hashnick) <= this.range
                && hashnick != this.client.hash_nick) {
                log(hashnick);
            }
        }
    }

    /**
     * Return the distance between this.client and the client with the given hashnick
     */
    getDistance(hashnick: string): number {
        const pos = this.client.clientPositions.get(hashnick);
        const my_pos = this.client.clientPositions.get(this.client.hash_nick);
        return Math.abs(pos!.x - my_pos!.y) + Math.abs(pos!.y - my_pos!.y);
    }

    /**
     * Check if a given hashnick corresponds with an element of the ostracized array
     */
    isOstracized(hashnick: string) {
        const hash = hashnick.split(':')[0];
        const nick = hashnick.split(':')[1];
        for (let i = 0; i < this.ostracized.length; i = i+1) {
            if (this.ostracized[i] == hash || this.ostracized[i] == nick) {
                return true;
            }
        }
        return false;
    }

    /**
     * Reset to default settings.
     * The range is reset and the list of ostracized clients is cleared.
     */
    handleReset() {
        this.range = WhisperManager.DEFAULT_RANGE;
        this.ostracized = [];
        log('[SUCCESS]: reset to default configuration');
    }

    /**
     * Add a given client to the list of ostracized clients
     */
    handleOstracize(msg: string) {
        const args = msg.split(' ');
        const input = args[args.length - 1]; // Hash or nick of a client
        this.ostracized.push(input);
        log('[SUCCESS]: client ostracized');
    }

    /**
     * If a whisper message is entered, this message is sent to clients that are
     *  - within the current range
     *  - have not been ostracized
     */
    handleWhisper(msg: string) {
        for (let hashnick of this.client.clientPositions.keys()) {
            if (!this.isOstracized(hashnick)
                && this.getDistance(hashnick) <= this.range
                && hashnick != this.client.hash_nick) {
                this.client.send('ChatMessage', {text: msg}, {to: hashnick, hash_nick: this.client.hash_nick});
            }
        }
        log('[SUCCESS]: Whisper message sent. Message:<br>' + msg);
    }

}