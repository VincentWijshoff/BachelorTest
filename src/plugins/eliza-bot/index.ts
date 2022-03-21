/**
 * Original Eliza bot list of responses and some utility functions where taken from/inspired by this project:
 * https://github.com/keithweaver/eliza/blob/gh-pages/js/eliza.js
 */

/**
 * Module dependencies.
 */
import ChatClient from '../../app/client';
import * as debugModule from 'debug';
import { isMsg, Msg, elizaResponses } from '../../comm/proto3';
import { SocketioSocketClientSide } from '../../comm/impl/socketio';
const debug = debugModule('chat:client');
// eslint-disable-next-line no-redeclare
let elizaResponses: any;


/**
 * returns random time interval between 1000 and 3500 milliseconds
 */
function chooseRandomInterval():number{
    return Math.floor(Math.random()*2500)+1000;
}

/**
  * chooses a random item from an array
  * 
  * @param {array} items        an array of items where the item will be picked from
  */
function chooseRandom(items: Array <string>) {
    return items[Math.floor(Math.random() * items.length)];
}

/**
 * removes punctuation characters from a string
 * 
 * @param {string} message      the input message that will be modified
 */
function removePunctuation(message: string):string {
    message = message.replace(',', '');
    message = message.replace(';', '');
    message = message.replace('.', '');
    message = message.replace('?', '');
    message = message.replace('!', '');
    message = message.replace(':', '');

    return message;
}

/**
 * performs a series of small grammatical changes to transform common verbs in subjects in a sentence
 * (you -> me, mine -> yours, ...)
 * 
 * @param {string} input        the input string that will be modified
 */
function replaceWords(input: string): string {
    let wordsForReplacement: any = elizaResponses.wordsForReplacement;
    const inputSplit = input.split(' ');

    let newSplit = [];
    for (let i = 0;i < inputSplit.length;i++){
        let currentInputWord = inputSplit[i];
        if (currentInputWord in wordsForReplacement){
            let replacementWord:string = wordsForReplacement[currentInputWord];
            newSplit[i] = replacementWord;
        } else {
            newSplit[i] = currentInputWord;
        }
    }
    
    let updatedMessage = '';
    for (let i = 0;i < newSplit.length;i++){
        let word = newSplit[i];
        if (updatedMessage != ''){
            updatedMessage += ' ';
        }
        updatedMessage += word;
    }

    return updatedMessage;
}


/**
 * BotClient class.
 */
class BotClient extends ChatClient {
    prompt: string; //this is the command this bot will listens for
    channel?: string; //this is the channel that the bot will join
    chatBot: boolean;

    /**
     * @param {String} server_url   the server URL including protocol, host, port and namespace to connect to
     *                              e.g.: https://crzy.server.net:8889/admin-ns/
     * @param {String} nick         nick name to use in chat
     * 
     * @param {String} prompt       the prompt this bot will listen for. If an incoming message starts with this prompt, the bot will interpret it as a message.
     *                              (messages that don't start with this prompt will be ignored!)
     * @param {String} channel      the channel on which the BotClient wil listen to and send messages
     */
    constructor(server_url: string, nick: string, prompt: string, channel?: string) {
        super(new SocketioSocketClientSide(server_url), nick, false);
        this.prompt = prompt;
        debug('channelName is ', channel=='');
        if(channel == '') //no channelname given -> in all chat
            this.channel = undefined;
        else
            this.channel = '#'+channel;
        this.chatBot = true;
        // eslint-disable-next-line no-import-assign
        elizaResponses = require('./../../../eliza-default-responses.json');
        debug(`Constructed new BotClient "${nick}" on ${server_url}`);
    }

    /**
     * this method will be called when the bot connects to the server
     */
    onConnect():void{
        super.onConnect();
        debug(`${this.nick} has connected to the server`);
        if(this.channel != undefined){
            setTimeout(() => {
                this.send('ChannelJoin', {channel:this.channel!});
                this.send('ChatMessage', {text:`Hello, my name is ${this.nick}. Start your sentence with "${this.prompt}" to adress me.`}, {to: this.channel, hash_nick:this.hash_nick});
            }, 1000);
        }else{
            setTimeout(() => {
                this.send('ChatMessage', {text:`Hello, my name is ${this.nick}. Start your sentence with "${this.prompt}" to adress me.`}, {hash_nick:this.hash_nick});
            }, 1000);

        }
        this.setTimedResponse();
    }

