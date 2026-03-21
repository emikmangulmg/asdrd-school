const express               = require('express');
const router                = express.Router();
const applicationController = require('../controllers/applicationController');
const { authMiddleware }    = require('../middleware/authMiddleware');

// Публичный маршрут
router.post('/apply', applicationController.createApplication);

// Защищённые маршруты — authMiddleware применяется ко всем ниже
router.use(authMiddleware);
router.get('/applications',      applicationController.getAllApplications);
router.delete('/applications/:id', applicationController.deleteApplication);
router.put('/applications/:id',  applicationController.updateStatus);

module.exports = router;
