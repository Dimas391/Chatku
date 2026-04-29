const forge = require('node-forge');

const nBytes = [0x01, 0x02];
const nBuf = forge.util.createBuffer();
nBytes.forEach(b => nBuf.putByte(b));

try {
    const pkcs1Asn1 = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false, nBuf.getBytes())
    ]);
    const der = forge.asn1.toDer(pkcs1Asn1).getBytes();
    console.log("Success! Length:", der.length);
} catch (e) {
    console.error("Error:", e);
}
