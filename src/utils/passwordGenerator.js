function generateStrongPassword(length = 12) {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specials = "!@#$%^&*()_+[]{}|;:,.<>?";
  const allChars = letters + numbers + specials;

  let password = "";
  password += letters.charAt(Math.floor(Math.random() * letters.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specials.charAt(Math.floor(Math.random() * specials.length));

  for (let i = 3; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return password.split("").sort(() => Math.random() - 0.5).join("");
}


module.exports = {
  generateStrongPassword, 
}