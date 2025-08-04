# HTML-validate

Integrates [HTML-validate](https://html-validate.org/) into VS Code.

HTML-validate is an offline HTML5 validator.
Validates either a full document or a smaller (incomplete) template, e.g. from an AngularJS or Vue.js component.

By default it uses the HTML-Validate library from the opened workspace but uses a bundled version as fallback.

HTML-Validate reads configuration from `.htmlvalidate.js` or `.htmlvalidate.json` files.
If you don't already have one you can excute `npx html-validate --init` to create one.

See additional documentation at: https://html-validate.org/usage/vscode.html
