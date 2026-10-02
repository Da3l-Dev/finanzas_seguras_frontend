// ---------- Email ----------
export function validateEmail(email: string): string | null {
  if (!email.trim()) return "El email es obligatorio";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return "Email inválido";
  return null;
}

// ---------- Teléfono (MX = 10 dígitos) ----------
export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "El teléfono es obligatorio";
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return "Debe tener 10 dígitos";
  return null;
}

// ---------- Password ----------
export function validatePassword(password: string): string | null {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 8) return "Mínimo 8 caracteres";
  if (!/[A-Z]/.test(password)) return "Debe tener una mayúscula";
  if (!/[a-z]/.test(password)) return "Debe tener una minúscula";
  if (!/[0-9]/.test(password)) return "Debe tener un número";
  return null;
}

// ---------- Nombre ----------
export function validateFirstName(name: string): string | null {
  if (!name.trim()) return "El nombre es obligatorio";
  if (name.trim().length < 2) return "Mínimo 2 caracteres";
  return null;
}

export function validateLastName(name: string): string | null {
  if (!name.trim()) return "El apellido es obligatorio";
  if (name.trim().length < 2) return "Mínimo 2 caracteres";
  return null;
}

// ---------- Helper para formatear teléfono ----------
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
