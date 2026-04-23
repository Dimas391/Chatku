print(' Menginisialisasi database chatku_db...');

// Buat collections dengan validator schema
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'display_name', 'created_at'],
      properties: {
        username: { bsonType: 'string', minLength: 3 },
        display_name: { bsonType: 'string', minLength: 1 },
        is_active: { bsonType: 'bool' },
        is_verified: { bsonType: 'bool' },
      }
    }
  }
});

db.createCollection('chats');
db.createCollection('messages');
db.createCollection('calls');
db.createCollection('otp_fallback');

// Buat user dummy untuk testing
db.users.insertOne({
  username: 'testuser',
  display_name: 'Test User',
  phone: '081234567890',
  is_active: true,
  is_verified: true,
  is_online: false,
  contacts: [],
  blocked_users: [],
  created_at: new Date(),
  updated_at: new Date(),
  last_seen: new Date(),
  bio: 'Akun testing',
});

print('Database chatku_db berhasil diinisialisasi.');
print('👤 User testing: username=testuser, phone=081234567890');
