/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Module dependencies.
 */
import debugModule from 'debug';
const debug = debugModule('chat:cli');
import * as colors from 'ansi-colors';
import CommandComplete from  './autocomplete';
import ChatClient from './app/client';
import { command_args, command_parameter_type } from './comm/proto3';

/**
 * A class of CLI's involving a client, a dictionary collecting all registered
 * commands, a current prompt, a default command and default prompt.
 *
 * @version 1.0
 * @author Team-1-1-29
 */ 
class cli {

	client; // client for which this CLI is running
	registeredCommands: {[index: string]:command_args} = {}; // dictionary collecting all registered commands
	currentPrompt: CommandComplete | undefined; // the prompt running currently on the cli
	defaultCommand: { name: string; } | undefined; // the default command for this CLI, can be undefined 

	// the default prompt to start the CLI with
	defaultPrompt = {
	    name: 'commandPrompt',
	    promptLine: false,
	    commandColor: (str: string) => colors.bold.magenta(str),
	    highlight: (str: string) => colors.yellowBright(str),
	    limit: 10,
	    choices: ['shout-to-all', 'help'],
	    onCancel: () => this.client.socket!.close()
	};

	// the commands that will be registered for the cli
	commands = [
	    {
	        name: 'exit',
	        helpText: 'Exits the program',
	        parameters: [],
	        callback: () => {
	            process.exit();
	        }
	    },

	    {
	        name: 'set-default',
	        helpText: 'Set the default command (used without /). Only works '
				+ 'with commands with default values for named arguments.',
	        parameters: [
	            { name: 'commandName', isMainParameter: true }
	        ],
	        callback: (commandName: string) => {this.setDefaultCommand(commandName);}
	    },

	    {
	        name: 'show-default',
	        helpText: 'Show the default command',
	        parameters: [],
	        callback: () => {
	            this.defaultCommand ?
	                this.printMessage('The default command '
						+ `is ${this.defaultCommand.name}`)
	                : this.printMessage('No default command set');
	        }
	    },

	    {
	        name: 'help',
	        helpText: 'Show this help.' +
				'If command name specified more info will be given.',
	        parameters: [
	            {name: 'commandName', isMainParameter: true, optional: true}
	        ],
	        callback: (commandName: string) => { this.printHelpText(commandName);}
	    },

	    {
	        name: 'plugin',
	        helpText: '\nactivate or deactivate a plugin for this client:\nactivate/deactivate --pluginName=<pluginname>\n' + 
						'start chatbot plugin in a channel:\nstart --pluginName=<pluginname> --prompt=<prompt> --channelName=<channel>',
	        parameters: [
	            {name: 'action', isMainParameter:true, optional:false}, //start, activate, deactivate
	            {name: 'pluginName', optional:false},
	            {name: 'prompt', optional:true},
	            {name: 'channelName', optional:true}
	        ],
	        // eslint-disable-next-line no-unused-vars
	        callback: (action:string, name:string, prompt:string, channelName:string) => 
	        {
	            
	        }
				
	    },

	];

	/**
	 * Initialize this new CLI with the given client, cli commands registered
	 * in the registered commands dictionary, no current prompt yet and no 
	 * default command yet.
	 *
	 * @param  {Object} client
	 *         The client this CLI is running for.
	 * @post   The client of this CLI is equal to the given client.
	 *       | new.client == client
	 * @effect The cli commands are registered.
	 *       | this.registerCommands(cli_commands)
	 */
	constructor(client: ChatClient) {
	    this.client = client;
	    this.registerCommands(this.commands);
	}

	/**
	 * Register the given commands in the registered commands dictionary of
	 * this CLI and update the default prompt for it.
	 * 
	 * @param  {Object} commands 		
	 *		   The commands to be registered.
		* @effect Each command given is registered separately.
		*       | for (let command in commands)
		*       |	 registerCommand(command)
		*/
	registerCommands(commands: any[] | undefined) {
	    if (commands !== undefined) {
	        commands.forEach((command) => {
	            this.registerCommand(command);
	        });
	        this.updateDefaultPrompt();
	    }
	}