    /**
     * This method will be called when a message is received by the client
     * @param {string} msg  the message that is received by the cient
     */
    onMessage(msg: Msg):Msg {
        if (isMsg('promptVerification', msg)) {
            this.onPromptVerification(msg);
        }
        if(isMsg('ChatMessage', msg)){
            if (msg.payload.text
                && msg.payload.text.startsWith(this.prompt)
                && msg.from != this.nick) {
                debug(`A message was received by the Eliza bot from ${msg.from}`);
                setTimeout(() => {
                    if(msg.to){
                        this.send('ChatMessage', {text:this.calculateResponse(msg.payload.text.substring(this.prompt.length +1))}, {hash_nick: this.hash_nick, to:this.channel!});
                    }else{
                        this.send('ChatMessage', {text:this.calculateResponse(msg.payload.text.substring(this.prompt.length +1))}, {hash_nick: this.hash_nick});
                    }
                    if (elizaResponses.endChatTerms.includes(msg.payload.text.substring(this.prompt.length +1))){
                        this.disconnect();
                    }
                }, chooseRandomInterval());
            }
        }
        return msg;
    }

    /**
     * parameters to control the promisses for when the bot should start conversation
     */
    currentPromise: unknown;
    resolveCurrentPromise: unknown;
    convoStartTime = 30_000; // time to start or continue a conversation
    /**
     * sets a new promise after every received message and on creation so the bot will (re)start the conversation after a certain amount of time
     */
    setTimedResponse(): void{
        if(this.currentPromise){
            this.resolveCurrentPromise;
        }
        this.currentPromise = this.getPromise()
            .then(() => debug('the convo was started'))
            .catch((err) => {debug('the convo was not started', err);
                this.send('ChatMessage', {text: chooseRandom(elizaResponses.initialMessages)}, {hash_nick:this.hash_nick, to:this.channel});
            });
        debug(`a promise was set to start a conversation after ${this.convoStartTime} milliseconds`);
    }
    /**
     * returns the new promise
     */
    getPromise(){
        return new Promise((resolve, reject) => {
            this.resolveCurrentPromise = resolve;
            setTimeout(() => { reject(new Error); }, this.convoStartTime);
        }); 
    }
    /**
     * calculates the response from the text that was received
     * @param {string} text     the string where the response is based off off
     */
    calculateResponse(text: string) :string{
        text = text.toLowerCase();
        text = removePunctuation(text);
        if (elizaResponses.endChatTerms.includes(text)) {
            return 'Goodbye.';
        }

        // eslint-disable-next-line no-unused-vars
        const wordsInText = text.split(' ');
        let bestKey = 'NOTFOUND';
        let bestKeyword:elizaResponses = elizaResponses.responses.NOTFOUND;
        Object.keys(elizaResponses.responses).forEach((key) => {
            // eslint-disable-next-line no-unused-vars
            const keyWords = key.split(' ');
            if (text.includes(key) && elizaResponses.responses[key].weight > bestKeyword.weight) {
                bestKeyword = elizaResponses.responses[key];
                bestKey = key;
            }
        });
        const chosenResponse: string = chooseRandom(bestKeyword.responses);

        if (chosenResponse.indexOf('*') == -1) {
            return chosenResponse;
        } else {
            const remainingInput = text.substring(text.indexOf(bestKey) + bestKey.length + 1, text.length);
            const rightOfWildcardInResponse = chosenResponse.substring(chosenResponse.indexOf('*') + 1);
            const startOfResponseToWildcard = chosenResponse.substring(0, chosenResponse.indexOf('*'));
            const startOfInputMinusOneCharacter = remainingInput.substring(0, remainingInput.length - 1);
            const remainingOfInputOnRight = remainingInput.substring(remainingInput.length - 1, remainingInput.length).replace('[^A-Za-z]', '');

            return startOfResponseToWildcard + replaceWords(startOfInputMinusOneCharacter + remainingOfInputOnRight) + rightOfWildcardInResponse;
        }
    }

    static createBot(prompt:string, url:string, channel?:string){
        // eslint-disable-next-line no-unused-vars
        let elizaClient = new BotClient(url, 'Eliza', prompt, channel);
    }
}



/**
 * Module exports.
 */
export default BotClient;
