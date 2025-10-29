import { Router } from 'express';
import { CountryController } from './country.controller';

const router = Router();

router.post('/refresh', CountryController.refresh);

router.get('/status', CountryController.getStatus);

router.get('/', CountryController.getAll);

router.get('/:name', CountryController.getByName);

router.delete('/:name', CountryController.delete);

export default router;
