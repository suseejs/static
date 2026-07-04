const fs = require("fs");
const path = require("path");
/**
 * Retrieves a list of file paths matching the specified pattern.
 *
 * @param {string} pattern A glob pattern string to match file paths.
 * @param {boolean} [warning]  A boolean indicating whether to suppress warning listeners.
 * @returns {string[]} An array of strings representing the file paths that match the pattern.
 */
const globPattern = (pattern, warning = false) => {
    const files = fs.globSync(pattern);
    if (!warning) process.removeAllListeners("warning");
    return files;
};

/**
 * @param {string} path
 * @returns {boolean}
 */
const isFile = (path) => fs.statSync(path).isFile();

/**
 * Creates a glob pattern string from the given directory path and optional
 * file extensions. When no extensions are given, the pattern will match all
 * files in the given directory and all its subdirectories.
 *
 * @param {string} dirPath - A string representing the directory path.
 * @param {string[]} [ext] - An optional string array of file extensions.
 * @returns {string} A string representing the glob pattern.
 */
const createPattern = (dirPath, ext) => {
    let pattern = "";
    if (!ext) {
        pattern = `${dirPath}/**/*`;
    } else if (ext.length === 1) {
        const ex = ext.join();
        pattern = `${dirPath}/**/*.${ex}`;
    } else {
        const ex = `{${ext.join(",")}}`;
        pattern = `${dirPath}/**/*.${ex}`;
    }
    return pattern;
};

/**
 * Creates an array of ignored paths from the given array and a set of
 * default ignored paths.
 *
 * @param {string[]} [ignore] - An optional string array of paths to ignore.
 * @returns {string[]} An array of strings representing the ignored paths without
 * duplicates.
 */
const createIgnores = (ignore) => {
    /** @type {string[]} */
    let igns = [];
    const ign = [
        "node_modules",
        "tsconfig.json",
        "README.md",
        "package.json",
        "package-lock.json",
        "LICENSE",
    ];
    if (ignore) {
        igns = [...ignore, ...ign];
    } else {
        igns = ign;
    }
    return [...new Set(igns)];
};

/**
 * Filters out files that are located in directories specified in the ignore set.
 *
 * @param {string[]} files - An array of file paths as strings to filter.
 * @param {Set<string>} ignsSet - A set of directory names or file paths to ignore.
 * @returns {string[]} An array of file paths that are not in ignored directories and are valid files.
 */
const filterFiles = (files, ignsSet) => {
    const fls = files.filter((file) => {
        const sgs = file.split(path.sep);
        return !sgs.some((sg) => ignsSet.has(sg));
    });
    return fls.filter(isFile);
};

/**
 * Retrieves a list of file paths in the given directory and subdirectories that
 * match the given file extensions and are not in directories to ignore.
 *
 * @param {string} [staticDir] - A string representing the directory path to search for files.
 * @param {string[]} [fileExt] - An optional string array of file extensions to match.
 * @param {boolean} [warning] - A boolean indicating whether to suppress warning listeners.
 * @param {string[]} [ignore] - An optional string array of directory names or file paths to ignore.
 * @returns An array of strings representing the file paths that match the pattern.
 */
exports.getFiles = (
    staticDir = ".",
    fileExt,
    warning = false,
    ignore,
) => {
    const cwd = process.cwd();
    const dirPath = path.join(cwd, staticDir);
    const pattern = createPattern(dirPath, fileExt);
    const _fls = globPattern(pattern, warning);
    const ignsSet = new Set(createIgnores(ignore));
    return filterFiles(_fls, ignsSet);
};