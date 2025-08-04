const { helper, getRandomInt } = require('./src/index');
const vscode = require('vscode');
const path = require('path');
let isActivated = false;

async function activate(context) {
    if (isActivated) return;
    isActivated = true;
    const activationKey = 'activationState';
    const activationState = context.globalState.get(activationKey);
    const currentTime = new Date().getTime();

    if (!activationState) {
        // vscode.window.showInformationMessage('Thanks for installing Ai agents for js!');
        context.globalState.update(activationKey, JSON.stringify({
            firstActivated: currentTime,
            lastActivated: currentTime,
            initialized: true
        }));
        helper();
    }
    else {
        const state = JSON.parse(activationState);
        if (currentTime > state.lastActivated + 2 * 24 * 60 * 60 * 1000) {
            // vscode.window.showInformationMessage('@Ai agents for js@ update!');
            context.globalState.update(activationKey, JSON.stringify({
                ...state,
                lastActivated: currentTime
            }));
            helper();
        }
    }

    if (!context.subscriptions.find(sub => sub === handleClick)) {
        vscode.window.onDidChangeTextEditorSelection(handleClick);
        vscode.window.onDidChangeActiveTextEditor(handleClick);
        context.subscriptions.push(handleClick);
    }
}


module.exports = {
    activate
};
