import { createRequire } from "module";
const require = createRequire(import.meta.url);

const static = require("./index.js");

export default static;