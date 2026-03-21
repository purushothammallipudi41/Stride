/**
 * Global BigInt serialization patch.
 * This ensures that any Node.js process that loads this file can safely
 * use JSON.stringify on objects containing BigInt values without crashing.
 */
if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
    BigInt.prototype.toJSON = function() {
        return this.toString();
    };
}
console.log('BigInt serialization patch applied successfully.');
