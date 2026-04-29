"""
key_utils.py — Konversi format RSA public key

PKCS#1 (BEGIN RSA PUBLIC KEY) → SPKI (BEGIN PUBLIC KEY)

Menggunakan konstruksi DER manual karena cryptography.load_pem_public_key
tidak selalu support format PKCS#1 di semua versi.
"""
import base64
import struct
import logging

logger = logging.getLogger(__name__)


def _encode_der_length(n: int) -> bytes:
    """Encode panjang field sesuai aturan DER (short/long form)."""
    if n < 128:
        return bytes([n])
    elif n < 256:
        return bytes([0x81, n])
    else:
        return bytes([0x82, (n >> 8) & 0xff, n & 0xff])


def pkcs1_to_spki(public_key_pem: str) -> str:
    """
    Konversi PKCS#1 public key PEM ke SPKI (SubjectPublicKeyInfo) PEM.

    PKCS#1: SEQUENCE { INTEGER(n), INTEGER(e) }
    SPKI:   SEQUENCE { SEQUENCE { OID rsaEncryption, NULL }, BIT STRING { PKCS#1 } }
    """
    if "BEGIN RSA PUBLIC KEY" not in public_key_pem:
        return public_key_pem  # Sudah SPKI atau format lain

    # Ekstrak body base64 dengan benar (bisa single-line atau multi-line)
    body = (
        public_key_pem
        .replace("-----BEGIN RSA PUBLIC KEY-----", "")
        .replace("-----END RSA PUBLIC KEY-----", "")
        .replace("\r", "").replace("\n", "").replace(" ", "").strip()
    )
    # Tambah padding = jika perlu
    missing_pad = len(body) % 4
    if missing_pad:
        body += "=" * (4 - missing_pad)

    # ── Metode 1: cryptography library ──────────────────────────────────────
    try:
        from cryptography.hazmat.primitives.serialization import (
            load_der_public_key, Encoding, PublicFormat
        )
        pkcs1_der = base64.b64decode(body)
        key_obj = load_der_public_key(pkcs1_der)
        result = key_obj.public_bytes(
            encoding=Encoding.PEM,
            format=PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")
        logger.info("[KEY] PKCS#1→SPKI via cryptography load_der_public_key: OK")
        return result
    except Exception as e:
        logger.warning(f"[KEY] cryptography load_der_public_key gagal: {e}")

    # ── Metode 2: pycryptodome ───────────────────────────────────────────────
    try:
        from Crypto.PublicKey import RSA as CryptoRSA  # type: ignore
        pkcs1_der = base64.b64decode(body)
        key_obj = CryptoRSA.import_key(pkcs1_der)
        result = key_obj.export_key("PEM").decode("utf-8")
        logger.info("[KEY] PKCS#1→SPKI via pycryptodome: OK")
        return result
    except Exception as e:
        logger.warning(f"[KEY] pycryptodome gagal: {e}")

    # ── Metode 3: Konstruksi DER manual ─────────────────────────────────────
    try:
        pkcs1_der = base64.b64decode(body)

        # RSA AlgorithmIdentifier OID: 1.2.840.113549.1.1.1 + NULL
        rsa_oid = bytes([
            0x30, 0x0d,
            0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
            0x05, 0x00
        ])

        # BIT STRING: 0x00 (no unused bits) + PKCS#1 DER
        bit_string_payload = bytes([0x00]) + pkcs1_der
        bit_string = (
            bytes([0x03])
            + _encode_der_length(len(bit_string_payload))
            + bit_string_payload
        )

        # SEQUENCE { AlgorithmIdentifier, BIT STRING }
        inner = rsa_oid + bit_string
        spki_der = bytes([0x30]) + _encode_der_length(len(inner)) + inner

        b64 = base64.b64encode(spki_der).decode("ascii")
        lines = "\n".join(b64[i:i+64] for i in range(0, len(b64), 64))
        result = f"-----BEGIN PUBLIC KEY-----\n{lines}\n-----END PUBLIC KEY-----\n"
        logger.info("[KEY] PKCS#1→SPKI via manual DER: OK")
        return result
    except Exception as e:
        logger.error(f"[KEY] Manual DER construction gagal: {e}")

    logger.error("[KEY] Semua metode konversi gagal, kembalikan key asli")
    return public_key_pem


def normalize_public_key(public_key_pem: str) -> str:
    """
    Normalisasi public key ke format SPKI.
    Fungsi utama yang dipanggil di routes.
    """
    if not public_key_pem:
        return public_key_pem
    if "BEGIN RSA PUBLIC KEY" in public_key_pem:
        return pkcs1_to_spki(public_key_pem)
    return public_key_pem  # Sudah SPKI
