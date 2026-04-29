# verhalen

Schema based database for JS

## Concepts

### Schema

A schema defines the shape of the data. Example:

```js
[
    {key: "Name", length: 16},
    {key: "Bday", length: 10},
    {key: "color", length: 16},
    {key: "number", type: "Number"},
]
```

Length is required for types with variable length like string. Type default is "string". Key is the name of the key-value pair for the kind of object that you put in or pull out of the database. For example with this kind of schema you could then add the following object in your database:

```js
await addObject(db, {
    Name: "TeddyBear",
    Bday: "2003-12-24",
    color: "brown",
    number: 9999,
});
```


#### Types

Types describe what kind of data is stored. 

```js
"string"
```

For storing strings. Use the length to describe the max length.

```js
"Number"
```

For storing numbers equivalent to the JS builtin Number (64 bits floating).

```js
"Uint8"
```

For storing numbers from 0 to 255.

```js
"Uint32"
```

For storing numbers from 0 to 2**32-1.

### Objects

Objects are data pieces used in programs that contain atomic data types like strings and numbers. Each object stored in the database will take exactly as much space as the sum of its properties lengths.

## api

### install

[npm install verhalen-sac](https://www.npmjs.com/package/verhalen-sac)

### import 

```js
import {
    useDB,
    createDB,
    closeDB,
    addObject,
    replaceObject,
    deleteObject,
    readAllObjects,
    readFind,
} from "verhalen-sac";
```

### useDB

Will use or create the db if the file does not exist. It returns the db object used by the rest of the methods.

`const db = await useDB(path, schema);`

### closeDB

Will close the db file descriptor.

`await closeDB(db);`

### addObject

Adds an object to the database.

```js
await addObject(db, {
    Name: "GrosSacASac",
    Bday: "2000-06-07",
    color: "red",
    number: 2026,
});
```

### replaceObject

Replaces an object with another in the database. Most useful to update a specific objects. The first 2 arguments are the database and the new object. The third and fourth argument are the property to look for and the find function. It replace the first object where the condition returns true 

```js
await replaceObject(db, {
    Name: "GrosSacASacs",
    Bday: "1999-02-02",
    color: "metal green",
    number: 2027,
}, "Name", (Name) => {
    return Name === "GrosSacASac";
});
```

### deleteObject

Deletes an object in the database. The first argument is the database. The last 2 arguments are similar to replaceObject.

```js
await deleteObject(db, "Name", ((Name) => {
    return Name === "GrosSacASac";
}));
```

### readFind

Returns the first object found. The last 2 arguments are similar to replaceObject. Returns undefined if object is not found.

```js
const object = await readFind(db, "Name", ((Name) => {
    return Name === "GrosSacASac";
}));
```

### readAllObjects

Returns an array with all the objects in the database

```js
const allObjects = await readAllObjects(db);
```



## format

### file

```
file database.verhalen

Header fixed size
Body fixed size

```

### Header fixed size

verhalen prefix  (8bytes)
verhalen version (3bytes)
Empty (1byte)
Schema size (2bytes) (todo)
JSON header(schema)

14 bytes + schema length
filled with blanks to fit baseHeaderSize

### Body fixed size

Body followed by empty space

#### Body

0 or more body entries

#### Body Entry (object)

Each field (according to the schema used during creation)

#### Field

Field data or empty space, followed by empty space if length is smaller than field length

## About

### Translation

verhalen means remember


### License

MIT

### todo

```
bodyLength is incorrect if the file already exists. do we need it ?
make consumable with http, without extra work

increase baseHeaderSize if schema does not find
add more types (date, lists, etc)
pagination (maybe use generators)
test lock
insert bulk
refactor duplicate

types
split readFind into a version that finds each (not just the first)
```
