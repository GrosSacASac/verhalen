export {stringFromBufferWithEmptySpace,
	readRow, readRowFromPart, readRowPositionFromPart,
	readAll/*, readRowRaw*/};
	
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import {empty} from "./configuration.js";
import {stringFromUint8Array, uint8ArrayFromString} from "./netzlech.js";
import { deepEqualAdded } from "utilsac/deep.js";


const extractStringFromStringWithEmptySpace = (string) => {
        const indexOfNull = string.indexOf(empty);
		let originalString;
		if (indexOfNull !== -1) {
			originalString = string.substring(0, indexOfNull);
		} else {
			originalString = string;
		}
        return originalString;
};

const stringFromBufferWithEmptySpace = (buffer) => {
	const string = String(buffer);
	return extractStringFromStringWithEmptySpace(string);
};

const rowFromBuffer = (schema, readBuffer) => {
	let cursor = 0;
	const row = {};
	schema.fields.forEach(({name, length}) => {
		const end = cursor + length;
		const subBuffer = readBuffer.subarray(cursor, end);
		const string = String(subBuffer);
		const indexOfNull = string.indexOf(empty);
		let originalString;
		if (indexOfNull !== -1) {
			originalString = string.substring(0, indexOfNull);
		} else {
			originalString = string;
		}
		row[name] = originalString;
		cursor = end;
	});
	//console.log(row);
};

const readRowRaw = (filedescriptor, position, callBack) => {
	/*todo make sure we read inside the file only*/
	// search what is allocUnsafeSlow
	const readBuffer = Buffer.allocUnsafeSlow(schema.fieldsLength);
	fs.read(filedescriptor, readBuffer, 0, schema.fieldsLength, position, (error, bytesRead, _) => {
		if (error) {
			console.error(error);
			return;
		}
		callBack(readBuffer)
	});
};

const readRow = (schema, filedescriptor, rowPosition) => {
	const position = rowPosition * schema.fieldsLength;
	readRowRaw(filedescriptor, rowPosition, rowFromBuffer.bind(undefined, schema));
};

const readAll = async (schema, objectLength, path, bodyStartPosition, bodyLastPosition, bodyObjects) => {
	const fileHandle = await fsPromises.open(path, 'r');
	const readBuffer = new Uint8Array(bodyObjects*objectLength);
	await fileHandle.read(readBuffer,0,bodyObjects*objectLength,bodyStartPosition)
	let position = 0;
	const all=[];
	while (position + objectLength <= readBuffer.byteLength) {
		let row; /* = new Uint8Array(objectLength); */
		row = readBuffer.subarray(position, position + objectLength);
		const rowObject = {};
		let localPosition = 0;
		schema.forEach(({name, length}) => {
			let substring = stringFromUint8Array(row.subarray(localPosition, localPosition + length));
			const emptyIndex = substring.indexOf(empty);
			if (emptyIndex !== -1) {
				substring = substring.substring(0, emptyIndex)
			}
			rowObject[name] = substring;
			localPosition += length;

		});
		all.push(rowObject);
		position += objectLength;
	}
	fileHandle.close();
	return all;
}



const getRowPositionFromPart = (db, key, value, readBuffer) => {
	/* given a schema,
    reads all rows with
    until it finds a row which has a part strictly equal to value
	then gives back that row
    or -1 if not found
    */
	const {schema, objectLength} = db;
	let offset = 0
	let cursor;
	let partLength = 0;
    
	const found = schema.some(({name, length}) => {
		if (name === key) {
			partLength = length;
            cursor = offset;
			value = value.padEnd(length, empty)
			return true;
		}
		offset += length;
	});
	const valueAsuint8 = uint8ArrayFromString(value);
	const valueLengthBytes = (valueAsuint8.length);
	
	if (!found) {
		console.error(`part ${part} not found in schema ${JSON.stringify(schema)}`);
		return -1;
	}

	while (cursor < readBuffer.length) {
		const candidate = readBuffer.subarray(cursor, cursor + valueLengthBytes);
		if (deepEqualAdded(valueAsuint8, candidate)) {
			cursor -= offset;
			return cursor;
		}
		cursor += objectLength;
	}
	return -1;
};

const readRowPositionFromPart = async(db, key, value) => {
	const {path, bodyObjects, objectLength,maximumHeaderLength, fileHandle} = db;
	// const fileHandle = await fsPromises.open(path, 'r');
	const readBuffer = new Uint8Array(bodyObjects*objectLength);
	await fileHandle.read(readBuffer,0,bodyObjects*objectLength,maximumHeaderLength)
	// fileHandle.close();
	return getRowPositionFromPart(db, key, value, readBuffer);

};

const readRowFromPart = (schema, filedescriptor, endPosition, part, value) => {
	const readBuffer = Buffer.allocUnsafeSlow(endPosition);
	fs.read(filedescriptor, readBuffer, 0, endPosition, 0, (error, bytesRead, _) => {
		if (error) {
			console.error(error);
			return;
		}
		
		const start = getRowPositionFromPart(schema, endPosition, part, value, readBuffer);
		if (start === -1) {
			console.error(`${part} not found`);
			return;
		}
		const end = start + schema.fieldsLength;
		rowFromBuffer(schema, readBuffer.subarray(start, end));
	});
};
