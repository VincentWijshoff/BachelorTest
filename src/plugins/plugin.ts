/* eslint-disable no-unused-vars */
import * as debugModule from 'debug';
const debug = debugModule('chat:plugin');
import * as allPlugins from './pluginsConfig.json';
import ChatClient,{ printError, printSuccess } from '../app/client';

type pluginImplementation = {
    sendMessage:Function,
    receiveMessage:Function, 
    onPluginsLoaded:Function, 
    examples:Array<Array<string>>, 
    options:Array<[string, any]>, 
    checks:Array<any>, 
    createBot:Function
};


let activeChatBots:Array <pluginImplementation> = [];       // the active chat bot plugin
let activeEncryption:Array <pluginImplementation> = [];     // the active encryption plugins
let activeTextEdit:Array <pluginImplementation> = [];       // the active text edit plugins
type js = {name:string, type:string, active:string};
/**
 * this will load all plugins from the pluginsConfig.json file with the correct configuration for each plugin
 */
function addPlugins():void{
    /**
     * Load all active plugins
     */
        
    for (const plug1 in allPlugins) { 
        let plug2 = plug1 as unknown;
        let plugin = plug2 as js;
        if(plugin.active == 'true'){
            let name = plugin.name;
            let type = plugin.type;
            let loadedPlugin:pluginImplementation = require(`./${name}/index`).default;
            switch(type){
            case('chat-bot'):  //all chat-bots that extend a client will be stored here
                activeChatBots.push(loadedPlugin);
                break;
            case('encryption'): //all encryption plugins that will encrypt and decrypt data will be sotred here
                activeEncryption.push(loadedPlugin);
                break;
            case('text-edit'):  //all text edit plugins that edit teext on send or receive will be stored here
                activeTextEdit.push(loadedPlugin);
                break;
            default:
                debug(`${type} not recognised`);
                break;
            }
        }
    } 
    debug('the plugins where initiated');
}

/**
 * This function will start a chatbot when the user asks for this via the cli.
 * 
 * @param args   The arguments that the user gives via the cli to start the cahtbot.
 *                  
 * @param client    The chatclient that starts the chatbot
 */
function startChatbot(args:{action:string, name:string, prompt:string, channelName?:string}, client: ChatClient, url:string){
    let found = false;
    let name = args.name;
    for (const plug1 in allPlugins) { 
        let plug2 = plug1 as unknown;
        let plug = plug2 as js;
        if(plug.name == name && plug.type == 'chat-bot' && isActivated(plug.name, client)){
            //chatbots run now client-side, no message with a command will be send anymore to activate this plugin
            //now the chatbot is implemented as a new client with no CLI, and can receive messages. If the message
            //is ment for the bot, it will do the correct action.
            found = true;
            let loadedPlugin:pluginImplementation = require(`./${args.name}/index`).default;
            loadedPlugin.createBot(args.prompt, url, args.channelName);  
            return;
        }
    }
    if(!found){
        printError('chatbot not active or named incorrectly');
    }else{
        printSuccess('chatbot was started');
    }
}

function isActivated(name:string, client: ChatClient){
    let found = false;
    return found;
}


/** 
 *  This function will carry out the action that is asked by the client on a specific plugin.
 *
 *  Therefore we split the string that is provided by the client into different parts that we call options.
 *
 *   @param msg        The string that the client gives via the cli that has te needed information to provoke an action on the plugin
 *                     Therefore we split the string that is provided by the client into different parts that we call options.
 *                     msg.action will be the action that the client wants to do with the plugin (e.g. start, activate or deactivate the plugin)
 *                         if this options is start, then we know that the user wants to start a Chatbot, for further documentation look at startChatbot.
 *                     If msg.action is not start, than the plugin won't be a chatbot 
 *                     msg.name will than be the name of the plugin that the client wants to provoke the action on.
 *                     msg.prompt will be the prompt, which will make the bot do his job (when chatbot receives message <prompt> message)
 *  
 *   @param client     The chatclient that wants to provoke an action on the plugin
 * 
 */    
function pluginAction(msg:{action:string, name:string, prompt:string, channelName?:string}, client: ChatClient){
    if(client == undefined){
        printError('undefined client from cli');
    }
    let action = msg.action;
    let pluginName = msg.name;
    switch(action){
    case('start'):
        startChatbot(msg, client, client.socket!.getServerURL());//We want the bot to connect to the same url as the client who started it
        break;
    case('activate'):
        debug('activated plugin for this client');
        break;
    case('deactivate'):
        debug('deactivated plugin for this client');
        break;
    default:
        printError('no valid action given');
    }
}

/**
 * export these modules
 */
export {addPlugins, pluginAction,
    activeChatBots,activeEncryption, activeTextEdit};