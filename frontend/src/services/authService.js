// src/services/authService.js
export async function registerUser(username, email, password) {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  }
  
  export async function loginUser(emailOrUsername, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  }
  