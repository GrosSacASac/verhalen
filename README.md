# verhalen

todo

```
fsPromises.open(path, 'r') required ? when opened for write ?
readRowPositionFromPart should have startPosition argument
make consumable with http,without extra work
define api to create schema
null terminated string ?
other than string (number, int32, int 64, date, lists, etc)
```

## format

### file

```
file database.verhalen
|----------|
Header fixed size
Body fixed size
|----------|
```

### Header fixed size

verhalen prefix  (8bytes)
verhalen version (3bytes)
Schema size (2bytes) (todo)
JSON header(schema)
last known positions ?
followed by empty space

### Body fixed size

Body followed by empty space

### Body

0 or more body entries

### Body Entry

Each field (according to the schema used during creation)

### Field

Field data or empty space, followed by empty space if length is smaller than field length