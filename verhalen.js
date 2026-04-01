export {
    useDB,
    createDB,
    closeDB,
    appendObject,
    replaceObject,
    createSchema,
    readAllObjects,
    readFind,
};

/*use readRowPositionFromPart with writeObject to make high level replace function
*/
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import packageJson from "./package.json" with { type: 'json' };
const {version, name} = packageJson;
import {empty, entryBuffer, entryString} from "./configuration.js";
import {readRow, readRowFromPart, readRowPositionFromPart, readAll} from "./read.js";
import {writeObject, writeBufferAt} from "./write.js";

const startPositionFile = 0;
const baseFileSize = 2000;
const baseHeaderSize = 200;
const versionSplit = version.split(".").map(Number)

const useDB = async(path, schema) => {
    const alreadyCreated = fs.existsSync(path);
    if (!alreadyCreated) {
        return createDB(path, schema);
    }
    const db =  createDBInterface(path, schema);
    db.fileHandle = await fsPromises.open(path, 'a');
    return db;
    
};

const createDB = (path, schema) => {
    return new Promise(async (resolve, reject) => {
        // r for read, a for append w for write will put null everythewhere or shrink the file
        const fileHandle = await fsPromises.open(path, 'w');
        const schemaJSON = JSON.stringify(schema);
        const schemaLength = schemaJSON.length;

        const dataBase = createDBInterface(path, schema);
        dataBase.fileHandle = fileHandle;
        const firstBuffer = Buffer.concat([
            Buffer.from(name),
            Uint8Array.from(versionSplit),
            //schema size todo
            Buffer.from(schemaJSON),
            // last known positions ?
            new Uint8Array(baseFileSize),
        ]);
        await writeBufferAt(fileHandle, firstBuffer, 0)
        resolve(dataBase);
        
    });
};

const createDBInterface = (path, schema) => {
    // todo validate format
    const bodyLength = 0;
    const schemaJSON = JSON.stringify(schema);
    const headerLength = Buffer.byteLength(schemaJSON);

    let objectLength = 0;
    schema.map(({name, length}) => {
        objectLength += length;
    });
    return {
        path,
        fileSize: baseFileSize,
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
}

const closeDB = (dataBase) => {
    const {filedescriptor, fileHandle} = dataBase;
    return fileHandle?.close(filedescriptor);
};

const createSchema = (schema) => {
    schema.version = version;
    schema.fieldsLength = schema.fields.reduce((total, current) => {
        return current.length + total;
    }, 0);
    return schema;
};

const appendObject = (dataBase, object) => {
    const {schema, fileHandle, bodyLastPosition} = dataBase;
    
    return new Promise(async (resolve, reject) => {

        const newPosition = await writeObject(schema, fileHandle, object, bodyLastPosition);
        dataBase.bodyLastPosition = newPosition;
        dataBase.bodyObjects += 1;
        dataBase.bodyLength += dataBase.objectLength;
        resolve();
        
    })
};

const replaceObject = (dataBase, object) => {
    const {schema, filedescriptor, bodyLastPosition} = dataBase;
    readRowPositionFromPart(schema, filedescriptor, endPosition, part, value, (position) => {
        if (position === -1) {
            console.warn(`could not replace, it was not found`);
            return;
        }
        
        writeObject(schema, filedescriptor, object, position, (newPosition) => {
            // success
        });
    });
};


const addFields = (filedescriptor, fieldsBuffer, updateEndPosition) => {
    writeBufferAt(filedescriptor, fieldsBuffer, endPosition, updateEndPosition);
};

const readAllObjects = (dataBase) => {
    const {schema, path} = dataBase;
    return readAll(schema, dataBase.objectLength, path, dataBase.bodyStartPosition, dataBase.bodyLastPosition, dataBase.bodyObjects);
};


const readFind = async (dataBase, filter) => {
    const all = await readAll(dataBase);
    return all.find(filter);
};