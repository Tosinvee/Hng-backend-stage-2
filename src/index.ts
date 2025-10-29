import express from 'express';
import { json } from 'express';
import countriesRouter from './country.route';
import { errorHandler } from './error.handler';

const app = express();
app.use(json());

app.use('/countries', countriesRouter);

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
export default app;
