import {
    createDB,
    appendObject,
    closeDB,
    readAllObjects,
} from "./verhalen.js";


const db = await createDB("./people.verhalen", [
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

const allObjects = await readAllObjects(db);

console.log(allObjects);

await closeDB(db);
