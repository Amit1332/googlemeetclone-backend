function buildPasswordBase(seed = "User") {
  const alphaOnly = String(seed).replace(/[^a-zA-Z]/g, "").trim();
  const safeBase = alphaOnly || "User";
  const normalized =
    safeBase.charAt(0).toUpperCase() + safeBase.slice(1).toLowerCase();

  if (normalized.length >= 2 && /[a-z]/.test(normalized.slice(1))) {
    return normalized;
  }

  return "User";
}

function generateStrongPassword(seed = "User") {
  const base = buildPasswordBase(seed);
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return base + "@" + digits;
}

module.exports = {
  generateStrongPassword,
};
