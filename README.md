# verhalen

todo

```
fsPromises.open(path, 'r') required ? when opened for write ?
make consumable with http, without extra work

other than string (number, int32, int 64, date, lists, etc)
```
## api

### import 

```js
import {
    useDB,
    createDB,
    closeDB,
    appendObject,
    replaceObject,
    createSchema,
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