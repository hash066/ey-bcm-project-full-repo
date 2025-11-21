#!/usr/bin/env python
from app.core.security import encrypt_bia_data, decrypt_bia_data, generate_data_checksum

# Test data
test_data = {"test": "BIA encryption", "version": 1}
org_id = "test-org-123"

print("Testing BIA encryption...")
print(f"Original data: {test_data}")

# Test encryption
encrypted = encrypt_bia_data(test_data, org_id)
print(f"Encrypted successfully, ciphertext length: {len(encrypted['ciphertext'])}")
print(f"Key version: {encrypted['key_version']}")

# Test decryption
decrypted = decrypt_bia_data(encrypted, org_id)
print(f"Decrypted data: {decrypted}")

# Verify
success = decrypted == test_data
print(f"Encryption/decryption test: {'PASSED' if success else 'FAILED'}")

# Test checksum
checksum = generate_data_checksum(test_data)
print(f"Data checksum: {checksum}")
