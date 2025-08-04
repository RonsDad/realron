"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var path = __toESM(require("path"));
var import_node = require("vscode-languageserver/node");
var import_vscode_languageserver_textdocument = require("vscode-languageserver-textdocument");
var htmlhint = __toESM(require("htmlhint"));
var import_vscode_uri = require("vscode-uri");
var fs = require("fs");
var stripJsonComments = require("strip-json-comments");
var settings = null;
var linter = null;
var htmlhintrcOptions = {};
function makeDiagnostic(problem, document) {
  var _a;
  const lines = document.getText().split("\n");
  const col = problem.col - 1;
  const endCol = problem.col + (((_a = problem.raw) == null ? void 0 : _a.length) || 0) - 1;
  const range = {
    start: { line: problem.line - 1, character: col },
    end: { line: problem.line - 1, character: endCol }
  };
  return {
    range,
    message: problem.message,
    severity: import_node.DiagnosticSeverity.Warning,
    source: "htmlhint",
    code: problem.rule.id,
    data: {
      ruleId: problem.rule.id,
      href: `https://htmlhint.com/rules/${problem.rule.id}/`,
      raw: problem.raw,
      line: problem.line,
      col: problem.col
    }
  };
}
function getConfiguration(filePath) {
  let options;
  trace(`[HTMLHint Debug] Getting configuration for file: ${filePath}`);
  trace(`[HTMLHint Debug] Current settings: ${JSON.stringify(settings)}`);
  if (settings == null ? void 0 : settings.htmlhint) {
    if (settings.htmlhint.configFile && settings.htmlhint.options && Object.keys(settings.htmlhint.options).length > 0) {
      throw new Error(
        `The configuration settings for HTMLHint are invalid. Please specify either 'htmlhint.configFile' or 'htmlhint.options', but not both.`
      );
    }
    if (settings.htmlhint.configFile) {
      if (fs.existsSync(settings.htmlhint.configFile)) {
        options = loadConfigurationFile(settings.htmlhint.configFile);
        trace(
          `[HTMLHint Debug] Using configFile setting: ${settings.htmlhint.configFile}`
        );
      } else {
        const configFileHint = !path.isAbsolute(settings.htmlhint.configFile) ? ` (resolves to '${path.resolve(settings.htmlhint.configFile)}')` : "";
        throw new Error(
          `The configuration settings for HTMLHint are invalid. The file '${settings.htmlhint.configFile}'${configFileHint} specified in 'htmlhint.configFile' could not be found.`
        );
      }
    } else if (settings.htmlhint.options && Object.keys(settings.htmlhint.options).length > 0) {
      options = settings.htmlhint.options;
      trace(
        `[HTMLHint Debug] Using options setting: ${JSON.stringify(settings.htmlhint.options)}`
      );
    } else if (settings.htmlhint && settings.htmlhint.optionsFile) {
      if (fs.existsSync(settings.htmlhint.optionsFile)) {
        options = loadConfigurationFile(settings.htmlhint.optionsFile);
        trace(
          `[HTMLHint Debug] Using optionsFile setting: ${settings.htmlhint.optionsFile}`
        );
      } else {
        trace(
          `[HTMLHint Debug] optionsFile does not exist: ${settings.htmlhint.optionsFile}, falling back to file search`
        );
        options = findConfigForHtmlFile(filePath);
      }
    } else {
      trace(
        `[HTMLHint Debug] No explicit config specified, searching for .htmlhintrc`
      );
      options = findConfigForHtmlFile(filePath);
    }
  } else {
    trace(`[HTMLHint Debug] No settings available, searching for .htmlhintrc`);
    options = findConfigForHtmlFile(filePath);
  }
  options = options || {};
  trace(`[HTMLHint Debug] Final configuration: ${JSON.stringify(options)}`);
  return options;
}
function findConfigForHtmlFile(base) {
  let options;
  trace(`[HTMLHint Debug] Looking for config starting from: ${base}`);
  if (fs.existsSync(base)) {
    if (fs.statSync(base).isDirectory() === false) {
      base = path.dirname(base);
      trace(`[HTMLHint Debug] File path detected, using directory: ${base}`);
    }
    while (base && base.length > 0) {
      const configFiles = [
        path.resolve(base, ".htmlhintrc"),
        path.resolve(base, ".htmlhintrc.json")
      ];
      for (const tmpConfigFile of configFiles) {
        trace(`[HTMLHint Debug] Checking config path: ${tmpConfigFile}`);
        if (htmlhintrcOptions[tmpConfigFile] === void 0) {
          htmlhintrcOptions[tmpConfigFile] = loadConfigurationFile(tmpConfigFile);
        }
        if (htmlhintrcOptions[tmpConfigFile]) {
          options = htmlhintrcOptions[tmpConfigFile];
          trace(`[HTMLHint Debug] Using config from: ${tmpConfigFile}`);
          return options;
        }
      }
      let parentBase = path.dirname(base);
      if (parentBase === base) {
        break;
      }
      base = parentBase;
    }
  } else {
    trace(`[HTMLHint Debug] Base path does not exist: ${base}`);
  }
  if (!options) {
    trace(`[HTMLHint Debug] No config file found, using default rules`);
  }
  return options;
}
function loadConfigurationFile(configFile) {
  let ruleset = null;
  trace(`[HTMLHint Debug] Attempting to load config file: ${configFile}`);
  if (fs.existsSync(configFile)) {
    trace(`[HTMLHint Debug] Config file exists, reading: ${configFile}`);
    try {
      let config = fs.readFileSync(configFile, "utf8");
      ruleset = JSON.parse(stripJsonComments(config));
      trace(
        `[HTMLHint Debug] Successfully parsed config: ${JSON.stringify(ruleset)}`
      );
    } catch (e) {
      trace(`[HTMLHint Debug] Failed to parse config file: ${e}`);
      ruleset = null;
    }
  } else {
    trace(`[HTMLHint Debug] Config file does not exist: ${configFile}`);
  }
  return ruleset;
}
function isErrorWithMessage(err) {
  return typeof err === "object" && err !== null && "message" in err && typeof err.message === "string";
}
function getErrorMessage(err, document) {
  if (isErrorWithMessage(err)) {
    return err.message;
  }
  return `An unknown error occurred while validating file: ${document.uri}`;
}
function validateAllTextDocuments(connection2, documents2) {
  trace(
    `[DEBUG] validateAllTextDocuments called for ${documents2.length} documents`
  );
  if (!settings) {
    trace(
      `[DEBUG] Settings not loaded yet, skipping validation of all documents`
    );
    return;
  }
  let tracker = new import_node.ErrorMessageTracker();
  documents2.forEach((document) => {
    try {
      trace(`[DEBUG] Revalidating document: ${document.uri}`);
      validateTextDocument(connection2, document);
    } catch (err) {
      tracker.add(getErrorMessage(err, document));
    }
  });
  tracker.sendErrors(connection2);
  trace(`[DEBUG] validateAllTextDocuments completed`);
}
function validateTextDocument(connection2, document) {
  try {
    doValidate(connection2, document);
  } catch (err) {
    connection2.window.showErrorMessage(getErrorMessage(err, document));
  }
}
var connection = (0, import_node.createConnection)(import_node.ProposedFeatures.all);
var documents = new import_node.TextDocuments(import_vscode_languageserver_textdocument.TextDocument);
documents.listen(connection);
function trace(message, verbose) {
  connection.tracer.log(message, verbose);
  connection.console.log(message);
}
function createHtmlLangRequireFix(document, diagnostic) {
  trace(
    `[DEBUG] createHtmlLangRequireFix called with diagnostic: ${JSON.stringify(diagnostic)}`
  );
  if (!diagnostic.data || diagnostic.data.ruleId !== "html-lang-require") {
    trace(
      `[DEBUG] createHtmlLangRequireFix: Invalid diagnostic data or ruleId`
    );
    return null;
  }
  const text = document.getText();
  const htmlTagMatch = text.match(/<html(\s[^>]*)?>/i);
  if (!htmlTagMatch) {
    trace(`[DEBUG] createHtmlLangRequireFix: No html tag found`);
    return null;
  }
  const htmlTagStart = htmlTagMatch.index;
  const htmlTag = htmlTagMatch[0];
  trace(
    `[DEBUG] createHtmlLangRequireFix: Found html tag at index ${htmlTagStart}: ${htmlTag}`
  );
  const langAttrMatch = htmlTag.match(/\slang\s*=\s*["'][^"']*["']/i);
  if (langAttrMatch) {
    trace(`[DEBUG] createHtmlLangRequireFix: Lang attribute already exists`);
    return null;
  }
  const insertPosition = document.positionAt(htmlTagStart + 5);
  const newText = ' lang="en"';
  trace(
    `[DEBUG] createHtmlLangRequireFix: Will insert "${newText}" at position ${JSON.stringify(insertPosition)}`
  );
  const edit = {
    range: {
      start: insertPosition,
      end: insertPosition
    },
    newText
  };
  const workspaceEdit = {
    changes: {
      [document.uri]: [edit]
    }
  };
  trace(`[DEBUG] createHtmlLangRequireFix: Returning fix action`);
  return {
    title: 'Add lang="en" attribute to html tag',
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createTitleRequireFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "title-require") {
    return null;
  }
  const text = document.getText();
  const headMatch = text.match(/<head(\s[^>]*)?>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    return null;
  }
  const headContent = headMatch[2];
  const titleMatch = headContent.match(/<title(\s[^>]*)?>/i);
  if (titleMatch) {
    return null;
  }
  const headStart = headMatch.index + headMatch[0].indexOf(">") + 1;
  const metaCharsetMatch = headContent.match(
    /<meta\s+charset\s*=\s*["'][^"']*["'][^>]*>/i
  );
  let insertPosition;
  let newText;
  if (metaCharsetMatch) {
    const metaCharsetEnd = headStart + metaCharsetMatch.index + metaCharsetMatch[0].length;
    insertPosition = metaCharsetEnd;
    newText = "\n    <title>Document</title>";
  } else {
    insertPosition = headStart;
    newText = "\n    <title>Document</title>";
  }
  const edit = {
    range: {
      start: document.positionAt(insertPosition),
      end: document.positionAt(insertPosition)
    },
    newText
  };
  const workspaceEdit = {
    changes: {
      [document.uri]: [edit]
    }
  };
  return {
    title: "Add <title> tag",
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createAttrValueDoubleQuotesFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "attr-value-double-quotes" || typeof diagnostic.data.line !== "number" || typeof diagnostic.data.col !== "number") {
    return null;
  }
  const text = document.getText();
  const lines = text.split("\n");
  const line = lines[diagnostic.data.line - 1];
  if (!line) {
    return null;
  }
  const singleQuotePattern = /(\w+)='([^']*)'/g;
  let match;
  const edits = [];
  while ((match = singleQuotePattern.exec(line)) !== null) {
    const startCol = match.index;
    const endCol = startCol + match[0].length;
    const attrName = match[1];
    const attrValue = match[2];
    const diagnosticCol = diagnostic.data.col - 1;
    if (Math.abs(startCol - diagnosticCol) <= 10) {
      const lineStartPos = document.positionAt(
        text.split("\n").slice(0, diagnostic.data.line - 1).join("\n").length + (diagnostic.data.line > 1 ? 1 : 0)
      );
      const startPos = { line: lineStartPos.line, character: startCol };
      const endPos = { line: lineStartPos.line, character: endCol };
      edits.push({
        range: { start: startPos, end: endPos },
        newText: `${attrName}="${attrValue}"`
      });
      break;
    }
  }
  if (edits.length === 0) {
    return null;
  }
  const workspaceEdit = {
    changes: {
      [document.uri]: edits
    }
  };
  return {
    title: "Change attribute quotes to double quotes",
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createTagnameLowercaseFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "tagname-lowercase" || typeof diagnostic.data.line !== "number" || typeof diagnostic.data.col !== "number") {
    return null;
  }
  const text = document.getText();
  const lines = text.split("\n");
  const line = lines[diagnostic.data.line - 1];
  if (!line) {
    return null;
  }
  const tagPattern = /<\/?([A-Z][A-Za-z0-9]*)\b/g;
  let match;
  const edits = [];
  while ((match = tagPattern.exec(line)) !== null) {
    const startCol = match.index + 1 + (match[0].startsWith("</") ? 1 : 0);
    const endCol = startCol + match[1].length;
    const tagName = match[1];
    const diagnosticCol = diagnostic.data.col - 1;
    if (Math.abs(match.index - diagnosticCol) <= 5) {
      const lineStartPos = document.positionAt(
        text.split("\n").slice(0, diagnostic.data.line - 1).join("\n").length + (diagnostic.data.line > 1 ? 1 : 0)
      );
      const startPos = { line: lineStartPos.line, character: startCol };
      const endPos = { line: lineStartPos.line, character: endCol };
      edits.push({
        range: { start: startPos, end: endPos },
        newText: tagName.toLowerCase()
      });
      break;
    }
  }
  if (edits.length === 0) {
    return null;
  }
  const workspaceEdit = {
    changes: {
      [document.uri]: edits
    }
  };
  return {
    title: "Convert tag to lowercase",
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createAttrLowercaseFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "attr-lowercase" || typeof diagnostic.data.line !== "number" || typeof diagnostic.data.col !== "number") {
    return null;
  }
  const text = document.getText();
  const lines = text.split("\n");
  const line = lines[diagnostic.data.line - 1];
  if (!line) {
    return null;
  }
  const attrPattern = /\s([A-Z][A-Za-z0-9-_]*)\s*=/g;
  let match;
  const edits = [];
  while ((match = attrPattern.exec(line)) !== null) {
    const startCol = match.index + 1;
    const endCol = startCol + match[1].length;
    const attrName = match[1];
    const diagnosticCol = diagnostic.data.col - 1;
    if (Math.abs(startCol - diagnosticCol) <= 5) {
      const lineStartPos = document.positionAt(
        text.split("\n").slice(0, diagnostic.data.line - 1).join("\n").length + (diagnostic.data.line > 1 ? 1 : 0)
      );
      const startPos = { line: lineStartPos.line, character: startCol };
      const endPos = { line: lineStartPos.line, character: endCol };
      edits.push({
        range: { start: startPos, end: endPos },
        newText: attrName.toLowerCase()
      });
      break;
    }
  }
  if (edits.length === 0) {
    return null;
  }
  const workspaceEdit = {
    changes: {
      [document.uri]: edits
    }
  };
  return {
    title: "Convert attribute to lowercase",
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createDoctypeFirstFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "doctype-first") {
    return null;
  }
  const text = document.getText();
  if (text.toLowerCase().includes("<!doctype")) {
    return null;
  }
  const insertPosition = document.positionAt(0);
  const newText = "<!DOCTYPE html>\n";
  const edit = {
    range: {
      start: insertPosition,
      end: insertPosition
    },
    newText
  };
  const workspaceEdit = {
    changes: {
      [document.uri]: [edit]
    }
  };
  return {
    title: "Add DOCTYPE html declaration",
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createDoctypeHtml5Fix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "doctype-html5") {
    return null;
  }
  const text = document.getText();
  const doctypeMatch = text.match(/<!DOCTYPE[^>]*>/i);
  if (!doctypeMatch) {
    return null;
  }
  const doctypeStart = doctypeMatch.index;
  const doctypeEnd = doctypeStart + doctypeMatch[0].length;
  const edit = {
    range: {
      start: document.positionAt(doctypeStart),
      end: document.positionAt(doctypeEnd)
    },
    newText: "<!DOCTYPE html>"
  };
  const workspaceEdit = {
    changes: {
      [document.uri]: [edit]
    }
  };
  return {
    title: "Convert to HTML5 DOCTYPE",
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createMetaCharsetRequireFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "meta-charset-require") {
    return null;
  }
  const text = document.getText();
  const headMatch = text.match(/<head(\s[^>]*)?>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    return null;
  }
  const headContent = headMatch[2];
  const charsetMatch = headContent.match(
    /<meta\s+charset\s*=\s*["'][^"']*["'][^>]*>/i
  );
  if (charsetMatch) {
    return null;
  }
  const headStart = headMatch.index + headMatch[0].indexOf(">") + 1;
  const insertPosition = headStart;
  const newText = '\n    <meta charset="UTF-8">';
  const edit = {
    range: {
      start: document.positionAt(insertPosition),
      end: document.positionAt(insertPosition)
    },
    newText
  };
  const workspaceEdit = {
    changes: {
      [document.uri]: [edit]
    }
  };
  return {
    title: 'Add <meta charset="UTF-8"> tag',
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createMetaViewportRequireFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "meta-viewport-require") {
    return null;
  }
  const text = document.getText();
  const headMatch = text.match(/<head(\s[^>]*)?>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    return null;
  }
  const headContent = headMatch[2];
  const viewportMatch = headContent.match(
    /<meta\s+name\s*=\s*["']viewport["'][^>]*>/i
  );
  if (viewportMatch) {
    return null;
  }
  const headStart = headMatch.index + headMatch[0].indexOf(">") + 1;
  const metaCharsetMatch = headContent.match(
    /<meta\s+charset\s*=\s*["'][^"']*["'][^>]*>/i
  );
  let insertPosition;
  let newText;
  if (metaCharsetMatch) {
    const metaCharsetEnd = headStart + metaCharsetMatch.index + metaCharsetMatch[0].length;
    insertPosition = metaCharsetEnd;
    newText = '\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">';
  } else {
    insertPosition = headStart;
    newText = '\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">';
  }
  const edit = {
    range: {
      start: document.positionAt(insertPosition),
      end: document.positionAt(insertPosition)
    },
    newText
  };
  const workspaceEdit = {
    changes: {
      [document.uri]: [edit]
    }
  };
  return {
    title: 'Add <meta name="viewport"> tag',
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createMetaDescriptionRequireFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "meta-description-require") {
    return null;
  }
  const text = document.getText();
  const headMatch = text.match(/<head(\s[^>]*)?>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    return null;
  }
  const headContent = headMatch[2];
  const descriptionMatch = headContent.match(
    /<meta\s+name\s*=\s*["']description["'][^>]*>/i
  );
  if (descriptionMatch) {
    return null;
  }
  const headStart = headMatch.index + headMatch[0].indexOf(">") + 1;
  const metaCharsetMatch = headContent.match(
    /<meta\s+charset\s*=\s*["'][^"']*["'][^>]*>/i
  );
  const metaViewportMatch = headContent.match(
    /<meta\s+name\s*=\s*["']viewport["'][^>]*>/i
  );
  let insertPosition;
  let newText;
  if (metaViewportMatch) {
    const metaViewportEnd = headStart + metaViewportMatch.index + metaViewportMatch[0].length;
    insertPosition = metaViewportEnd;
    newText = '\n    <meta name="description" content="">';
  } else if (metaCharsetMatch) {
    const metaCharsetEnd = headStart + metaCharsetMatch.index + metaCharsetMatch[0].length;
    insertPosition = metaCharsetEnd;
    newText = '\n    <meta name="description" content="">';
  } else {
    insertPosition = headStart;
    newText = '\n    <meta name="description" content="">';
  }
  const edit = {
    range: {
      start: document.positionAt(insertPosition),
      end: document.positionAt(insertPosition)
    },
    newText
  };
  const workspaceEdit = {
    changes: {
      [document.uri]: [edit]
    }
  };
  return {
    title: 'Add <meta name="description"> tag',
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createAltRequireFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "alt-require") {
    trace(`[DEBUG] createAltRequireFix: Invalid diagnostic data or ruleId`);
    return null;
  }
  const text = document.getText();
  const lines = text.split("\n");
  const line = lines[diagnostic.data.line - 1];
  if (!line) {
    trace(
      `[DEBUG] createAltRequireFix: No line found at ${diagnostic.data.line}`
    );
    return null;
  }
  const imgPattern = /<(img|area|input)((?:\s+[^>]*?)?)\s*(\/?)>/gi;
  let match;
  const edits = [];
  while ((match = imgPattern.exec(line)) !== null) {
    const startCol = match.index;
    const endCol = startCol + match[0].length;
    const tagName = match[1].toLowerCase();
    const attributes = match[2] || "";
    const selfClosing = match[3] || "";
    const diagnosticCol = diagnostic.data.col - 1;
    if (Math.abs(startCol - diagnosticCol) <= 30) {
      if (attributes.toLowerCase().includes("alt=")) {
        break;
      }
      if (tagName === "area" && !attributes.toLowerCase().includes("href=")) {
        break;
      }
      if (tagName === "input") {
        const typeMatch = attributes.match(/type\s*=\s*["']([^"']*)["']/i);
        if (!typeMatch || typeMatch[1].toLowerCase() !== "image") {
          break;
        }
      }
      const startPos = {
        line: diagnostic.data.line - 1,
        character: startCol
      };
      const endPos = { line: diagnostic.data.line - 1, character: endCol };
      let newText;
      if (selfClosing === "/") {
        newText = `<${tagName}${attributes} alt="" />`;
      } else {
        newText = `<${tagName}${attributes} alt="">`;
      }
      edits.push({
        range: { start: startPos, end: endPos },
        newText
      });
      break;
    }
  }
  if (edits.length === 0) {
    trace(`[DEBUG] createAltRequireFix: No edits created`);
    return null;
  }
  const workspaceEdit = {
    changes: {
      [document.uri]: edits
    }
  };
  return {
    title: "Add alt attribute",
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createButtonTypeRequireFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "button-type-require") {
    trace(
      `[DEBUG] createButtonTypeRequireFix: Invalid diagnostic data or ruleId`
    );
    return null;
  }
  const text = document.getText();
  const lines = text.split("\n");
  const line = lines[diagnostic.data.line - 1];
  if (!line) {
    trace(
      `[DEBUG] createButtonTypeRequireFix: No line found at ${diagnostic.data.line}`
    );
    return null;
  }
  const buttonPattern = /<button(\s[^>]*)?>/gi;
  let match;
  const edits = [];
  while ((match = buttonPattern.exec(line)) !== null) {
    const startCol = match.index;
    const endCol = startCol + match[0].length;
    const attributes = match[1] || "";
    const diagnosticCol = diagnostic.data.col - 1;
    if (Math.abs(startCol - diagnosticCol) <= 15) {
      if (attributes.toLowerCase().includes("type=")) {
        break;
      }
      const startPos = {
        line: diagnostic.data.line - 1,
        character: startCol
      };
      const endPos = { line: diagnostic.data.line - 1, character: endCol };
      const newText = `<button${attributes} type="button">`;
      edits.push({
        range: { start: startPos, end: endPos },
        newText
      });
      break;
    }
  }
  if (edits.length === 0) {
    trace(`[DEBUG] createButtonTypeRequireFix: No edits created`);
    return null;
  }
  const workspaceEdit = {
    changes: {
      [document.uri]: edits
    }
  };
  return {
    title: 'Add type="button" attribute',
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
function createAttrNoUnnecessaryWhitespaceFix(document, diagnostic) {
  if (!diagnostic.data || diagnostic.data.ruleId !== "attr-no-unnecessary-whitespace") {
    trace(
      `[DEBUG] createAttrNoUnnecessaryWhitespaceFix: Invalid diagnostic data or ruleId`
    );
    return null;
  }
  const text = document.getText();
  const lines = text.split("\n");
  const line = lines[diagnostic.data.line - 1];
  if (!line) {
    trace(
      `[DEBUG] createAttrNoUnnecessaryWhitespaceFix: No line found at ${diagnostic.data.line}`
    );
    return null;
  }
  const attrPattern = /(\w+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;
  const edits = [];
  while ((match = attrPattern.exec(line)) !== null) {
    const startCol = match.index;
    const endCol = startCol + match[0].length;
    const attrName = match[1];
    const attrValue = match[2];
    const diagnosticCol = diagnostic.data.col - 1;
    if (Math.abs(startCol - diagnosticCol) <= 10) {
      if (match[0] !== `${attrName}=${attrValue}`) {
        const startPos = {
          line: diagnostic.data.line - 1,
          character: startCol
        };
        const endPos = { line: diagnostic.data.line - 1, character: endCol };
        edits.push({
          range: { start: startPos, end: endPos },
          newText: `${attrName}=${attrValue}`
        });
        break;
      }
    }
  }
  if (edits.length === 0) {
    trace(`[DEBUG] createAttrNoUnnecessaryWhitespaceFix: No edits created`);
    return null;
  }
  const workspaceEdit = {
    changes: {
      [document.uri]: edits
    }
  };
  return {
    title: "Remove unnecessary whitespace around attribute",
    kind: import_node.CodeActionKind.QuickFix,
    edit: workspaceEdit,
    isPreferred: true
  };
}
async function createAutoFixes(document, diagnostics) {
  var _a;
  trace(
    `[DEBUG] createAutoFixes called with ${diagnostics.length} diagnostics`
  );
  const actions = [];
  for (const diagnostic of diagnostics) {
    trace(`[DEBUG] Processing diagnostic: ${JSON.stringify(diagnostic)}`);
    const ruleId = ((_a = diagnostic.data) == null ? void 0 : _a.ruleId) || diagnostic.code;
    trace(`[DEBUG] Using ruleId: ${ruleId}`);
    if (!ruleId) {
      trace(`[DEBUG] Skipping diagnostic without ruleId`);
      continue;
    }
    try {
      let fix = null;
      switch (ruleId) {
        case "html-lang-require":
          trace(`[DEBUG] Calling createHtmlLangRequireFix`);
          fix = await createHtmlLangRequireFix(document, diagnostic);
          break;
        case "title-require":
          trace(`[DEBUG] Calling createTitleRequireFix`);
          fix = await createTitleRequireFix(document, diagnostic);
          break;
        case "attr-value-double-quotes":
          trace(`[DEBUG] Calling createAttrValueDoubleQuotesFix`);
          fix = await createAttrValueDoubleQuotesFix(document, diagnostic);
          break;
        case "tagname-lowercase":
          trace(`[DEBUG] Calling createTagnameLowercaseFix`);
          fix = await createTagnameLowercaseFix(document, diagnostic);
          break;
        case "attr-lowercase":
          trace(`[DEBUG] Calling createAttrLowercaseFix`);
          fix = await createAttrLowercaseFix(document, diagnostic);
          break;
        case "doctype-first":
          trace(`[DEBUG] Calling createDoctypeFirstFix`);
          fix = await createDoctypeFirstFix(document, diagnostic);
          break;
        case "doctype-html5":
          trace(`[DEBUG] Calling createDoctypeHtml5Fix`);
          fix = await createDoctypeHtml5Fix(document, diagnostic);
          break;
        case "meta-charset-require":
          trace(`[DEBUG] Calling createMetaCharsetRequireFix`);
          fix = await createMetaCharsetRequireFix(document, diagnostic);
          break;
        case "meta-viewport-require":
          trace(`[DEBUG] Calling createMetaViewportRequireFix`);
          fix = await createMetaViewportRequireFix(document, diagnostic);
          break;
        case "meta-description-require":
          trace(`[DEBUG] Calling createMetaDescriptionRequireFix`);
          fix = await createMetaDescriptionRequireFix(document, diagnostic);
          break;
        case "alt-require":
          trace(`[DEBUG] Calling createAltRequireFix`);
          fix = createAltRequireFix(document, diagnostic);
          break;
        case "button-type-require":
          trace(`[DEBUG] Calling createButtonTypeRequireFix`);
          fix = createButtonTypeRequireFix(document, diagnostic);
          break;
        case "attr-no-unnecessary-whitespace":
          trace(`[DEBUG] Calling createAttrNoUnnecessaryWhitespaceFix`);
          fix = createAttrNoUnnecessaryWhitespaceFix(document, diagnostic);
          break;
        default:
          trace(`[DEBUG] No autofix function found for rule: ${ruleId}`);
          break;
      }
      if (fix) {
        trace(`[DEBUG] Adding fix for rule ${ruleId}`);
        actions.push(fix);
      } else {
        trace(`[DEBUG] No fix created for rule ${ruleId}`);
      }
    } catch (error) {
      trace(`[DEBUG] Error in autofix for rule ${ruleId}: ${error}`);
    }
  }
  trace(`[DEBUG] Returning ${actions.length} auto-fix actions`);
  return actions;
}
connection.onInitialize(
  (params, token) => {
    let rootFolder = params.rootPath;
    let initOptions = params.initializationOptions;
    let nodePath = initOptions ? initOptions.nodePath ? initOptions.nodePath : void 0 : void 0;
    linter = htmlhint.default || htmlhint.HTMLHint || htmlhint;
    let result = {
      capabilities: {
        textDocumentSync: import_node.TextDocumentSyncKind.Incremental,
        codeActionProvider: {
          codeActionKinds: [import_node.CodeActionKind.QuickFix]
        },
        workspace: {
          workspaceFolders: {
            supported: true
          }
        }
      }
    };
    return result;
  }
);
connection.onInitialized(() => {
  trace("[DEBUG] Server initialized, requesting initial configuration");
  connection.workspace.getConfiguration("htmlhint").then((config) => {
    trace("[DEBUG] Initial configuration loaded");
    settings = { htmlhint: config };
    validateAllTextDocuments(connection, documents.all());
  }).catch((error) => {
    trace("[DEBUG] Failed to load initial configuration: " + error);
    settings = {
      htmlhint: {
        enable: true,
        options: {},
        configFile: "",
        optionsFile: ""
      }
    };
    validateAllTextDocuments(connection, documents.all());
  });
});
function doValidate(connection2, document) {
  try {
    if (!settings) {
      trace("[DEBUG] Configuration not yet loaded, skipping validation");
      return;
    }
    let uri = document.uri;
    let fsPath = import_vscode_uri.URI.parse(uri).fsPath;
    trace(`[DEBUG] doValidate called for: ${fsPath}`);
    let contents = document.getText();
    let lines = contents.split("\n");
    let config = getConfiguration(fsPath);
    trace(`[DEBUG] Loaded config: ${JSON.stringify(config)}`);
    let errors = linter.verify(contents, config);
    trace(`[DEBUG] HTMLHint found ${errors.length} errors`);
    let diagnostics = [];
    if (errors.length > 0) {
      errors.forEach((each) => {
        trace(`[DEBUG] Error found: ${each.rule.id} - ${each.message}`);
        diagnostics.push(makeDiagnostic(each, document));
      });
    }
    trace(`[DEBUG] Sending ${diagnostics.length} diagnostics to VS Code`);
    connection2.sendDiagnostics({ uri, diagnostics });
  } catch (err) {
    trace(`[DEBUG] doValidate error: ${err}`);
    if (isErrorWithMessage(err)) {
      throw new Error(err.message);
    }
    throw err;
  }
}
documents.onDidChangeContent((event) => {
  trace(`[DEBUG] Document content changed: ${event.document.uri}`);
  validateTextDocument(connection, event.document);
});
documents.onDidOpen((event) => {
  trace(`[DEBUG] Document opened: ${event.document.uri}`);
  validateTextDocument(connection, event.document);
});
connection.onDidCloseTextDocument((event) => {
  const uri = event.textDocument.uri;
  trace(`[DEBUG] Document closed: ${uri}`);
  connection.sendDiagnostics({ uri, diagnostics: [] });
});
connection.onDidChangeConfiguration((params) => {
  trace(`[DEBUG] Configuration changed`);
  connection.workspace.getConfiguration("htmlhint").then((config) => {
    trace(`[DEBUG] Updated configuration loaded: ${JSON.stringify(config)}`);
    settings = { htmlhint: config };
    Object.keys(htmlhintrcOptions).forEach((configPath) => {
      htmlhintrcOptions[configPath] = void 0;
    });
    trace(`[DEBUG] Triggering revalidation due to settings change`);
    validateAllTextDocuments(connection, documents.all());
  }).catch((error) => {
    trace(`[DEBUG] Failed to load updated configuration: ${error}`);
    if (params.settings) {
      settings = params.settings;
      Object.keys(htmlhintrcOptions).forEach((configPath) => {
        htmlhintrcOptions[configPath] = void 0;
      });
      validateAllTextDocuments(connection, documents.all());
    }
  });
});
connection.onDidChangeWatchedFiles((params) => {
  trace(`[DEBUG] File watcher triggered with ${params.changes.length} changes`);
  let shouldRevalidate = false;
  for (let i = 0; i < params.changes.length; i++) {
    let uri = params.changes[i].uri;
    let fsPath = import_vscode_uri.URI.parse(uri).fsPath;
    trace(`[DEBUG] Processing config file change: ${fsPath}`);
    trace(`[DEBUG] Change type: ${params.changes[i].type}`);
    if (fsPath.endsWith(".htmlhintrc") || fsPath.endsWith(".htmlhintrc.json")) {
      shouldRevalidate = true;
      htmlhintrcOptions[fsPath] = void 0;
      const dir = path.dirname(fsPath);
      Object.keys(htmlhintrcOptions).forEach((configPath) => {
        if (configPath.startsWith(dir)) {
          trace(`[DEBUG] Clearing cached config: ${configPath}`);
          htmlhintrcOptions[configPath] = void 0;
        }
      });
      trace(`[DEBUG] Clearing all cached configs for safety`);
      Object.keys(htmlhintrcOptions).forEach((configPath) => {
        htmlhintrcOptions[configPath] = void 0;
      });
    }
  }
  if (shouldRevalidate) {
    trace(`[DEBUG] Triggering revalidation of all documents`);
    validateAllTextDocuments(connection, documents.all());
  } else {
    trace(`[DEBUG] No .htmlhintrc files changed, skipping revalidation`);
  }
});
connection.onRequest(
  "textDocument/codeAction",
  async (params) => {
    var _a;
    const { textDocument, range, context } = params;
    const uri = textDocument.uri;
    const document = documents.get(uri);
    if (!document) {
      trace(`[DEBUG] No document found for uri: ${uri}`);
      return [];
    }
    try {
      trace(`[DEBUG] Code action requested for ${uri}`);
      trace(`[DEBUG] Range: ${JSON.stringify(range)}`);
      trace(
        `[DEBUG] Context diagnostics: ${JSON.stringify(context.diagnostics)}`
      );
      const filteredDiagnostics = context.diagnostics.filter((diagnostic) => {
        const diagnosticRange = diagnostic.range;
        return diagnosticRange.start.line <= range.end.line && diagnosticRange.end.line >= range.start.line;
      });
      trace(
        `[DEBUG] Filtered diagnostics: ${JSON.stringify(filteredDiagnostics)}`
      );
      if (filteredDiagnostics.length === 0) {
        trace(`[DEBUG] No diagnostics intersect with the range`);
        return [];
      }
      const codeActions = [];
      for (const diagnostic of filteredDiagnostics) {
        trace(
          `[DEBUG] Creating fixes for diagnostic: ${JSON.stringify(diagnostic)}`
        );
        trace(`[DEBUG] Diagnostic data: ${JSON.stringify(diagnostic.data)}`);
        trace(`[DEBUG] Diagnostic code: ${JSON.stringify(diagnostic.code)}`);
        const enhancedDiagnostic = {
          ...diagnostic,
          data: diagnostic.data || {
            ruleId: diagnostic.code,
            href: (_a = diagnostic.codeDescription) == null ? void 0 : _a.href,
            line: diagnostic.range.start.line + 1,
            col: diagnostic.range.start.character + 1,
            raw: diagnostic.message.split(" ")[0]
          }
        };
        const fixes = await createAutoFixes(document, [enhancedDiagnostic]);
        trace(
          `[DEBUG] Created ${fixes.length} fixes for diagnostic: ${JSON.stringify(enhancedDiagnostic)}`
        );
        codeActions.push(
          ...fixes.map((fix) => ({
            title: fix.title,
            kind: fix.kind,
            diagnostics: fix.diagnostics,
            isPreferred: fix.isPreferred,
            edit: fix.edit ? {
              changes: {
                [uri]: fix.edit.changes[uri].map((change) => ({
                  range: {
                    start: {
                      line: change.range.start.line,
                      character: change.range.start.character
                    },
                    end: {
                      line: change.range.end.line,
                      character: change.range.end.character
                    }
                  },
                  newText: change.newText
                }))
              }
            } : void 0
          }))
        );
      }
      trace(`[DEBUG] Created ${codeActions.length} auto-fix actions`);
      trace(`[DEBUG] Code actions: ${JSON.stringify(codeActions)}`);
      return codeActions;
    } catch (error) {
      trace(`Error creating code actions: ${error}`);
      return [];
    }
  }
);
connection.listen();
