import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import red from "eslint-config-red";
import globals from "globals";


export default defineConfig([
    
	{
		files: [`**/*.js`],
        languageOptions: { globals: globals.browser },
		plugins: {},
		rules: {},
        extends: [
            js.configs.recommended,
            red,
        ],
	},
]);
