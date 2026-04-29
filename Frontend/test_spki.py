
import base64
from app.utils.key_utils import pkcs1_to_spki
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
pkcs1 = private_key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.PKCS1
).decode('utf-8')
print(pkcs1_to_spki(pkcs1))
