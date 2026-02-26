import dotenv from 'dotenv';
import { createServerApp } from './src/app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const { httpServer } = createServerApp();

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
