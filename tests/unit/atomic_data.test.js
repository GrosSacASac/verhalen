import test from "node:test";
import assert from "node:assert";
import { deepEqualAdded } from "utilsac/deep.js";

import {uint8ArrayFromObject} from "../../write.js";
import {valueFromSubUint8Array} from "../../read.js";


test("read write Number", (t) => {
    const schema = [{type: "Number", name: "Number", length:8}];
    [
        0,1,2,-1, -2, 
        Math.PI, 2000, 10**10,
        Number.MIN_SAFE_INTEGER, Number.MIN_VALUE,
        Number.MAX_SAFE_INTEGER, Number.MAX_VALUE
    ].forEach((n) => {
        const object = {Number: n};
        //**2000 =  0+0+0+0+16+0+64+128+256+512+1024 
        // 00001011'11100000'*/
        // const expected = Uint8Array.of(0,0,0,0,0,0, 11, 224);
        const uint8 = uint8ArrayFromObject(schema,8, object);
        const numberReconstituted = valueFromSubUint8Array(uint8, "Number");
        assert.equal(numberReconstituted, object.Number);
        // assert(deepEqualAdded(numberReconstituted, object.Number));
    })
});