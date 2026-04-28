import fsPromises from "node:fs/promises";


export async function globalSetup() {
  globalThis.testDatabase = `./tests/end_to_end/veralen_test.verhalen`;
}

export async function globalTeardown() {
    
}
