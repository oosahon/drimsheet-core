import { Router } from 'express';
import internalUseCases from '../../../infra/ioc/usecases/internal.usecases';

const internalRouter = Router();

internalRouter.get('/test/sent-emails', async (req, res) => {
  const { email, subject } = req.query;
  const emailBody = await internalUseCases.getSentEmail(
    email as string,
    subject as string
  );
  res.status(200).json(emailBody);
});

export default internalRouter;
