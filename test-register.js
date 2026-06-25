// Test script para verificar el registro
const testData = {
  email: "test@example.com",
  nombre: "Test User",
  telefono: "123456789",
  password: "123456"
};

fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));