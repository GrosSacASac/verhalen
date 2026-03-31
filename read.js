export {stringFromBufferWithEmptySpace,
	readRow, readRowFromPart, readRowPositionFromPart,
	readAll/*, readRowRaw*/};
	
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import {empty} from "./configuration.js";


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

const readAll = async (schema, path, bodyStartPosition) => {
	const fileHandle = await fsPromises.open(path, 'r');
	const readBuffer = Buffer.allocUnsafe(1000);
	await fileHandle.read(readBuffer,0,1000,bodyStartPosition)
	let objectLength = 0;
	schema.map(({name, length}) => {
		objectLength += length;
	});
	let position = 0;
	const all=[];
	while (position + objectLength <= readBuffer.byteLength) {
		const row = Buffer.allocUnsafe(objectLength);
		row = readBuffer.substring(position, position + objectLength);
		const rowObject = {};
		let localPosition = 0;
		schema.forEach(({name, length}) => {
			let substring = row.substring(localPosition, localPosition + length);
			const emptyIndex = substring.indexOf(empty);
			if (emptyIndex !== -1) {
				substring = substring.substring(0, emptyIndex)
			}
			rowObject[name] = substring;

		});
	} 
	return all;
}



const getRowPositionFromPart = (schema, endPosition, part, value, readBuffer) => {
	/* given a schema,
    reads all rows with
    until it finds a row which has a part strictly equal to value
	then gives back that row
    or -1 if not found
    */
    const valueLengthBytes = Buffer.byteLength(value);
	let offset = 0
	let cursor;
	let partLength = 0;
    
	const found = schema.fields.some(({name, length}) => {
		if (name === part) {
			partLength = length;
            cursor = offset;
			return true;
		}
		offset += length;
	});
	
	if (!found) {
		console.error(`part ${part} not found in schema ${JSON.stringify(schema)}`);
		return;
	}
	while (cursor < endPosition) {
		const buffer = readBuffer.subarray(cursor, cursor + valueLengthBytes);
		const string  = String(buffer);
		if (string === value) {
			cursor -= offset;
			return cursor;
		}
		cursor += schema.fieldsLength;
	}
	return -1;
};

const readRowPositionFromPart = (schema, filedescriptor, endPosition, part, value, callBack) => {
	const readBuffer = Buffer.allocUnsafeSlow(endPosition);
	fs.read(filedescriptor, readBuffer, 0, endPosition, 0, (error, bytesRead, _) => {
		if (error) {
			console.error(error);
			return;
		}	
		callBack(getRowPositionFromPart(schema, endPosition, part, value, readBuffer));
	});
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
