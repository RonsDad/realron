"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const semver = require("semver");
const versionResolver_1 = require("./versionResolver");
const util_1 = require("../helper/util");
function readPkgs(depends) {
    if (!depends) {
        return Promise.resolve([]);
    }
    return versionResolver_1.fetchPkgs(depends).then(data => {
        return data.map(d => ({
            name: d.name,
            version: depends[d.name],
            latestVersion: latestVersion(d, depends[d.name])
        }));
    });
}
exports.readPkgs = readPkgs;
function writePkgs(raw, pkgs) {
    const LINE_BREAK = raw.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
    const rawPackageDoc = raw.document;
    const rawPackageText = raw.document.getText().split(LINE_BREAK);
    const targetPackageText = rawPackageText.map(line => {
        const found = isDependencyLine(line, pkgs);
        if (!found) {
            return line;
        }
        return line.replace(util_1.version(found.version), found.latestVersion);
    });
    return raw
        .edit((editBuilder) => {
        editBuilder.replace(new vscode.Range(rawPackageDoc.positionAt(0), rawPackageDoc.positionAt(raw.document.getText().length)), targetPackageText.join(LINE_BREAK));
    })
        .then(result => {
        if (!result) {
            return false;
        }
        return rawPackageDoc.save();
    });
}
exports.writePkgs = writePkgs;
function isDependencyLine(line, pkgs) {
    return pkgs.find(p => line.includes(`"${p.name}"`) && line.includes(`${p.version}`));
}
function latestVersion(pkg, fallback) {
    if (util_1.isLatest()) {
        if (pkg.version) {
            return pkg.version;
        }
        if (pkg['dist-tags'] && pkg['dist-tags'].latest) {
            return pkg['dist-tags'].latest;
        }
        return util_1.version(fallback);
    }
    if (!pkg.versions) {
        return util_1.version(fallback);
    }
    return semver.maxSatisfying(Object.keys(pkg.versions), fallback);
}
//# sourceMappingURL=pkgManager.js.map