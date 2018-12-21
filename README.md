# verhalen

todo

```
readRowPositionFromPart should have startPosition argument
make consumable with http,without extra work
define api to create schema
null terminated string ?
other than string (number, int32, int 64, date, lists, etc)
```

## format

### file

```
file database.dbx
|----------|
Header fixed size
Body fixed size
|----------|
```

### Header fixed size

JSON header followed by empty space

### Body fixed size

Body followed by empty space

### Body

0 or more body entries

### Body Entry

Each field (according to the schema used during creation)

### Field

Field data or empty space, followed by empty space if length is smaller than field length