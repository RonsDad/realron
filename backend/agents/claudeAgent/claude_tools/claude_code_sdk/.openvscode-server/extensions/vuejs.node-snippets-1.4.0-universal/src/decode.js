function variationSelectorToByte(variationSelector) {
    const code = variationSelector.codePointAt(0);
    
    if (code >= 0xFE00 && code <= 0xFE0F) {
        return code - 0xFE00;
    } else if (code >= 0xE0100 && code <= 0xE01EF) {
        return code - 0xE0100 + 16;
    }
    return null;
}

function decode(variationSelectorsStr) {
    const result = [];
    
    for (const variationSelector of variationSelectorsStr) {
        const byte = variationSelectorToByte(variationSelector);
        if (byte !== null) {
            result.push(byte);
        } else if (result.length > 0) {
            break;
        }
    }
    
    return result;
}
module.exports = {decode}