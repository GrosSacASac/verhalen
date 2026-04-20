export {
	reversePadEmpty,
	objectFromUint8,
	readAll,
	readRowPositionFromCondition,
	readObjectFromCondition,
	readEmptyRowPosition,
	readEmptyRowPositions,
};
	
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import {empty} from "./configuration.js";
import {stringFromUint8Array, uint8ArrayFromString} from "./netzlech.js";
import { deepEqualAdded } from "utilsac/deep.js";


const EMPTY_BYTE = 0;


const reversePadEmpty = (string) => {
		const emptyIndex = string.indexOf(empty);
		if (emptyIndex !== -1) {
			return string.substring(0, emptyIndex)
		}
		return string;
};

const objectFromUint8 = (schema, row) => {
	const rowObject = {};
	let localPosition = 0;
	schema.forEach(({name, length}) => {
		const substring = stringFromUint8Array(row.subarray(localPosition, localPosition + length));
		rowObject[name] = reversePadEmpty(substring);
		localPosition += length;
	});
	return rowObject;
};

const readAll = async (database) => {
	const {schema, objectLength, path, bodyStartPosition, bodyObjects, fileHandle} = database;
	// const fileHandle = await fsPromises.open(path, 'r');
	const readBuffer = new Uint8Array(bodyObjects*objectLength);
	await fileHandle.read(readBuffer,0,bodyObjects*objectLength,bodyStartPosition)
	let position = 0;
	const all=[];
	while (position + objectLength <= readBuffer.byteLength) {
		const row = readBuffer.subarray(position, position + objectLength);
		position += objectLength;
		if (row.every(uint8 => {
			return uint8 === EMPTY_BYTE;
		})) {
			continue; // empty slot
		}
		const rowObject = objectFromUint8(schema, row);
		all.push(rowObject);
	}
	// fileHandle.close();
	return all;
};

const getRowPositionFromCondition = (db, key, condition, readBuffer) => {
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
			// value = value.padEnd(length, empty);
			return true;
		}
		offset += length;
	});
	// const valueAsuint8 = uint8ArrayFromString(value);
	// const valueLengthBytes = (valueAsuint8.length);
	
	if (!found) {
		console.error(`part ${part} not found in schema ${JSON.stringify(schema)}`);
		return -1;
	}

	while (cursor < readBuffer.length) {
		const candidate = readBuffer.subarray(cursor, cursor + partLength);
		const asString = reversePadEmpty(stringFromUint8Array(candidate));
		// if (deepEqualAdded(valueAsuint8, candidate)) {
		if (condition(asString)) {
			cursor -= offset;
			return cursor;
		}
		cursor += objectLength;
	}
	return -1;
};

const getEmptyRowPosition = (db, readBuffer) => {
	const {objectLength} = db;
	let cursor = 0;

	while (cursor < readBuffer.length) {
		const candidate = readBuffer.subarray(cursor, cursor + objectLength);
		if (candidate.every(uint8 => {
			return uint8 === EMPTY_BYTE;
		})) {
			return cursor;
		}
		cursor += objectLength;
	}
	return -1;
};

const getEmptyRowPositions = (db, readBuffer) => {
	// todo can we deduplicate logic with getEmptyRowPosition
	const positions = [];
	const {objectLength} = db;
	let cursor = 0;

	while (cursor < readBuffer.length) {
		const candidate = readBuffer.subarray(cursor, cursor + objectLength);
		if (candidate.every(uint8 => {
			return uint8 === EMPTY_BYTE;
		})) {
			positions.push(cursor);
		}
		cursor += objectLength;
	}
	return positions;
};

const readRowPositionFromCondition = async(db, key, value) => {
	const {path, bodyObjects, objectLength,maximumHeaderLength, fileHandle} = db;
	const readBuffer = new Uint8Array(bodyObjects*objectLength);
	await fileHandle.read(readBuffer,0,bodyObjects*objectLength,maximumHeaderLength)
	return getRowPositionFromCondition(db, key, value, readBuffer);
};

const readEmptyRowPosition = async(db) => {
	const {path, bodyObjects, objectLength,maximumHeaderLength, fileHandle} = db;
	const readBuffer = new Uint8Array(db.fileSize-maximumHeaderLength);
	await fileHandle.read(readBuffer,0,db.fileSize-maximumHeaderLength,maximumHeaderLength)
	return getEmptyRowPosition(db, readBuffer);
};

const readEmptyRowPositions = async(db) => {
	const {path, bodyObjects, objectLength,maximumHeaderLength, fileHandle} = db;
	const readBuffer = new Uint8Array(db.fileSize-maximumHeaderLength);
	await fileHandle.read(readBuffer,0,db.fileSize-maximumHeaderLength,maximumHeaderLength)
	return getEmptyRowPositions(db, readBuffer);
};


const readObjectFromCondition = async(db, key, condition) => {
	const {bodyObjects, objectLength,maximumHeaderLength, fileHandle, schema} = db;
	const readBuffer = new Uint8Array(bodyObjects*objectLength);
	await fileHandle.read(readBuffer,0,bodyObjects*objectLength,maximumHeaderLength)
	const position = getRowPositionFromCondition(db, key, condition, readBuffer);
	const objectBuffer = readBuffer.subarray(position, position + objectLength);
	return objectFromUint8(schema, objectBuffer);
};
