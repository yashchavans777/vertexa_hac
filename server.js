require('dotenv').config({ path: './.env' });
const connectDB = require('./src/db/index');
const app = require('./src/app');

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`[ActionGate Server] Security gateway listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`[Fatal] Database connection error: ${err.message}`);
    process.exit(1);
  });
