from cryptography.hazmat.primitives.asymmetric import rsa # type: ignore
from cryptography.hazmat.primitives import serialization # type: ignore
import os

os.makedirs('keys', exist_ok=True)

# Generate private key
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# Save private key
with open('keys/server_private_key.pem', 'wb') as f:
    f.write(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ))

# Save public key
public_key = private_key.public_key()
with open('keys/server_public_key.pem', 'wb') as f:
    f.write(public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ))

print('✅ Server RSA keys generated successfully!')
print('   Private key: keys/server_private_key.pem')
print('   Public key: keys/server_public_key.pem')
