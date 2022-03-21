/**
 * Module dependencies.
 */
// import * as AutoComplete from 'enquirer';
// eslint-disable-next-line no-unused-vars
const { AutoComplete } = require('enquirer');

// Highlight definition
// eslint-disable-next-line no-unused-vars
const highlight = (input: string, color: (arg0: any) => any) => {
    let val = input.toLowerCase();
    return (str: string) => {
        let s = str.toLowerCase();
        let i = s.indexOf(val);
        let colored = color(str.slice(i, i + val.length));
        return i >= 0 ? str.slice(0, i) + colored + str.slice(i + val.length) : str;
    };
};
//list with previous commands (when pressed enter)
let previousCommands:string[] = [];
//pointer to the used command in this previouCommands
let ptr:number = -1;
 
/**
 * A prompt class made for autocompleting commands
 */
class CommandComplete extends AutoComplete {
    
    // eslint-disable-next-line no-unused-vars
    constructor(options: { name?: string; promptLine?: boolean; commandColor?: (str: string) => string; highlight?: (str: string) => string; limit?: number; choices: any; onCancel?: () => any; result?: any; }) {
        if (options.choices.length === 0) options.choices = [''];
        options.result = (/*_: any*/) => this.input;
        super(options);
        // This is mostly the same as the defaults in enquirer/lib/combos.js, but the action for tab was changed to allow autocomplete.
        // For some reason overwriting just one action doesn't work.
        this.options.actions = {
            shift: {
                up: 'shiftUp',
                down: 'shiftDown',
                left: '',
                right: '',
                tab: ''
            },

            keys:{
                pageup: 'pageUp', 
                pagedown: 'pageDown', 
                home: 'home', 
                end: 'end', 
                cancel: 'cancel',
                delete: 'deleteForward',
                backspace: 'delete',
                down: 'down',
                enter: 'enter',
                escape: 'cancel',
                left: 'left',
                space: 'space',
                number: 'number',
                return: 'submit',
                right: 'right',
                tab: 'autoComplete',
                up: 'up',
            }
        };
        
    }



    //method will be called when enter is pressed
    //push the command on the previousCommand, so we can get it back when we want
    async onEnter(line:string){
        previousCommands.push(line);
        ptr = previousCommands.length;
    }

    //method will be called when shift and up is pressed
    async shiftUp(){
        //no commands have been pushed on the previousCommands
        if(ptr <= 0)
            return;
        if(previousCommands != undefined && ptr >= 0){
            //decrease if neccesary, so we can get the command before this one by pressing it again
            if(ptr >= 1)
                ptr--;
            //change input and cursor
            this.input = previousCommands[ptr];
            this.cursor = previousCommands[ptr].length;
            
            return await this.complete();
        }
    }

    //method will be called when shift and down is pressed
    async shiftDown(){
        //if this is the case (we were on the latest command, and pressed shift_down), we want a newline
        if(ptr == previousCommands.length - 1 ){
            this.input = '';
            this.cursor = 0;
            ptr = previousCommands.length;
            return await this.complete();
        }
        
        if(previousCommands != undefined && ptr < previousCommands.length){
            //increase so we can have the next command by pressing this again
            ptr++;
            //change input and cursor
            this.input = previousCommands[ptr];
            this.cursor = previousCommands[ptr].length;
            
            return await this.complete();
        }
    }


   


    /**
     * This function is overwritten to use only the part of the input containing the currently typed command for the suggestions.
     */
    async complete() {
        this.completing = true;
        this.choices = await this.suggest(this.getTypedCommand(this.input), this.state._choices);
        this.state.limit = void 0; // allow getter/setter to reset limit
        this.index = Math.min(Math.max(this.visible.length - 1, 0), this.index);
        await this.render();
        this.completing = false;
    }

    /**
     * Extracts the command from the given input string
     * 
     * This will only return a nonempty string if the input starts with a '/'. This character will then be cut off. 
     * This will also cut off everything after the first space.
     * 
     * @param {string} input The input string to extract the command from
     */
    getTypedCommand(input: string) {
        if (input[0] !== '/') return '';
        let firstSpace = input.indexOf(' ');
        if (firstSpace > 0) return input.substring(1, firstSpace);
        return input.substring(1); // if there is no space, return everything after the '/'
    }

    /**
     * This function will autocomplete the input when the tab key is pressed.
     */
    async autoComplete() {
        let arrInput = String(this.input);
        let newInput = arrInput; //emojify(arrInput)
        if(arrInput != newInput){
            this.cursor = newInput.length;
            this.input = newInput;
            return await this.complete();
        }

        if (this.input[0] !== '/') return;
        let firstSpace = this.input.indexOf(' ');
        if (firstSpace < 0) { // no space in input
            if (this.cursor != this.input.length) return; // The cursor is not at the end of the line.
        } else {
            if (firstSpace != this.cursor) return; // The input contains a space and the cursor is not right before it.
        }
        if (this.selected === undefined) return;

        let restOfLine = (firstSpace > 0) ? this.input.substring(firstSpace) : '';
        this.input = '/' + this.selected.value + restOfLine; // replace what is typed with the full command
        this.cursor = this.selected.value.length + 1; // move the cursor to the end of the command
        return await this.complete();
    }


    checkIfEmoticon(input:string, i:number) : string|undefined{
        let name:string[] = [':'];
        let j=i;
        while(i<input.length){
            if(input[j] == ' ' || input[j] == undefined || input[j] == ':')
                break;
            name.push(input[j]);
            j++;
        }
        name.push(':');
        
        let str:string = name.join('');
        let emote = '';
        if(emote.length != str.length)
            return emote;
        return undefined;
        

    }

    /**
     * This function is overwritten to always show the typed input, even after submitting.
     */
    format() {
        return this.options.commandColor 
            ? this.options.commandColor(this.input)
            : this.input;
    }

    /**
     * This function prints the given message above what is currently displayed.
     * 
     * @param {*} message The message to be printed.
     */
    async interruptForMessage(message: string) {
        let { size } = this.state;

        if (this.state.status === 'submitted') {
            await console.log(message);
        } else {
            this.clear(size);
            await console.log(message);
            await this.complete();
        }
    }

    /**
     * This renders the current input and the options to the screen.
     */
    async render() {
        let { submitted, size } = this.state;

        let prompt = '';
        let header = await this.header();

        if (this.options.promptLine !== false) {
            let prefix = await this.prefix();
            let separator = await this.separator();
            let message = await this.message();
            prompt = [prefix, message, separator, ''].join(' ');
            this.state.prompt = prompt;
        }

        let output = await this.format();
        let help = (await this.error()) || (await this.hint());
        let body;
        if (this.state.status === 'pending' && this.input[0] == '/') {
            // Possibly apply highlighting to the choices
            let style = this.options.highlight
                ? this.options.highlight.bind(this)
                : this.styles.placeholder;
            
            let color = highlight(this.getTypedCommand(this.input), style);
            let choices = this.choices;
            this.choices = choices.map((ch: { message: string; }) => ({ ...ch, message: color(ch.message) }));

            body = await this.renderChoices();
            this.choices = choices;
        } else {
            body = ''; 
        }

        let footer = await this.footer();

        if (output) prompt += output;
        if (help && !prompt.includes(help)) prompt += ' ' + help;

        if (submitted && !output && !body.trim() && this.multiple && this.emptyError != null) {
            prompt += this.styles.danger(this.emptyError);
        }

        this.clear(size);
        this.write([header, prompt, body, footer].filter(Boolean).join('\n'));
        this.write(this.margin[2]);
        this.restore();
    }

}

export default CommandComplete;