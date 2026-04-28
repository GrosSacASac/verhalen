export {
    stringFromUint8Array,
    uint8ArrayFromString,
}


const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const stringFromUint8Array = (uint8array) => {
    return textDecoder.decode(uint8array);
};

const uint8ArrayFromString = (string) => {
    return textEncoder.encode(string);
};

