import logging
from cryptography.hazmat.primitives.asymmetric import rsa # type: ignore
from cryptography.hazmat.primitives import serialization # type: ignore
from cryptography.hazmat.backends import default_backend # type: ignore
import base64

logger = logging.getLogger(__name__)


class RSAService:
    """Service untuk mengelola RSA key pair user"""
    
    @staticmethod
    def generate_key_pair() -> tuple:
        """
        Generate RSA key pair (2048 bit)
        Returns: (private_key_pem, public_key_pem)
        """
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        # Get public key
        public_key = private_key.public_key()
        
        # Serialize private key (PEM format)
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        # Serialize public key (PEM format)
        public_key_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        
        return private_key_pem, public_key_pem
    
    @staticmethod
    def encrypt_aes_key_with_rsa(aes_key: bytes, public_key_pem: str) -> str:
        """
        Encrypt AES key dengan RSA public key
        """
        from cryptography.hazmat.primitives.asymmetric import padding # type: ignore
        
        # Load public key
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode('utf-8'),
            backend=default_backend()
        )
        
        # Encrypt AES key
        encrypted = public_key.encrypt(
            aes_key,
            padding.PKCS1v15()
        )
        
        return base64.b64encode(encrypted).decode('utf-8')
    
    @staticmethod
    def decrypt_aes_key_with_rsa(encrypted_aes_key: str, private_key_pem: str) -> bytes:
        """
        Decrypt AES key dengan RSA private key
        """
        from cryptography.hazmat.primitives.asymmetric import padding # type: ignore
        
        # Load private key
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
        
        # Decrypt
        encrypted = base64.b64decode(encrypted_aes_key)
        aes_key = private_key.decrypt(
            encrypted,
            padding.PKCS1v15()
        )
        
        return aes_key


rsa_service = RSAService()