	/**
	 * Updates the default prompt to account for newly registered commands.
	 *
	 * @post   The choices of the default prompt now contain all keys of the
	 *         registered commands of this cli.
	 *       | this.defaultPrompt.choices == 
	 *       |   Object.keys(this.registeredCommands)
	 */
	updateDefaultPrompt() {
	    this.defaultPrompt = {
	        name: 'commandPrompt',
	        promptLine: false,
	        commandColor: (str) => colors.bold.magenta(str),
	        highlight: (str) => colors.yellowBright(str),
	        limit: 10,
	        choices: Object.keys(this.registeredCommands),
	        onCancel: () => this.client.socket!.close()
	    };
	}

	/**
	 * Register the given command in the registered commands dictionary of
	 * this CLI. This method does not update the default prompt. For that 
	 * registerCommands should be used.
	 * 
	 * @param  {Object} command 		
	 *		   The command to be added.
		* @post   The given command is registered as one of the registered
		*         commands of this CLI.
		*       | this.registeredCommands[command.name]
		*/
	registerCommand(command: command_args) {
	    // Check if command is properly defined.
	    let result = this.checkCommandDefinition(command);
	    if (result.length > 0)
	        return debug('Cannot register the new command because it is not'
				+ ' valid: ' + result);

	    this.registeredCommands[command.name] = command;
	}

	/**
	 * Start this CLI.
	 *
	 * @effect This CLI starts a prompt.
	 *       | this.startPrompt()
	 */
	start(CLI:boolean) {
	    if(CLI){
	        this.startPrompt();
	    }	
	}

	/**
	 * Start prompt on this CLI.
	 *
	 * @post   The current prompt of this CLI is a new autcompleted prompt
	 *         initialized as the default prompt.
	 *       | this.currentPrompt == new autocomplete(defaultprompt)
	 * @effect The current prompt is ran.
	 *       | this.currentPrompt.run()
	 */
	async startPrompt() {
		
	    this.currentPrompt = await new CommandComplete(this.defaultPrompt);
	    this.currentPrompt.run().then((line: string) => {
	        this.currentPrompt?.onEnter(line);
	        this.handleInput(line);
	        this.startPrompt();	
	    }).catch(console.error);
		
	}

	/**
	 * Handle the given input.
	 *
	 * @param  {Object} input
	 *         The input to be handled.
	 * @effect The given input is parsed.
	 *       | this.parseInput(input)
	 *         The parsed input is executed.
	 *       | this.execute(parsedInput)
	 */
	handleInput(input: string) {
	    let parsedInput = this.parseInput(input);
	    if (parsedInput != undefined
			&& parsedInput[1] != undefined) {
	        let commandName:string = parsedInput[0];
	        let args = parsedInput[1];
			this.registeredCommands[commandName].callback!(...args, this);
	    }
	}

	/**
	 * When a message is received, print the given message.
	 *
	 * @param  {Object} message
	 *         The message received.
	 * @effect The given message is printed.
	 *       | this.printMessage(colors.bold.green(message.nick + ": ")
	 *		 |   + message.text);
		*/
	onMessage(message: { nick: string; text: string; }) {
	    this.printMessage(colors.bold.green(message.nick + ': ')
			+ message.text);
	}

	/**
	 * Prints the given message.
	 *
	 * @param  {Object} message
	 *         The message to be printed.
	 * @effect If the current prompt of this CLI is undefined, then interrupt
	 *         it for the given message. 
	 *       | this.currentPrompt.interruptForMessage(message)
	 * @effect Otherwise, log the given message.
	 *       | console.log(message)
	 */
	printMessage(message: string) {
	    if (this.currentPrompt !== undefined)
	        this.currentPrompt.interruptForMessage(message); 
	    else 
	        console.log(message);
	    return true;
	}

