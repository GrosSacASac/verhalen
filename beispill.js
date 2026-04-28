import {
    useDB,
    createDB,
    closeDB,
    addObject,
    replaceObject,
    deleteObject,
    readAllObjects,
    readFind,
} from "./verhalen.js";
import fsPromises from "node:fs/promises";


const db = await useDB("./leit.verhalen", [
    {name: "Name", length: 16},
    {name: "Bday", length: 10},
    {name: "color", length: 16},
    {name: "uint32", type: "Uint32"},
    {name: "uint8", type: "Uint8"},
    {name: "number", type: "Number"},
]);

await addObject(db, {
    Name: "GrosSacASac",
    Bday: "2000-06-07",
    color: "red",
    uint8: 8,
    uint32: 2**32-1,
    number: 2026,
});

await addObject(db, {
    Name: "TeddyBear",
    Bday: "2003-12-24",
    color: "brown",
    uint8: 1,
    uint32: 2**10,
    number: 9999,
});

await addObject(db, {
    Name: "temp",
    Bday: "1999-01-01",
    color: "gold",
    uint8: 0,
    uint32: 10**10,
    number: 10**100,
});



console.log(await readAllObjects(db));

await deleteObject(db, "Name", (Name) => {return Name === "temp"});
await replaceObject(db, {
    Name: "GrosSacASacs",
    Bday: "1999-02-02",
    color: "metal green",
    uint8: 94,
    uint32: 2**32-1,
    number: 2027,
}, "Name", (Name) => {return Name === "GrosSacASac"});

console.log("after delete, replace", await readAllObjects(db));

console.log("finding object that has color brown", await readFind(db, "color",(color) => {return color === "brown"}));

await closeDB(db);

