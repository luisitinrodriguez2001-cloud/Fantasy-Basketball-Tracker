export function save(key, value) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function load(key, def) {
  if (typeof localStorage === 'undefined') return def;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : def;
}