	/**
	 * Prints the given message as an error.
	 *
	 * @param  {Object} message
	 *         The message to be printed.
	 * @effect The given message is printed in bold red.
	 *       | this.printMessage(colors.bold.red("Error: " + message))
	 */
	printError(message = '') {
	    this.printMessage(colors.bold.red('Error: ' + message));
	}

	
	checkCommandDefinition(command: command_args | null | undefined) {
	    if ((command === null)
			|| (command === undefined)
			|| (command.constructor != Object))
	        return 'A command definition must be a dictionary \n';

	    let message = '';
	    message += this.checkNameCommand(command);
	    message += this.checkHelpTextCommand(command);
	    message += this.checkParametersCommand(command);
	    message += this.checkMainParameterCommand(command);
	    message += this.checkCallbackCommand(command);
	    return message;
	}

	
	checkNameCommand(command: command_args) {
	    if (!('name' in command))
	        return 'No name specified \n';
	    if ((typeof (command.name) !== 'string')
			|| (command.name.includes(' ')))
	        return 'The name must be a string without spaces \n';
	    if (command.name in this.registeredCommands)
	        return 'A command with the same name already exists \n';
	    return '';
	}

	
	checkHelpTextCommand(command: command_args) {
	    if (!('helpText' in command))
	        return 'No help text specified \n';
	    if (typeof (command.helpText) !== 'string')
	        return 'Help text is not a string \n';
	    return '';
	}

	
	checkParametersCommand(command: command_args) {
	    if (!('parameters' in command))
	        return 'No parameters field specified \n';
	    if (!Array.isArray(command.parameters))
	        return 'Parameters is not an array';

	    let message = '';
	    for (let param of command.parameters)
	        if (message == '')
	            message = this.checkParameterDefinition(param);
	        else
	            break;
	    return message;
	}

	
	checkMainParameterCommand(command: command_args) {
	    if (command.parameters === undefined)
	        return '';

	    let commandHasMainParameter = false;
	    command.parameters.forEach((param) => {
	        if (param.isMainParameter)
	            if (!commandHasMainParameter)
	                commandHasMainParameter = true;
	            else
	                return 'Only one main parameter is allowed';
	    });
	    return '';
	}

	
	checkCallbackCommand(command: command_args) {
	    if (!('callback' in command))
	        return 'No callback specified';
	    if (!(command.callback instanceof Function))
	        return 'Callback is not a function';
	    if (command.parameters !== undefined 
			&& command.callback.length !== command.parameters.length)
	        return `Callback of ${command.name} does not have the right number of parameters`;
	    return '';
	}

	
	checkParameterDefinition(param: command_parameter_type) {
	    if ((param === null)
			|| (param === undefined)
			|| (param.constructor != Object))
	        return 'A parameter definition must be a dictionary';

	    let message = '';
	    message += this.checkNameParameter(param);
	    message += this.checkIsMainParameterField(param);
	    message += this.checkOptionalField(param);
	    return message;
	}

	
	checkNameParameter(param: command_parameter_type) {
	    if (!('name' in param))
	        return 'A parameter does not have a name';
	    if (typeof (param.name) !== 'string')
	        return 'The name of a parameter is not a string';
	    return '';
	}

	
	checkIsMainParameterField(param: command_parameter_type) {
	    if (('isMainParameter' in param)
			&& (param.isMainParameter !== true)
			&& (param.isMainParameter !== false))
	        return `The isMainParameter value of ${param.name} must be
				a boolean`;
	    return '';
	}

	
	checkOptionalField(param: command_parameter_type) {
	    if (('optional' in param)
			&& (param.optional !== true)
			&& (param.optional !== false))
	        return `The optional value of ${param.name} must be
				a boolean`;
	    return '';
	}

	
	parseInput(input: string): undefined|[string,string[]|undefined] {
	    let [optionalCommandName, unparsedArgs] =
			this.splitIntoCommandNameAndRest(input);
	    let command = this.determineCorrespondingCommand(optionalCommandName);
	    // eslint-disable-next-line no-prototype-builtins
	    if (command !== undefined && command.hasOwnProperty('parameters')) {
	        return [command.name, this.getAllArgs(unparsedArgs, command)];
	    }
	}

	
	determineCorrespondingCommand(commandName: string) {
	    if (commandName == '')
	        if (this.defaultCommand === undefined)
	            return this.printError('No default command specified');
	        else
	            return this.defaultCommand;
	    else if (!(commandName in this.registeredCommands))
	        return this.printError('Unrecognized command');
	    else
	        return this.registeredCommands[commandName];
	}

	
	splitIntoCommandNameAndRest(input: string):[string, string[]] {
	    if (!input.startsWith('/'))
	        return ['', input.split(' ')];

	    // Remove first "/" to start at the command name
	    input = input.slice(1);

	    let [commandName, ...rest] = input.split(' ');

	    return [commandName, rest];
	}

	
	getAllArgs(unparsedArgs: string[], command: command_args): string[] | undefined {
	    let parameters;
	    // eslint-disable-next-line no-prototype-builtins
	    if(command.hasOwnProperty('parameters'))
	        parameters = command.parameters;
	    else
	        return [''];
	    let nameMainParameter =
			this.findNameMainParameter(parameters!);	
	    let parsedArgs:{[index:string]:string} = this.parseArgs(unparsedArgs, nameMainParameter);
		
	    // Add default value to parsedArgs for parameters not given
	    let args:string[] = [];
	    for (let param of parameters!) {
		    if (param.name in parsedArgs)
		        args.push(parsedArgs[param.name]);
		    else if ('defaultValue' in param)
		        args.push(param.defaultValue!());
		    else if ('optional' in param && param.optional){
		        debug('optioneel');	
		        args.push('');
		    } else {				
		        this.printError(`${param.name} parameter needs to be given for this command.`);
		        return undefined;		
		    }
	    }
	    return args;
	}


