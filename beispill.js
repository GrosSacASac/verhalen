import {
    createDB,
    useDB,
    appendObject,
    closeDB,
    readAllObjects,
    deleteObject,
} from "./verhalen.js";
import fsPromises from "node:fs/promises";


const db = await useDB("./people.verhalen", [
    {name: "Name", length: 16},
    {name: "Bday", length: 10},
    {name: "color", length: 16},
]);

await appendObject(db, {
    Name: "GrosSacASac",
    Bday: "2000-06-07",
    color: "red"
});

await appendObject(db, {
    Name: "TeddyBear",
    Bday: "2003-12-24",
    color: "brown"
});

await appendObject(db, {
    Name: "temp",
    Bday: "1999-01-01",
    color: "gold"
});

// db.bodyObjects = 2;

console.log(await readAllObjects(db));

await deleteObject(db, "Name", "temp");

console.log("after delete", await readAllObjects(db));

await closeDB(db);

