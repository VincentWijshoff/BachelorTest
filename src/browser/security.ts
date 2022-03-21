/* eslint-disable no-undef */
// From https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey


/*
Convert  an ArrayBuffer into a string
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function ab2str(buf: ArrayBuffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buf) as any);
}

function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}


export async function generateKeyPair(): Promise<{publicKey: string, privateKey: string}> {

    // I hope this is secure

    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',  // RSASSA-PKCS1-v1_5 or RSA-PSS for signing, RSA-OAEP for encryption
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        },
        true,
        ['sign', 'verify']
    );
    const publicKey = await exportCryptoKeyAsPEM(false, keyPair.publicKey);
    const privateKey = await exportCryptoKeyAsPEM(true, keyPair.privateKey);
    return {publicKey, privateKey};
}


export async function signSecurity(privkey: string, data: string) {
    const key = await importCryptoKeyAsPEM(true, privkey);
    const signature = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, Buffer.from(data));
    return signature;
}


export async function verifyBrowser(pubkey: string, signature: ArrayBuffer, data: string) {
    const key = await importCryptoKeyAsPEM(false, pubkey);
    const verified = await window.crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        signature,
        Buffer.from(data));
    return verified;
}


export async function exportCryptoKeyAsPEM(isPrivateKey: boolean, key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey(
        isPrivateKey ? 'pkcs8' : 'spki',
        key
    );
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    const type = isPrivateKey ? 'PRIVATE' : 'PUBLIC';
    const pemExported = `-----BEGIN ${type} KEY-----\n${exportedAsBase64}\n-----END ${type} KEY-----`;

    return pemExported;
}



export async function importCryptoKeyAsPEM(isPrivateKey: boolean, pem: string): Promise<CryptoKey> {
    // fetch the part of the PEM string between header and footer
    const type = isPrivateKey ? 'PRIVATE' : 'PUBLIC';
    const pemHeader = `-----BEGIN ${type} KEY-----`;
    const pemFooter = `-----END ${type} KEY-----`;
    const pemContents = pem.substring(pemHeader.length + 1, pem.length - pemFooter.length - 1);
    // base64 decode the string to get the binary data
    console.log('pemcontents: ', pemContents);
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);


    return await window.crypto.subtle.importKey(
        isPrivateKey ? 'pkcs8' : 'spki', //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
        binaryDer,
        {   //these are the algorithm options
            name: 'RSASSA-PKCS1-v1_5',
            hash: {name: 'SHA-256'},
        },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        isPrivateKey ? ['sign']: ['verify'] //"verify" for public key import, "sign" for private key imports
    );
}


export async function importCertificateAsPem(pem: string): Promise<CryptoKey> {
    const pemHeader = '-----BEGIN CERTIFICATE-----';
    const pemFooter = '-----END CERTIFICATE-----';
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return await window.crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        ['verify']
    );
}

