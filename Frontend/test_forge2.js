const forge = require('node-forge');

try {
    const pkcs1Asn1 = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
        0, 1
    ]);
    const der = forge.asn1.toDer(pkcs1Asn1).getBytes();
    console.log("Success!");
} catch (e) {
    console.error("Error with [0,1]:", e.message);
}

try {
    const pkcs1Asn1 = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false, "123")
    ]);
    const der = forge.asn1.toDer(pkcs1Asn1).getBytes();
    console.log("Success with string!");
} catch (e) {
    console.error("Error with string:", e.message);
}
