import { isMsg, Msg, Payloads } from '../../comm/proto3';

/**
 * Encrypts the message with Rot13 and returns the encrypted message.
 * 
 * @param {string} message  The message that will be encrypted.
 */
function sendMessage<C extends keyof Payloads>(args: Msg<C>):Msg<C>{
    if(isMsg('ChatMessage', args)){
        let values = [];
        let msg = args.payload.text;
        for (let i=0; i<msg.length; i++){
            values.push(msg.charCodeAt(i) + 13);
        }
        let encryptedMsg: string[] = [];
        values.forEach(value => {encryptedMsg.push(String.fromCodePoint(value)); });
        let final = encryptedMsg.join('');
        args.payload.text = final;
    }
    return args;
}

/**
 * Decrypts the message with Rot13 and returns the decrypted message.
 * 
 * @param {string} message  The message that will be decrypted
 */
function receiveMessage<C extends keyof Payloads>(args: Msg<C>):Msg<C> {
    if(isMsg('ChatMessage', args)){
        let msg = args.payload.text;
        let values = [];
        for (let i=0; i<msg.length; i++){
            values.push(msg.charCodeAt(i) -13);
        }
        let decryptedMsg: string[] = [];
        values.forEach(value => {decryptedMsg.push(String.fromCodePoint(value)); });
        let final = decryptedMsg.join('');
        args.payload.text = final;
    }
    return args;

}

/**
 * Module exports.
 */
export default {sendMessage, receiveMessage};