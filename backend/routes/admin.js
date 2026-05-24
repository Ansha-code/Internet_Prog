const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getActivityLogs,
  getPlatformStats,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/activity', getActivityLogs);
router.get('/stats', getPlatformStats);

module.exports = router;
