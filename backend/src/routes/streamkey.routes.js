const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  saveAccount,
  getMyAccounts,
  deleteAccount,
  updateAccount,
} = require('../controllers/streamkey.controller');

router.post('/save', protect, saveAccount);
router.get('/my', protect, getMyAccounts);
router.delete('/delete/:platform/:accountId', protect, deleteAccount);
router.patch('/update/:platform/:accountId', protect, updateAccount);

module.exports = router;
