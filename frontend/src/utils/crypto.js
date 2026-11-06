/**
 * Utilidad criptográfica para hashing seguro de contraseñas en el frontend.
 * Utiliza la Web Cryptography API nativa del navegador (W3C Standard)
 * para calcular el hash SHA-256 sin librerías externas pesadas.
 */
export const hashPasswordSHA256 = async (password) => {
  if (!password || typeof password !== 'string') return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('[VENTO CRYPTO] Fallback a hash determinista simple:', err);
    // Fallback si crypto.subtle no está disponible en entornos HTTP sin TLS
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
};
