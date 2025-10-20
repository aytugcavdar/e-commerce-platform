const bcrypt = require('bcryptjs');

class PasswordUtils {
    static async hash(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async compare(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}