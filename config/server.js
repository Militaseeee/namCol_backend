import express, { json } from 'express';
import cors from 'cors';

export const app = express();

app.use(cors());
app.use(json());

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));