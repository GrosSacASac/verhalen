export {
    useDB,
    createDB,
    closeDB,
    addObject,
    replaceObject,
    deleteObject,
    readAllObjects,
    readFind,
};

import fs from "node:fs";
import fsPromises from "node:fs/promises";
import packageJson from "./package.json" with { type: 'json' };
const {version, name} = packageJson;
import {uint8ArrayFromString} from "./netzlech.js";
import {
    readAll,
	readRowPositionFromCondition,
    readObjectFromCondition,
	readEmptyRowPosition,
    readEmptyRowPositions,
} from "./read.js";
import {writeObject, writeBufferAt, writeBlank} from "./write.js";


const WRITE = "w";
const WRITE_READ = "r+";
const WRITE_READ_CREATE = "w+";
const READ = "r";
const APPEND = "a";

const startPositionFile = 0;
const baseFileSize = 2000;
const baseHeaderSize = 800;
const versionSplit = version.split(".").map(Number)


const objectLengthFromSchema = (schema) => {
    return schema.reduce((total, current) => {
        return current.length + total;
    }, 0);
};

const defaultSchema = (schema) => {
    return schema.map(({name, length=1, type="string"}) => {
        if (type==="Uint32") {
            length = 4;
        } else if (type==="Number") {
            length = 8;
        }
        return {name, length, type};
    });
};

const useDB = async(path, schema) => {
    let stats;
    try {
        stats = fs.statSync(path);
    } catch (statsError) {
        if (statsError.code !== "ENOENT") {
            // unexpected error
            throw statsError;
        }
    }
    const alreadyCreated = Boolean(stats);
    if (!alreadyCreated) {
        return createDB(path, schema);
    }
    const db =  createDBInterface(path, schema, stats);
    db.fileHandle = await fsPromises.open(path, WRITE_READ);
    db.emptyRowPositions = await readEmptyRowPositions(db);
    db.bodyObjects = 
        Math.ceil(((db.bodyLastPosition - db.maximumHeaderLength) / db.objectLength)) -
        (db.emptyRowPositions.length);
    return db;
};

const createDB = (path, schema) => {
    return new Promise(async (resolve, reject) => {
        // r for read, a for append w for write will put null everythewhere or shrink the file
        const fileHandle = await fsPromises.open(path, WRITE_READ_CREATE);

        const db = createDBInterface(path, schema);
        db.fileHandle = fileHandle;
        const firstBuffer = Uint8Array.of(
            ...uint8ArrayFromString(name),
            ...Uint8Array.from(versionSplit),
            0, // empty byte
            0,
            0, //schema size 2 bytes
            ...uint8ArrayFromString(db.schemaJSON),
            // last known positions ?
            ...(new Uint8Array(baseFileSize)),
        );

        //todo: do we need it ? if yes fix RangeError: byte length of Uint16Array should be a multiple of 2 which can happen depending of the size of firstBuffer
        // const int16View = new Uint16Array(firstBuffer.buffer);
        // int16View[6] = db.schemaLength;//write at 12th
        await writeBufferAt(fileHandle, firstBuffer, 0);
        db.emptyRowPositions = await readEmptyRowPositions(db);
        db.bodyObjects = 
            Math.ceil(((db.bodyLastPosition - db.maximumHeaderLength) / db.objectLength)) -
            (db.emptyRowPositions.length);
        resolve(db);
        
    });
};

const createDBInterface = (path, schema, stats={}) => {
    // todo validate format
    const bodyLength = 0;
    const schemaClean = defaultSchema(schema);
    const schemaJSON = JSON.stringify(schemaClean);
    const schemaLength = (schemaJSON.length);
    const headerLength = 14 + schemaLength;

    const objectLength = objectLengthFromSchema(schemaClean);
    return {
        path,
        fileSize: stats.size || baseFileSize,
        schemaLength,
        schemaJSON,
        headerLength,
        maximumHeaderLength: baseHeaderSize,
        bodyStartPosition: baseHeaderSize,
        bodyLastPosition: (stats.size || baseFileSize),
        bodyObjects: 0,
        bodyLength,
        maximumBodyLength: baseFileSize - baseHeaderSize,
        schema: schemaClean,
        objectLength,
        filedescriptor:undefined,
        emptyRowPosition: [],
        readLock: Promise.resolve(),
        writeLock: Promise.resolve(),
    };
};

const closeDB = (database) => {
    const {filedescriptor, fileHandle} = database;
    return fileHandle?.close(filedescriptor);
};

/**
 * waits for previous read and write operations
 * register itself as an ongoing write operation
 * uses promise chaining 
 */
const wLock = (writeBasedFunction) => async (db, ...args) => {
    const {promise: thisLock, resolve} = Promise.withResolvers();
    const previousWriteLock = db.writeLock;
    db.writeLock = thisLock;
    await Promise.allSettled([db.readLock, previousWriteLock]); // wait for previous read and write
    const writePromise = writeBasedFunction(db, ...args);
    await writePromise;
    resolve();
    return await writeBasedFunction;
};

const rLock = (readBasedFunction) => async (db, ...args) => {
    const {promise: thisLock, resolve} = Promise.withResolvers();
    db.readLock = thisLock;
    await db.writeLock; // wait for previous write
    const readPromise = readBasedFunction(db, ...args);
    await readPromise;
    resolve();
    return await readPromise;
};

const appendObject = async (database, object) => {
    const {schema, fileHandle, bodyLastPosition} = database;
    const newPosition = await writeObject(database, object);;
    database.bodyLastPosition = newPosition;
    database.bodyObjects += 1;
    database.bodyLength += database.objectLength;
    database.fileSize += database.objectLength;
};

const insertObject = (database, object) => {
    const position = database.emptyRowPositions.shift();
    database.bodyObjects += 1;
    database.bodyLength += database.objectLength;
    return writeObject(database, object, position + database.maximumHeaderLength);
};

const addObject = wLock((database, object) => {
    // inserts into empty space if possible, otherwise appends
    if (database.emptyRowPositions.length === 0) {
        return appendObject(database, object);
    }
    return insertObject(database, object);
});

const replaceObject = wLock(async (database, object, key, condition) => {
    const position =  await readRowPositionFromCondition(database, key, condition)
    if (position === -1) {
        console.warn(`could not replace, it was not found`);
        return;
    }
        
    return writeObject(database, object, position + database.maximumHeaderLength);
});

const deleteObject = wLock(async (database, key, condition) => {
    const position =  await readRowPositionFromCondition(database, key, condition)
    if (position === -1) {
        console.warn(`could not delete, it was not found`);
        return;
    }
        
    await writeBlank(database, position + database.maximumHeaderLength);
    database.emptyRowPositions.push(position);
    database.bodyObjects -= 1;
    database.bodyLength -= database.objectLength;
});

const readAllObjects = rLock((database) => {
    return readAll(database);
});

const readFind = rLock((database, key, condition) => {
    return readObjectFromCondition(database, key, condition);
});
