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


const db = await useDB("./people.verhalen", [
    {name: "Name", length: 16},
    {name: "Bday", length: 10},
    {name: "color", length: 16},
]);

await addObject(db, {
    Name: "GrosSacASac",
    Bday: "2000-06-07",
    color: "red"
});

await addObject(db, {
    Name: "TeddyBear",
    Bday: "2003-12-24",
    color: "brown"
});

await addObject(db, {
    Name: "temp",
    Bday: "1999-01-01",
    color: "gold"
});



console.log(await readAllObjects(db));

await deleteObject(db, "Name", (Name) => {return Name === "temp"});
await replaceObject(db, {
    Name: "GrosSacASacs",
    Bday: "1999-02-02",
    color: "metal green"
}, "Name", (Name) => {return Name === "GrosSacASac"});

console.log("after delete, replace", await readAllObjects(db));

console.log("finding object that has color brown", await readFind(db, "color",(color) => {return color === "brown"}));

await closeDB(db);