	findNameMainParameter(parameters: command_parameter_type[]) {
	    let nameMainParameter = '';
	    parameters.forEach((param) => {
	        if ('isMainParameter' in param)
	            nameMainParameter = param.name;
	    });
	    return nameMainParameter;
	}


	parseArgs(unparsedArgs: string[], nameMainParameter: string):{[index:string]:string} {
	    let parsedArgs: {[index:string]:string} = {};
	    //unparsedStack is an array of strings wich will store all words of the message as elements
	    let unparsedStack:string[] = [];
	    let argumentName,value;
	    // Parse args of type --name=value
	    for (let i = 0; i < unparsedArgs.length; i++) {
	        if (unparsedArgs[i].startsWith('--')) {
	            unparsedStack = [];
	            // Remove double dash
	            unparsedArgs[i] = unparsedArgs[i].slice(2);
	            // Remove name
	            [argumentName, value] = unparsedArgs[i].split('=');
	            if(value != '')
	                unparsedStack[unparsedStack.length] = value;
	        }else if(i == 0){
	            //value of main parameter is given without "--parameter_name"
	            while(i<unparsedArgs.length){
	                if(unparsedArgs[i].startsWith('--'))
	                    break;
	                unparsedStack[unparsedStack.length] = unparsedArgs[i];
	                i++;
	            }
	            i--;
	            argumentName = nameMainParameter;

	        }else
	            unparsedStack[unparsedStack.length] = unparsedArgs[i];
	        //join every string in unparsedStack with spaces in between
	        if(!(argumentName == undefined))
	            parsedArgs[argumentName] = unparsedStack.join(' ');
	    }

	    return parsedArgs;
	}


	setDefaultCommand(commandName: string) {
	    if (!(commandName in this.registeredCommands))
	        return this.printError('no such command exists.');

	    this.defaultCommand = this.registeredCommands[commandName];
	    this.printMessage(`Default command is now ${commandName}.`);
	}

	
	printHelpText(commandName: string) {
	    // Remove whitespace, so length equals zero if no name is given.
	    if(!(commandName == ''))
	        commandName = commandName.trim();

	    if (commandName.length > 0)
	        this.printExtendedHelpTextCommand(commandName);
	    else
	        this.printHelpTextAllRegisteredCommands();
	}

	
	printExtendedHelpTextCommand(commandName: string) {
	    if (!(commandName in this.registeredCommands))
	        this.printMessage(`Command ${commandName} does not exist.`);

	    let command = this.registeredCommands[commandName];
	    this.printMessage(commandName + ': ' + command.helpText);

		// Print explanation for parameters
		command.parameters!.forEach((param: command_parameter_type) => {
		    this.printHelpTextParameter(param);
		});
	}

	
	printHelpTextParameter(param: command_parameter_type) {
	    // Add name parameter
	    let paramHelpText = '    --' + param.name.padEnd(20, ' ');

	    if (param.isMainParameter)
	        paramHelpText += 'This argument is the main parameter.';

	    // Add default value or non-existing, if field exists
	    paramHelpText += (param.defaultValue ? `Its default value 
					is ${param.defaultValue}.`
	        : 'It has no default value.');

	    // Add if optional or obliged, if field exists
	    paramHelpText += (param.optional ? 'It can be empty.'
	        : 'It cannot be empty.');
		
	    this.printMessage(paramHelpText);
	}

	
	printHelpTextAllRegisteredCommands() {
	    let keysRegisteredCommands =
			Object.keys(this.registeredCommands).sort();

	    keysRegisteredCommands.forEach((key) => {
	        this.printMessage(this.registeredCommands[key].name + ': ' 
				+ this.registeredCommands[key].helpText);
	    });
	}
}

/**
 * Module exports.
 */
export default cli;