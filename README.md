# verhalen

## todo

```
bodyLength is incorrect if the file already exists. do we need it ?
make consumable with http, without extra work

increase baseHeaderSize if schema does not find
add more types ( int32, date, lists, etc)
utf-8
pagination (maybe use generators)
test lock
insert bulk
refactor duplicate

types
split readFind into a version that finds each (not just the first)
```
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