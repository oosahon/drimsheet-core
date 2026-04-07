import transactionalEmailWorker from './transactional-email.worker';

function registerWorkers() {
  try {
    transactionalEmailWorker();
  } catch (error) {
    console.error('Failed to register workers', error);
  }
}

export default registerWorkers;
