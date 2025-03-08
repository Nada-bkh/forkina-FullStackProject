// routes/milestoneRoutes.js
const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');

router.post('/', milestoneController.createMilestone);
router.get('/', milestoneController.getAllMilestones);
router.get('/:id', milestoneController.getMilestoneById);
router.put('/:id', milestoneController.updateMilestone);
router.delete('/:id', milestoneController.deleteMilestone);

module.exports = router;
