export {writeBufferAt, writeBlank, writeObject};

import {empty} from "./configuration.js";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { uint8ArrayFromString } from "./netzlech.js";

/* there seems to be a problem with wirte appending marks everything with null or resetts the length */
const writeBufferAt = async (fileHandle, buffer, position) => {
	await fileHandle.write(buffer, 0, buffer.length, position)
	
	return position + buffer.length;
};


const writeObject = async (database, object, position = database.bodyLastPosition) => {
	const asString = database.schema.map(({name, length}) => {
		return object[name].padEnd(length, empty);
	}).join(``);
	const fieldsBuffer = uint8ArrayFromString(asString);
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
