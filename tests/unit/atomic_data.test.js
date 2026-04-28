import test from "node:test";
import assert from "node:assert";

import {uint8ArrayFromObject} from "../../write.js";
import {valueFromSubUint8Array} from "../../read.js";


test(`read write Number`, (t) => {
    const schema = [{type: `Number`, name: `Number`, length:8}];
    [
        0,1,2,-1, -2, 
        Math.PI, 2000, 10 ** 10,
        Number.MIN_SAFE_INTEGER, Number.MIN_VALUE,
        Number.MAX_SAFE_INTEGER, Number.MAX_VALUE,
    ].forEach((n) => {
        const object = {Number: n};
        //**2000 =  0+0+0+0+16+0+64+128+256+512+1024 
        // 00001011'11100000'*/
        // const expected = Uint8Array.of(0,0,0,0,0,0, 11, 224);
        const uint8 = uint8ArrayFromObject(schema,8, object);
        const numberReconstituted = valueFromSubUint8Array(uint8, `Number`);
        assert.equal(numberReconstituted, object.Number);
        // assert(deepEqualAdded(numberReconstituted, object.Number));
    });
});

test(`read write utf-8`, (t) => {
    const length = 64;
    const schema = [{ name: `name`, length, type:`string`}];
    [
        `桁`,
        `café`,
        `😂`,
    ].forEach((utf8String) => {
        const object = {name: utf8String};
        const uint8 = uint8ArrayFromObject(schema,length, object);
        const reconstituted = valueFromSubUint8Array(uint8, `string`);
        assert.equal(reconstituted, object.name);
        // assert(deepEqualAdded(numberReconstituted, object.Number));
    });
});

test.expectFailure(`Float64Array cannot use a common arraybuffer that is not divisible by its byte length (8)`, (t) => {
    const a = (new Uint8Array(25)).subarray(0,24); // subarray uses the same underlying buffer
    const f = new Float64Array(a.buffer);
});

test(`Float64Array can use a common arraybuffer that is divisible by its byte length (8)`, (t) => {
    [
        new Uint8Array(8),
        new Uint8Array(16),
        new Uint8Array(24),
        (new Uint8Array(25)).slice(0,24), // slice create a new underlying buffer
    ].forEach((uint8Array) => {
        const f = new Float64Array(uint8Array.buffer);
        assert(true);
    });
});