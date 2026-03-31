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
const {version} = packageJson;
import {empty, entryBuffer, entryString} from "./configuration.js";
import {readRow, readRowFromPart, readRowPositionFromPart, readAll} from "./read.js";
import {writeObject, writeBufferAt} from "./write.js";

const startPositionFile = 0;
const baseFileSize = 2000;
const baseHeaderSize = 200;

const useDB = (path, schema) => {
    const alreadyCreated = fs.existsSync(path);
    if (!alreadyCreated) {
        return createDB(path, schema);
    }
    
    // todo validate format
    const fileLength = fs.statSync(path).size
    const headerLength = 1000;
    const length = fileLength - headerLength;
    
    return new Promise((resolve, reject) => {
        // r for read, a for append w for write will put null everythewhere or shrink the file
        fs.open(path, `a`, (error,  newFiledescriptor) => {
            if (error) {
                console.error(error);
                reject(error);
                return;
            }
            const filedescriptor = newFiledescriptor;
            const dataBase = {
                fileLength,
                headerLength,
                length,
                schema,
                filedescriptor
            };
        });
    });
};

const createDB = (path, schema) => {
    // todo validate format
    let fileLength;
    try {
        fileLength = fs.statSync(path).size
    } catch {

    }
    
    const bodyLength = 0;
    // const length = fileLength - headerLength;
    
    return new Promise((resolve, reject) => {
        // r for read, a for append w for write will put null everythewhere or shrink the file
        fs.open(path, `a`, (error,  newFiledescriptor) => {
            if (error) {
                console.error(error);
                reject(error);
                return;
            }
            const filedescriptor = newFiledescriptor;
            const schemaJSON = JSON.stringify(schema);
            const headerLength = Buffer.byteLength(schemaJSON);
            const dataBase = {
                path,
                fileSize: baseFileSize,
                headerLength,
                maximumHeaderLength: baseHeaderSize,
                bodyStartPosition: baseHeaderSize,
                bodyLastPosition: baseHeaderSize,
                bodyLength,
                maximumBodyLength: baseFileSize - baseHeaderSize,
                schema,
                filedescriptor
            };
            const firstBuffer = Buffer.concat([
                Buffer.from(schemaJSON),
                Buffer.from({length: baseFileSize - dataBase.maximumBodyLength})
            ]);
            writeBufferAt(filedescriptor, firstBuffer, 0, () => {
                resolve(dataBase);
            })
        });
    });
};

const closeDB = (dataBase) => {
    const {filedescriptor} = dataBase;
    return fsPromises.close(filedescriptor);
};

const createSchema = (schema) => {
    schema.version = version;
    schema.fieldsLength = schema.fields.reduce((total, current) => {
        return current.length + total;
    }, 0);
    return schema;
};

const appendObject = (dataBase, object) => {
    const {schema, filedescriptor, bodyLastPosition} = dataBase;
    
    return new Promise((resolve, reject) => {

        writeObject(schema, filedescriptor, object, bodyLastPosition, (newPosition) => {
            dataBase.bodyLastPosition = newPosition;
            resolve();
        });
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
    return readAll(schema, path, dataBase.bodyStartPosition);
};


const readFind = async (dataBase, filter) => {
    const all = await readAll(dataBase);
    return all.find(filter);
};