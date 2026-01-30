function readEnv(key, fallback = "", env = process.env) {
  const raw = env[key];
  if (raw === undefined || raw === null) return fallback;
  const value = String(raw).trim();
  return value ? value : fallback;
}

module.exports = { readEnv };
