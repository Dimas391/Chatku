import logging
import base64
import hashlib
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes # type: ignore
from cryptography.hazmat.primitives.asymmetric import padding # type: ignore
from cryptography.hazmat.primitives import serialization, hashes # type: ignore
from cryptography.hazmat.primitives.asymmetric import rsa # type: ignore
from cryptography.hazmat.primitives import padding as sym_padding # type: ignore
from cryptography.hazmat.backends import default_backend # type: ignore

logger = logging.getLogger(__name__)

class EncryptionService:
    """Service untuk enkripsi/dekripsi di sisi server"""
                    
    def __init__(self):
        self.private_key = None
        self.public_key = None
        self._load_rsa_keys()
    
    def _load_rsa_keys(self):
        """Load RSA keys untuk dekripsi AES key dari client"""
        try:
            if not os.path.exists("keys/private_key.pem"):
                logger.warning("⚠️ Private key file not found, generating new keys...")
                self._generate_keys()
                return

            # Load private key dari file
            with open("keys/private_key.pem", "rb") as f:
                self.private_key = serialization.load_pem_private_key(
                    f.read(),
                    password=None,
                    backend=default_backend()
                )
            
            # SELALU turunkan public key dari private key untuk menjamin kecocokan
            self.public_key = self.private_key.public_key()
            
            # Update public_key.pem file agar sinkron
            with open("keys/public_key.pem", "wb") as f:
                f.write(self.public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ))
            
            logger.info("✅ RSA keys loaded and synchronized successfully")
        except Exception as e:
            logger.error(f"Failed to load RSA keys: {e}")
            self._generate_keys()
    
    def _generate_keys(self):
        """Generate RSA key pair jika belum ada"""
        # Buat folder keys jika belum ada
        os.makedirs("keys", exist_ok=True)
        
        logger.info("🔐 Generating new 2048-bit RSA key pair...")
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        # Save private key
        with open("keys/private_key.pem", "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        # Save public key
        public_key = private_key.public_key()
        with open("keys/public_key.pem", "wb") as f:
            f.write(public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ))
        
        self.private_key = private_key
        self.public_key = public_key
        logger.info("✨ New RSA keys generated and saved successfully")
    
    # ==================== RSA METHODS ====================
    
    def encrypt_aes_key_with_rsa(self, aes_key: bytes, public_key_pem: str) -> str:
        """
        Encrypt AES key dengan RSA public key (untuk user atau server)
        
        Args:
            aes_key: Raw AES key bytes (32 bytes untuk AES-256)
            public_key_pem: Public key dalam format PEM string
        
        Returns:
            Encrypted AES key dalam base64 string
        """
        try:
            # Load public key dari PEM string
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
        except Exception as e:
            logger.error(f"Failed to encrypt AES key with RSA: {e}")
            raise ValueError(f"RSA encryption failed: {str(e)}")
    
    def decrypt_aes_key_with_rsa(self, encrypted_aes_key_base64: str, private_key_pem: str) -> bytes:
        """
        Decrypt AES key dengan RSA private key (untuk user)
        
        Args:
            encrypted_aes_key_base64: Encrypted AES key dalam base64 string
            private_key_pem: Private key dalam format PEM string
        
        Returns:
            Raw AES key bytes (32 bytes untuk AES-256)
        """
        try:
            # Load private key dari PEM string
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode('utf-8'),
                password=None,
                backend=default_backend()
            )
            
            # Decrypt
            encrypted = base64.b64decode(encrypted_aes_key_base64)
            aes_key = private_key.decrypt(
                encrypted,
                padding.PKCS1v15()
            )
            
            return aes_key
        except Exception as e:
            logger.error(f"Failed to decrypt AES key with RSA: {e}")
            raise ValueError(f"RSA decryption failed: {str(e)}")
    
    def encrypt_aes_key_for_server(self, aes_key: bytes) -> str:
        """
        Encrypt AES key dengan server's own public key (untuk klasifikasi)
        
        Args:
            aes_key: Raw AES key bytes
        
        Returns:
            Encrypted AES key dalam base64 string
        """
        try:
            # Get server's public key as PEM string
            server_public_key_pem = self.get_public_key_pem()
            
            return self.encrypt_aes_key_with_rsa(aes_key, server_public_key_pem)
        except Exception as e:
            logger.error(f"Failed to encrypt AES key for server: {e}")
            raise
    
    def decrypt_aes_key_for_server(self, encrypted_aes_key_base64: str) -> bytes:
        """
        Decrypt AES key dengan server's own private key (untuk klasifikasi)
        Mencoba berbagai padding untuk kompatibilitas dengan library client (React Native)
        """
        try:
            # 0. Sanitasi input: hapus whitespace, newlines, dan spasi
            clean_b64 = "".join(encrypted_aes_key_base64.split())
            encrypted = base64.b64decode(clean_b64)
            
            logger.info(f"🔐 [RSA] Attempting to decrypt {len(encrypted)} bytes of data")

            # 1. Coba PKCS1v15 (Default untuk banyak library mobile)
            try:
                return self.private_key.decrypt(
                    encrypted,
                    padding.PKCS1v15()
                )
            except Exception as e:
                logger.debug(f"PKCS1v15 decryption failed: {e}")

            # 2. Coba OAEP dengan SHA-1
            try:
                return self.private_key.decrypt(
                    encrypted,
                    padding.OAEP(
                        mgf=padding.MGF1(algorithm=hashes.SHA1()),
                        algorithm=hashes.SHA1(),
                        label=None
                    )
                )
            except Exception as e:
                logger.debug(f"OAEP-SHA1 decryption failed: {e}")
            
            # 3. Coba OAEP dengan SHA-256
            try:
                return self.private_key.decrypt(
                    encrypted,
                    padding.OAEP(
                        mgf=padding.MGF1(algorithm=hashes.SHA1()),
                        algorithm=hashes.SHA256(),
                        label=None
                    )
                )
            except Exception as e:
                logger.debug(f"OAEP-SHA256 decryption failed: {e}")

            # Jika semua gagal
            raise ValueError("All RSA decryption attempts failed. Possible causes: wrong public key used by client, corrupted data, or unsupported padding.")

        except Exception as e:
            logger.error(f"❌ [RSA] Server decryption error: {e}")
            raise ValueError(f"Server decryption failed: {str(e)}")
    
    def get_public_key_pem(self) -> str:
        """
        Get server's public key as PEM string (untuk dikirim ke client)
        """
        if self.public_key is None:
            raise ValueError("Public key not loaded")
        
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
    
    def get_private_key_pem(self) -> str:
        """
        Get server's private key as PEM string (HATI-HATI: Hanya untuk internal)
        """
        if self.private_key is None:
            raise ValueError("Private key not loaded")
        
        return self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
    
    # ==================== AES METHODS ====================
    
    def decrypt_aes_key(self, encrypted_aes_key_base64: str) -> bytes:
        """
        Dekripsi AES key yang dienkripsi dengan RSA public key client
        (Legacy method - menggunakan decrypt_aes_key_for_server)
        """
        return self.decrypt_aes_key_for_server(encrypted_aes_key_base64)
    
    def decrypt_message(self, ciphertext_base64: str, aes_key: bytes, iv_base64: str) -> str:
        """
        Dekripsi pesan dengan AES-256-CBC
        """
        try:
            # Decode base64
            ciphertext = base64.b64decode(ciphertext_base64)
            iv = base64.b64decode(iv_base64)
            
            # Buat cipher AES
            cipher = Cipher(
                algorithms.AES(aes_key),
                modes.CBC(iv),
                backend=default_backend()
            )
            
            # Decrypt
            decryptor = cipher.decryptor()
            plaintext_padded = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Remove padding (PKCS7)
            unpadder = sym_padding.PKCS7(128).unpadder()
            plaintext_bytes = unpadder.update(plaintext_padded) + unpadder.finalize()
            plaintext = plaintext_bytes.decode('utf-8')
            
            logger.info("🔐 Message decrypted successfully")
            return plaintext
        except Exception as e:
            logger.error(f"Failed to decrypt message: {e}")
            raise ValueError(f"Invalid encrypted message: {str(e)}")
    
    def encrypt_message_with_aes(self, plaintext: str, aes_key: bytes, iv_base64: str) -> str:
        """
        Encrypt pesan dengan AES-256-CBC
        
        Args:
            plaintext: Pesan plaintext
            aes_key: Raw AES key bytes (32 bytes)
            iv_base64: IV dalam base64 string
        
        Returns:
            Ciphertext dalam base64 string
        """
        try:
            # Decode IV
            iv = base64.b64decode(iv_base64)
            
            # Convert plaintext to bytes
            plaintext_bytes = plaintext.encode('utf-8')
            
            # Add PKCS7 padding
            padder = sym_padding.PKCS7(128).padder()
            padded_data = padder.update(plaintext_bytes) + padder.finalize()
            
            # Buat cipher AES
            cipher = Cipher(
                algorithms.AES(aes_key),
                modes.CBC(iv),
                backend=default_backend()
            )
            
            # Encrypt
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(padded_data) + encryptor.finalize()
            
            return base64.b64encode(ciphertext).decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to encrypt message: {e}")
            raise ValueError(f"Encryption failed: {str(e)}")
    
    def verify_message_hash(self, plaintext: str, provided_hash: str) -> bool:
        """
        Verifikasi hash SHA-256 pesan untuk integritas data
        """
        computed_hash = hashlib.sha256(plaintext.encode('utf-8')).hexdigest()
        is_valid = computed_hash == provided_hash
        logger.info(f"🔐 Hash verification: {'PASSED' if is_valid else 'FAILED'}")
        return is_valid
    
    def compute_message_hash(self, plaintext: str) -> str:
        """
        Compute SHA-256 hash dari pesan
        """
        return hashlib.sha256(plaintext.encode('utf-8')).hexdigest()
    
    def generate_aes_key(self) -> bytes:
        """
        Generate random AES-256 key (32 bytes)
        """
        return os.urandom(32)
    
    def generate_iv(self) -> bytes:
        """
        Generate random IV for AES-CBC (16 bytes)
        """
        return os.urandom(16)
    
    def iv_to_base64(self, iv: bytes) -> str:
        """
        Convert IV bytes to base64 string
        """
        return base64.b64encode(iv).decode('utf-8')
    
    def aes_key_to_base64(self, aes_key: bytes) -> str:
        """
        Convert AES key bytes to base64 string
        """
        return base64.b64encode(aes_key).decode('utf-8')
    
    def aes_key_from_base64(self, aes_key_base64: str) -> bytes:
        """
        Convert base64 string to AES key bytes
        """
        return base64.b64decode(aes_key_base64)
    
    def clear_memory(self, *args):
        """
        Hapus data sensitif dari memori
        """
        for arg in args:
            if isinstance(arg, bytearray):
                for i in range(len(arg)):
                    arg[i] = 0
            elif isinstance(arg, bytes):
                # Convert to bytearray to overwrite
                mutable = bytearray(arg)
                for i in range(len(mutable)):
                    mutable[i] = 0
            elif isinstance(arg, str):
                # Cannot modify strings in Python, just let GC handle
                pass


encryption_service = EncryptionService()