export {
    stringFromUint8Array,
    uint8ArrayFromString,
}


const stringFromUint8Array = (uint8array) => {

    //convert to array to have the .map function be able to return non-uint8
    return Array.from(uint8array).map(uint8 => {
        return String.fromCodePoint(uint8);
    }).join("");
};

const uint8ArrayFromString = (string) => {
    return Uint8Array.from(Array.from(string).map(character => {
        return character.charCodeAt(0);
    }));
};

