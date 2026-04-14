export {
    useDB,
    createDB,
    closeDB,
    appendObject,
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
import {readRow, readRowFromPart, readRowPositionFromPart, readAll} from "./read.js";
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
    const alreadyCreated = fs.existsSync(path);
    if (!alreadyCreated) {
        return createDB(path, schema);
    }
    const db =  createDBInterface(path, schema);
    db.fileHandle = await fsPromises.open(path, WRITE_READ);
    return db;
};

const createDB = (path, schema) => {
    return new Promise(async (resolve, reject) => {
        // r for read, a for append w for write will put null everythewhere or shrink the file
        const fileHandle = await fsPromises.open(path, WRITE_READ_CREATE);
        const schemaJSON = JSON.stringify(schema);
        const schemaLength = schemaJSON.length;

        const database = createDBInterface(path, schema);
        database.fileHandle = fileHandle;
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
        await writeBufferAt(fileHandle, firstBuffer, 0)
        resolve(database);
        
    });
};

const createDBInterface = (path, schema) => {
    // todo validate format
    const bodyLength = 0;
    const schemaJSON = JSON.stringify(schema);
    const schemaLength = (schemaJSON.length);
    const headerLength = 14 + schemaLength;

    const objectLength = objectLengthFromSchema(schema);
    return {
        path,
        fileSize: baseFileSize,
        schemaLength,
        headerLength,
        maximumHeaderLength: baseHeaderSize,
        bodyStartPosition: baseHeaderSize,
        bodyLastPosition: baseHeaderSize,
        bodyObjects: 0,
        bodyLength,
        maximumBodyLength: baseFileSize - baseHeaderSize,
        schema,
        objectLength,
        filedescriptor:undefined,
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
        resolve();
        
    })
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
    database.bodyObjects -= 1;
};

const readAllObjects = (database) => {
    return readAll(database);
};

const readFind = async (database, filter) => {
    const all = await readAll(database);
    return all.find(filter);
};
