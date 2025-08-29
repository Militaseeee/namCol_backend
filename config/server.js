import express, { json } from 'express';
import cors from 'cors';

export const app = express();

app.use(cors());
app.use(json());

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

export default app;