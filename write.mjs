export {writeBufferAt, writeRow, writeObject};

import {empty} from "./configuration.mjs";
import fs from "fs";

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

const writeObject = (schema, filedescriptor, object, rowPosition, updateEndPosition) => {
	const position = rowPosition * schema.fieldsLength;
	const asString = schema.fields.map(({name, length}) => {
		const string = object[name].padEnd(length, empty);
	}).join(``);
	const fieldsBuffer = Buffer.from(asString);
	writeBufferAt(filedescriptor, fieldsBuffer, position, updateEndPosition);
};
