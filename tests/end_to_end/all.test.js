import {
    useDB,
    createDB,
    closeDB,
    addObject,
    replaceObject,
    deleteObject,
    readAllObjects,
    readFind,
} from "../../verhalen.js";
import fsPromises from "node:fs/promises";
import test, {suite, after} from "node:test";
import assert from "node:assert";

const o1 = {
    string: `GrosSacASac`,
    int8: 8,
    number: 2026,
};

const o1bis = {
    string: `GrosSacASacs`,
    int8: 94,
    number: 2027,
};

const o2 = {
    string: `TeddyBear`,
    int8: 1,
    number: 9999,
};

const o3 = {
    string: `temp`,
    int8: 0,
    number: 10 ** 100,
};
globalThis.testDatabase = `./tests/end_to_end/veralen_test.verhalen`;

suite(`end to end`, async () => {
    after(async () => {
        await closeDB(db);
        await fsPromises.rm(globalThis.testDatabase);
    });

    const db = await useDB(globalThis.testDatabase, [
        {key: `string`, length: 20},
        {key: `int8`, type: `Uint8`},
        {key: `number`, type: `Number`},
    ]);

    await test(`add`, async () => {
        await addObject(db, o1);
        await addObject(db, o2);
        await addObject(db, o3);
    });

    await test(`database contains what we just added`, async () => {
        assert.deepStrictEqual(await readAllObjects(db), [o1, o2, o3]);
    });


    await test(`delete`, async () => {
        await deleteObject(db, `string`, (s) => {
            return s === o3.string;
        });
    });

    await test(`database does not contain what we removed`, async () => {
        assert.deepStrictEqual(await readAllObjects(db), [o1, o2]);
    });

    await test(`replace`, async () => {
        await replaceObject(db, o1bis, `string`, (s) => {
            return s === `GrosSacASac`;
        });
    });

    await test(`database contains what we just replaced`, async () => {
        assert.deepStrictEqual(await readAllObjects(db), [o1bis, o2]);
    });


    await test(`database finds what search`, async () => {
        assert.deepStrictEqual((await readFind(db, `int8`, (i) => {
            return i === o2.int8;
        })), o2);
    });

    await test(`database returns undefined if what searched is absent`, async () => {
        assert.deepStrictEqual((await readFind(db, `int8`, (i) => {
            return i === Symbol();
        })), undefined);
    });

});
