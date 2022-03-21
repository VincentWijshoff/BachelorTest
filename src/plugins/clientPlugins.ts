/* eslint-disable no-unused-vars */

import * as debugModule from 'debug';
const debug = debugModule('chat:plugin');
import * as allPlugins from './pluginsConfig.json';
import ChatClient, { printError, printSuccess } from '../app/client';
import { isMsg, Msg, Payloads, pluginImplementation } from '../comm/proto3';

type js = {name:string, type:string, active:string};

/**
 * This class is the specific individual plugin class per client.
 * 
 * It keeps information about which plugins are active on the specific client that is the attribute of this class.
 * It can also activate or deactivate certain plugins for this specific client.
 */
class ClientPlugins{
    client;     // The client of whom the specific plugin information is stored.
    activePlugins: Map<string, pluginImplementation>[]; // The plugins that are active for this client

    /**
     * 
     * @param {client} client    The client in which the plugins are active.
     */
    constructor(client: ChatClient){
        this.client = client;
        this.activePlugins = [];
        debug('created client specific plugin class');
    }

    //switches the position of the given pluginsNumbers
    changeOrderPlugins(firstPlugin: number, secondPlugin: number){
        //since plugin1 is the first plugin, the index has to be decreased with one
        let plugin1 = this.activePlugins[firstPlugin-1];
        let plugin2 = this.activePlugins[secondPlugin-1];
        this.activePlugins[firstPlugin-1] = plugin2;
        this.activePlugins[secondPlugin-1] = plugin1;
        debug('activeplugins is now: ', this.activePlugins);
    }

    /**
     * This function controlls the order of the plugins that edit the client's message.
     * It will be called when a client sends a message to the server, 
     * the non-chat-bot plugins should have the function sendMessage if they want to interfere here.
     * 
     * @param {ClientMessage} args  The message that the client wants to send to the server but needs to be processed by the plugins first.
     */
    sendMessagePluginClient(args:Msg){
        if(isMsg('ChatMessage', args)){
            
            for(let i=0; i<this.activePlugins.length; i++){
                let map = this.activePlugins[i];
                if(map.has('rot-13'))
                    args=map.get('rot-13')!.sendMessage(args);
            }
            
            debug(`${args} was processed in plugin send client class`);
        }
        return args;
    }
    
    /**
     * This function controlls the order of the plugins that edit the server's message.
     * It will be called when the client receives a message from the server 
     * This is because we can control the order of the plugins called (reversed from the sendMessagePlugin order)
     * the non-chat-bot plugins should have the function receiveMessage if they want to interfere here.
     * 
     * @param {ClientMessage} args  The message that the client received from the server but needs to be processed by the plugins first.
     */
    receiveMessagePluginClient<C extends keyof Payloads>(args:Msg<C>):Msg<C>{
        
        for(let i=this.activePlugins.length-1; i>=0; i--){
            let map = this.activePlugins[i];
            if(map.has('rot-13'))
                args=map.get('rot-13')!.receiveMessage(args);
        }
        return args;
    }

    /**
     * This will activate the plugin, if already active it will do nothing.
     * There is no error checking so if the name of the plugin does not exist, an error can be thrown
     * 
     * @param {string} plugin   The name of the folder the plugin is in
     */
    activatePlugin(plugin: string) {
        let found = false;
        for (const plug1 in allPlugins) { 
            let plug2 = plug1 as unknown;
            let plug = plug2 as js;
            if (plug.name == plugin) {
                let name = plug.name;
                let type = plug.type;
                let loadedPlugin: pluginImplementation = require(`./${name}/index`).default;
                switch (type) {
                case ('chat-bot'): //all chat-bots that extend a client will be handled here
                    if (!this.isActivated(loadedPlugin)){
                        let map = new Map;
                        map.set(name, loadedPlugin);
                        this.activePlugins.push(map);
                        printSuccess('activated chatbot succesfull');
                    } else 
                        printError('already active plugin');
                    
                    found = true;
                    return;
                case ('encryption'): //all encryption plugins that will encrypt and decrypt data will be handled here
                    if (!this.isActivated(loadedPlugin)){
                        let map = new Map;
                        map.set(name, loadedPlugin);
                        this.activePlugins.push(map);                        
                        printSuccess('encryption plugin succesfully activated');
                        if ('onPluginsLoaded' in loadedPlugin)
                            loadedPlugin.onPluginsLoaded();
                    } else
                        printError('already active plugin');
                    found = true;
                    return;
                case ('text-edit'): //all text edit plugins that edit text on send or receive will be handled here
                    if (!this.isActivated(loadedPlugin)) {
                        let map = new Map;
                        map.set(name, loadedPlugin);
                        this.activePlugins.push(map);                        
                        printSuccess('text-edit plugin successfully activated');
                        if ('onPluginsLoaded' in loadedPlugin) 
                            loadedPlugin.onPluginsLoaded();                   
                    } else 
                        printError('already active plugin');
                    found = true;
                    return;
                default:
                    printError(`${type} not recognised`);
                    break;
                }
            }
        }
        if (!found) 
            printError('the plugin was not found');
    }

    isActivated(plugin:pluginImplementation){        
        for(let i=0; i<this.activePlugins.length; i++){
            if(this.pluginInMap(this.activePlugins[i], plugin))
                return true;
        }
        return false;
    }

    pluginInMap(elem:Map<string, pluginImplementation>, plugin:pluginImplementation):boolean{
        elem.forEach(x => {
            if(x == plugin)
                return true;
        });
        return false;
    }

    /**
    * This will deactivate the plugin, if already inactive it will do nothing.
    * There is no error checking so if the name of the plugin does not exist, an error can be thrown
    * 
     * @param {string} plugin   The name of the folder the plugin is in
    */
    // eslint-disable-next-line no-unused-vars
    deactivatePlugin(plugin: string, client?: string){
        let found = false;
        
        if(!found)
            printError('the plugin was not found');
    }

    /**
     * removes the specified elemment from the list
     */
    removeElem(loadedPlugin:pluginImplementation, pluginList:Array <pluginImplementation>):void{
        const i = pluginList.indexOf(loadedPlugin);
        pluginList.splice(i);
        return;
    }
   
}

/**
 * export these modules
 */
export default ClientPlugins;