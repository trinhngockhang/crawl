export default {
  mongoUrl: process.env.MONGO_URL || 'mysql://root:123456@localhost:3306/kmp3?charset=utf8mb4_unicode_ci&connectionLimit=10&flags=-FOUND_ROWS',
};
