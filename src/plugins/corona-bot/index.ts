import ChatClient from '../../app/client';
import * as debugModule from 'debug';
const debug = debugModule('chat:client');
import * as https from 'https';
import { assert } from 'console';
import { isMsg, Msg } from '../../comm/proto3';
import { SocketioSocketClientSide } from '../../comm/impl/socketio';

/*
*A client can start this corona-bot in a channel by using following commands in CLI
* /plugin activate --pluginName=corona-bot
* /plugin start --pluginName=corona-bot --prompt=<prompt> --channelName=<channelName>
* then: /send-channel <prompt>[space]<country_name> --channelName=<channelName>
* e.g. /send-channel corona belgium --channelName=<channelName>
*/

/**
 * This class implements a bot that fetches the Corona numbers from the internet for a specific country given by the users who adresses the bot.
 */
class CoronaBot extends ChatClient{

    prompt;//string, this is the command this bot will listens for
    nick; //this is the nickname that is given to the CoronaBot
    channel; //string, this is the channel that the bot will join
    chatBot:boolean;

    /**
     * 
     * @param {string} server_url   the server URL including protocol, host, port and namespace to connect to
     *                              e.g.: https://crzy.server.net:8889/admin-ns/
     * @param {string} nick         nick name to use in chat
     * 
     * @param {string} prompt       the prompt this bot will listen for. If an incoming message starts with this prompt, the bot will interpret it as a message.
     *                              (messages that don't start with this prompt will be ignored!)
     */
    constructor(server_url: string, nick: string, prompt: string, channel?: string){
        super(new SocketioSocketClientSide(server_url), nick, false);
        this.nick = nick;
        this.prompt = prompt.toLowerCase();
        if(channel == '')
            this.channel = undefined;
        else
            this.channel='#'+channel;
        this.chatBot=true;
        debug('CoronaBot created');
    }

    /**
     * This function starts whenever the Coronabot is connected to the server. 
     * It then sends the instructions to the client on which way the client can ask the bot for the coronanumbers
     */
    onConnect() :void{
        super.onConnect();
        debug('coronaBot has connected to the server');
        if(this.channel != undefined){
            //bot is assigned to a channel
            setTimeout(() => {
                this.send('ChannelJoin', {channel:this.channel!});
            }, 1000);
            setTimeout(() => {
                this.send('ChatMessage', {text:`Hello, i am the corona Bot. If u send ${this.prompt} {country}, i will give you the latest data!`}, {hash_nick:this.hash_nick, to: this.channel});
            }, 2000);
        }else{
            //bot is assigned to all chat
            setTimeout(() => {
                this.send('ChatMessage', {text:`Hello, i am the corona Bot. If u send ${this.prompt} {country}, i will give you the latest data!`});
            }, 1000);
        }
    }

    /**
     * This function engages action whenever a message is received.
     * 
     * @param {string} msg  The message that is given by the client
     */
    onMessage(msg: Msg): Msg{
        if (isMsg('promptVerification', msg)) {
            this.onPromptVerification(msg);
        }
        if(isMsg('ChatMessage', msg)){
            if(msg.payload.text && msg.from != this.nick && this.hasCoronaCommand(msg.payload.text.toString())){
                debug('corona bot got a message');
                this.getCoronaNumbers(msg.payload.text, msg.command);
            }
        }
        return msg;
    }

    /**
     * Checks if the message includes the specific CoronaCommand.
     * Returns true if the message contains the CoronaCommand, otherwise it returns false.
     * 
     * @param {String} text The sentence in which the CoronaCommand will be looked for.
     */
    hasCoronaCommand(text: string):boolean
    {
        text = text.toLowerCase();
        if(text.indexOf(this.prompt)==0){
            return true;
        }
        return false;
    }

    /**
     * This function will check for which country the users wants to know the Corona numbers and fetches these from the internet.
     * First it makes sure that all the given data from the client is in the correct form to fit in the url together with the specific dates that are needed to fetch the data.
     * It then writes the information into a JSON file and reads the data from this file into the message that is sent to the server.
     * 
     * @param {String} text The message that give us the information for which country the user wants the Corona numbers.
     */
    getCoronaNumbers(text: string, comm:string):void{
        text = text.substring(this.prompt.length + 1); //gives back the text without "prompt" and the space after that
        if(text.indexOf(' ') !== -1){ // this means there is a word behind the country
            text = text.substr(0, text.indexOf(' '));
        }
        if(text == 'bye' || text == 'exit'){
            assert(comm == 'ChatMessage');
            if(comm == 'send-channel'){
                this.send('ChatMessage', {text:'Closing bot'}, {to:this.channel, hash_nick:this.hash_nick});
            }else if(comm == 'shout-to-all' ){
                this.send('ChatMessage', {text: 'Closing bot'});
            }
            this.disconnect();                
        }
        let country = text;
        let date = new Date();
        let year = date.getFullYear();
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let day = String(date.getDate()).padStart(2, '0');
        let yesterday = String(date.getDate()-2).padStart(2, '0');
        let yestermonth = String(date.getMonth() + 1).padStart(2, '0');
        let yesteryear = date.getFullYear();
        if(yesterday == '00'){
            yesterday = '30';
            yestermonth = String(date.getMonth()).padStart(2, '0');
        }
        let url = `https://api.covid19api.com/country/${country}/status/confirmed/live?from=${yesteryear}-${yestermonth}-${yesterday}T00:00:00Z&to=${year}-${month}-${day}T00:00:00Z`;
        https.get(url,(res) => {
            let body = '';
        
            res.on('data', (chunk) => {
                body += chunk;
            });
        
            res.on('end', () => {
                try {
                    debug('body= ', body);
                    let json = JSON.parse(body);
                    // eslint-disable-next-line no-unused-vars
                    let result = json[0].Cases;
                    
                } catch (error) {
                    debug('an error occured with the corona-bot');
                }
            });
        
        }).on('error', (error) => {
            debug('an error occured with the corona-bot', error);
        });
    }

    static createBot(prompt:string, url:string, channel?: string){
        // eslint-disable-next-line no-unused-vars
        let coronaClient = new CoronaBot(url, 'CoronaBot', prompt, channel);
    }
}

/**
 * Module exports.
 */
export default CoronaBot;