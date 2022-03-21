/* eslint-disable no-unused-vars */
import { ChatClient } from '../app/client';

import * as debugModule from 'debug';
import { Msg } from '../comm/proto3';
const debug = debugModule('chat:commandmanager:client');

export class ClientCommandManagerIn {

    chatClient: ChatClient;
    cmds = new Map<
        string,
        {
            fn: (args: Msg) => void;
            help: string;
            autocompletePlaceholders: string;
        }
    >();

    constructor(chatClient: ChatClient) {
        this.chatClient = chatClient;
    }

    registerCommand(
        command: string,
        fn: (args: Msg) => void,
        help: string = '',
        autocompletePlaceholders: string = ''
    ) {
        if(this.cmds.has(command)) {
            // FAIL hard in this case
            throw new Error(`Trying to register command ${command} in client, ` +
                            'but this already exists, please check configuration');
        }
        this.cmds.set(command, {
            fn: fn,
            help: help,
            autocompletePlaceholders: autocompletePlaceholders
        });
    }

    execute(command: string, args: Msg) {
        const cmd = this.cmds.get(command);
        if(cmd) cmd.fn(args);
        else debug(`Unknown command ${command}`);
    }

}

export class ClientCommandManagerOut {

    chatClient: ChatClient;
    cmds = new Map<
        string,
        {
            fn: (args: any) => void;
            help: string;
            autocompletePlaceholders: string;
        }
    >();

    constructor(chatClient: ChatClient) {
        this.chatClient = chatClient;
    }

    registerCommand(
        command: string,
        fn: (args: any) => void,
        help: string = '',
        autocompletePlaceholders: string = ''
    ) {
        if(this.cmds.has(command)) {
            // FAIL hard in this case
            throw new Error(`Trying to register command ${command} in client, ` +
                            'but this already exists, please check configuration');
        }
        this.cmds.set(command, {
            fn: fn,
            help: help,
            autocompletePlaceholders: autocompletePlaceholders
        });
    }

    execute(command: string, args: any) {
        const cmd = this.cmds.get(command);
        if(cmd) cmd.fn(args);
    }

}
