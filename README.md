# verhalen

## Concepts

### Schema

A schema defines the shape of the data. Example:

```js
[
    {name: "Name", length: 16},
    {name: "Bday", length: 10},
    {name: "color", length: 16},
    {name: "int8", type: "Uint8"},
    {name: "number", type: "Number"},
]
```

Length is required for types with variable length like string. Type default is "string". Name is the name of the key for the kind of object that you put in or pull out of the database. For example with this kind of schema you could then add the following object in your database:

```js
await addObject(db, {
    Name: "TeddyBear",
    Bday: "2003-12-24",
    color: "brown",
    int8: 1,
    number: 9999,
});
```

#### Types

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


## api

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
} from "verhalen";
```

### createDB



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


## todo

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
