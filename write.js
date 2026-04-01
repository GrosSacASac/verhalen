export {writeBufferAt, writeRow, writeObject};

import {empty} from "./configuration.js";
import fs from "node:fs";
import fsPromises from "node:fs/promises";

/* there seems to be a problem with wirte appending marks everything with null or resetts the length */
const writeBufferAt = async (fileHandle, buffer, position) => {
	await fileHandle.write(buffer, 0, buffer.length, position)
	
	return position + buffer.length;
};

const writeRow = (schema, filedescriptor, fieldsBuffer, rowPosition) => {
	const position = rowPosition * schema.fieldsLength;
	return writeBufferAt(filedescriptor, fieldsBuffer, position);
};

const writeObject = async (schema, fileHandle, object, bodyPosition) => {
	let objectLength = 0;
	const asString = schema.map(({name, length}) => {
		objectLength += length;
		return object[name].padEnd(length, empty);
	}).join(``);
	const fieldsBuffer = Buffer.from(asString);
	// const position = rowPosition * objectLength;
	return writeBufferAt(fileHandle, fieldsBuffer, bodyPosition);
};
