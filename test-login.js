const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@antojitos.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login exitoso!');
      console.log('\nDatos del usuario:');
      console.log('Email:', data.data.user.email);
      console.log('Nombre:', data.data.user.nombre);
      console.log('Rol:', data.data.user.rol);
      console.log('\nToken generado:', data.data.token.substring(0, 50) + '...');
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testLogin();
