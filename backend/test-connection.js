const mongoose = require('mongoose');
require('dotenv').config();

console.log('MONGO_URI из .env:', process.env.MONGO_URI);

const connectDB = async () => {
  try {
    console.log('Попытка подключения к MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB подключен: ${conn.connection.host}`);

    // Попробуем выполнить простой запрос
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Доступные коллекции:', collections.map(c => c.name));

    // Закроем соединение
    await mongoose.disconnect();
    console.log('Отключен от MongoDB');
    process.exit(0);
  } catch (error) {
    console.error(`Ошибка: ${error.message}`);
    process.exit(1);
  }
};

connectDB();