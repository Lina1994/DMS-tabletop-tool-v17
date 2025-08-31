// src/apiConfig.js
let API_BASE_URL;

if (typeof window !== 'undefined' && window.require && window.require('electron')) {
  // Running in Electron renderer process
  API_BASE_URL = 'http://localhost:3001';
} else {
  // Running in a web browser
  // For remote access, ensure your PC's IP address is used instead of 'localhost'
  // when accessing the frontend. The backend will then be accessed on the same IP, port 3001.
  API_BASE_URL = `http://${window.location.hostname}:3001`;
}

export default API_BASE_URL;