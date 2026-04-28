export {writeBufferAt, writeBlank, writeObject,

	uint8ArrayFromObject,
};

import {empty} from "./configuration.js";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { uint8ArrayFromString } from "./netzlech.js";


const uint8ArrayFromObject = (schema, objectLength, object) => {
	const uint8Array = new Uint8Array(objectLength);
	let cursor = 0;
	schema.forEach(({name, length, type}) => {
		let subUint8Array;
		if (type === "string") {
			subUint8Array = uint8ArrayFromString(object[name].padEnd(length, empty));
		} else if (type === "Uint8") {
			subUint8Array = new Uint8Array(1);
			subUint8Array[0] = object[name];
		} else if (type === "Uint32") {
			// Number is 1 JS Float64Array 
			subUint8Array = new Uint8Array(4);
			const uint32Array = new Uint32Array(subUint8Array.buffer);
			uint32Array[0] = object[name];
		} else if (type === "Number") {
			// Number is 1 JS Float64Array 
			subUint8Array = new Uint8Array(8);
			const float64Array = new Float64Array(subUint8Array.buffer);
			float64Array[0] = object[name];
		}
		uint8Array.set(subUint8Array, cursor);
		cursor += length;
	});
	return uint8Array;
	

};
/* there seems to be a problem with wirte appending marks everything with null or resetts the length */
const writeBufferAt = async (fileHandle, buffer, position) => {
	await fileHandle.write(buffer, 0, buffer.length, position)
	
	return position + buffer.length;
};


const writeObject = async (database, object, position = database.bodyLastPosition) => {
	const {schema, objectLength} = database;
	
	const fieldsBuffer = uint8ArrayFromObject(schema, objectLength, object);
	// const position = rowPosition * objectLength;
	return writeBufferAt(database.fileHandle, fieldsBuffer, position);
};

// effectively deletes
const writeBlank = (database, position = database.bodyLastPosition) => {
	return writeBufferAt(
		database.fileHandle,
		uint8ArrayFromString("".padEnd(database.objectLength, empty)),
		position
	);
};
