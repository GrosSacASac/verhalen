export {
    useDB,
    createDB,
    closeDB,
    insertObject,
    appendObject,
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
import {empty, entryBuffer, entryString} from "./configuration.js";
import {uint8ArrayFromString} from "./netzlech.js";
import {
    readAll,
	readRowPositionFromPart,
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
const baseHeaderSize = 200;
const versionSplit = version.split(".").map(Number)

const objectLengthFromSchema = (schema) => {
    return schema.reduce((total, current) => {
        return current.length + total;
    }, 0);
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
        Math.floor(((db.bodyLastPosition - db.maximumHeaderLength) / db.objectLength)) -
        (db.emptyRowPositions.length);
    return db;
};

const createDB = (path, schema) => {
    return new Promise(async (resolve, reject) => {
        // r for read, a for append w for write will put null everythewhere or shrink the file
        const fileHandle = await fsPromises.open(path, WRITE_READ_CREATE);
        const schemaJSON = JSON.stringify(schema);
        const schemaLength = schemaJSON.length;

        const db = createDBInterface(path, schema);
        db.fileHandle = fileHandle;
        const firstBuffer = Uint8Array.of(
            ...uint8ArrayFromString(name),
            ...Uint8Array.from(versionSplit),
            0, // empty byte
            0,
            0, //schema size 2 bytes
            ...uint8ArrayFromString(schemaJSON),
            // last known positions ?
            ...(new Uint8Array(baseFileSize)),
        );

        const int16View = new Uint16Array(firstBuffer);
        int16View[6] = schemaLength;//write at 12th
        await writeBufferAt(fileHandle, firstBuffer, 0);
        db.emptyRowPositions = await readEmptyRowPositions(db);
        db.bodyObjects = 
            Math.floor(((db.bodyLastPosition - db.maximumHeaderLength) / db.objectLength)) -
            (db.emptyRowPositions.length);
        resolve(db);
        
    });
};

const createDBInterface = (path, schema, stats={}) => {
    // todo validate format
    const bodyLength = 0;
    const schemaJSON = JSON.stringify(schema);
    const schemaLength = (schemaJSON.length);
    const headerLength = 14 + schemaLength;

    const objectLength = objectLengthFromSchema(schema);
    return {
        path,
        fileSize: stats.size || baseFileSize,
        schemaLength,
        headerLength,
        maximumHeaderLength: baseHeaderSize,
        bodyStartPosition: baseHeaderSize,
        bodyLastPosition: (stats.size || baseFileSize),
        bodyObjects: 0,
        bodyLength,
        maximumBodyLength: baseFileSize - baseHeaderSize,
        schema,
        objectLength,
        filedescriptor:undefined,
        emptyRowPosition: [],
    };
};

const closeDB = (database) => {
    const {filedescriptor, fileHandle} = database;
    return fileHandle?.close(filedescriptor);
};

const appendObject = (database, object) => {
    const {schema, fileHandle, bodyLastPosition} = database;
    
    return new Promise(async (resolve, reject) => {
        
        const newPosition = await writeObject(database, object);
        database.bodyLastPosition = newPosition;
        database.bodyObjects += 1;
        database.bodyLength += database.objectLength;
        database.fileSize += database.objectLength;
        resolve();
        
    })
};

const insertObject = (database, object) => {
    const position = database.emptyRowPositions.shift();
    database.bodyObjects += 1;
    database.bodyLength += database.objectLength;
    return writeObject(database, object, position + database.maximumHeaderLength);
};

const addObject = (database, object) => {
    // inserts into empty space if possible, otherwise appends
    if (database.emptyRowPositions.length === 0) {
        return appendObject(database, object);
    }
    return insertObject(database, object);
};

const replaceObject = async (database, object, key, value) => {
    const position =  await readRowPositionFromPart(database, key, value)
    if (position === -1) {
        console.warn(`could not replace, it was not found`);
        return;
    }
        
    return writeObject(database, object, position + database.maximumHeaderLength);
};

const deleteObject = async (database, key, value) => {
    const position =  await readRowPositionFromPart(database, key, value)
    if (position === -1) {
        console.warn(`could not delete, it was not found`);
        return;
    }
        
    await writeBlank(database, position + database.maximumHeaderLength);
    database.emptyRowPositions.push(position);
    database.bodyObjects -= 1;
    database.bodyLength -= database.objectLength;
};

const readAllObjects = (database) => {
    return readAll(database);
};

const readFind = async (database, filter) => {
    const all = await readAll(database);
    return all.find(filter);
};
