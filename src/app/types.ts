import { sha1 } from 'object-hash';

export function hashFromPublicKey(pubkey: string): string {
    // Note: base64 is according to RFC 4648 Section 5 (!) according to the node
    // docs. This means the characters used are A–Z, a–z, and 0–9 for the first
    // 62 and the two extra characters are + and /. The two extra characters
    // might also be - and _, as the node docs refer to Section 5 instead of
    // Section 4, where Section 5 is base64url. The RFC however warns explicitly
    // to not call Section 5 base64 but to only call Section 4 that way...
    // Additionally the = character is used for padding.
    //
    // https://tools.ietf.org/html/rfc4648#section-5
    return sha1(pubkey);
}

export function splitHashAndNick(hashOrHashAndNick: string): [ hash: string, nick: string | undefined ] {
    const i = hashOrHashAndNick.indexOf(':');
    if(i > -1) return [ hashOrHashAndNick.substr(0, i), hashOrHashAndNick.substr(i+1)];
    return [ hashOrHashAndNick, undefined ];
}

export function combineHashAndNick(hash: string, nick: string): string {
    return `${hash}:${nick}`;
}

// Examples:
// sha256: MkZCES5VANg2AZUGYTy0LWpGzGTEqCCBDh+2TU9HdV0= (this is still secure)
// sha1:   UPARQZ+BjqOO7nEGLtbHi1WmsiA
// Shorter but not so secure, known attacks, we only need to care about
// creating another public key with the same hash.
