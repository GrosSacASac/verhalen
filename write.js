export {writeBufferAt, writeRow, writeObject};

import {empty} from "./configuration.js";
import fs from "node:fs";

/* there seems to be a problem with wirte appending marks everything with null or resetts the length */
const writeBufferAt = (filedescriptor, buffer, position, updateEndPosition) => {
	console.log({position});
	fs.write(filedescriptor, buffer, 0, buffer.length, position, (error, bytesWritten, bufferWritten) => {
		if (error) {
			throw error;
			console.error(error);
			return;
		}
		updateEndPosition(position + buffer.length)
	});
};

const writeRow = (schema, filedescriptor, fieldsBuffer, rowPosition, updateEndPosition) => {
	const position = rowPosition * schema.fieldsLength;
	writeBufferAt(filedescriptor, fieldsBuffer, position, updateEndPosition);
};

const writeObject = (schema, filedescriptor, object, bodyPosition, updateEndPosition) => {
	let objectLength = 0;
	const asString = schema.map(({name, length}) => {
		objectLength += length;
		return object[name].padEnd(length, empty);
	}).join(``);
	const fieldsBuffer = Buffer.from(asString);
	// const position = rowPosition * objectLength;
	writeBufferAt(filedescriptor, fieldsBuffer, bodyPosition, updateEndPosition);
};
