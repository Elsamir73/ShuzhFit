const commonPasswords = new Set([
  "password", "password1", "password12", "password123", "password1234",
  "password12345", "password123456", "password1234567", "password12345678",
  "12345678", "123456789", "1234567890", "12345678910", "123456789a",
  "123456789!", "1234567890!", "qwerty", "qwerty1", "qwerty12",
  "qwerty123", "qwerty1234", "qwertyuiop", "asdfghjkl", "zxcvbnm",
  "iloveyou", "iloveyou1", "admin", "admin123", "admin1234", "letmein",
  "letmein1", "welcome", "welcome1", "welcome123", "abc123", "abc12345",
  "abcd1234", "football", "football1", "baseball", "baseball1", "basketball",
  "monkey", "monkey123", "dragon", "master", "master123", "login",
  "login123", "sunshine", "princess", "trustno1", "passw0rd", "p@ssw0rd",
  "starwars", "whatever", "freedom", "hello123", "hello1234", "shadow",
  "superman", "batman", "access", "mustang", "michael", "jennifer",
  "jordan23", "harley", "ranger", "thomas", "robert", "daniel",
  "summer2024", "summer2025", "winter2024", "winter2025", "changeme",
  "changeme1", "newpassword", "temp1234", "pass1234", "pass12345",
  "pass123456", "123456789!", "987654321", "00000000", "11111111",
  "22222222", "33333333", "44444444", "55555555", "66666666",
  "77777777", "88888888", "99999999", "abcabc12", "qazwsx12",
  "1q2w3e4r", "1qaz2wsx", "qwe123", "qweasdzxc", "654321",
  "65432198", "98765432", "87654321", "passw0rd1", "Password1",
  "Password123", "Welcome1", "Admin123", "Iloveyou1", "Summer123",
  "Test1234", "testing1", "guest123", "user1234", "default123",
  "fitness123", "shuzhfit1", "nepal123",
]);

const sequences = ["abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba", "0123456789", "9876543210"];

function containsSequence(value: string): boolean {
  return sequences.some((sequence) => {
    for (let index = 0; index <= sequence.length - 8; index += 1) {
      if (value.includes(sequence.slice(index, index + 8))) return true;
    }
    return false;
  });
}

export function validatePassword(
  password: string,
  personalInfo: { email?: string; name?: string } = {},
): string | null {
  if (password.length < 8 || password.length > 64) {
    return "Password must be 8 to 64 characters.";
  }
  if (/^(.)\1+$/u.test(password)) {
    return "Password cannot be a single repeated character.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number.";
  }

  const normalized = password.toLowerCase();
  if (commonPasswords.has(normalized)) {
    return "Choose a less common password.";
  }
  if (containsSequence(normalized)) {
    return "Password cannot contain a simple sequence of 8 characters.";
  }

  const emailLocalPart = personalInfo.email?.split("@")[0]?.trim().toLowerCase();
  const nameParts = personalInfo.name?.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const personalTerms = [emailLocalPart, ...nameParts]
    .filter((term): term is string => typeof term === "string" && term.length >= 3);
  if (personalTerms.some((term) => normalized.includes(term))) {
    return "Password cannot contain your name or email username.";
  }

  return null;
}
