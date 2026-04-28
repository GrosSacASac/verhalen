import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import red from "eslint-config-red";


export default defineConfig([
    
	{
		files: ["**/*.js"],
		plugins: {},
		rules: {},
        extends: [
            js.configs.recommended,
            red,
        ]
	},
]);
