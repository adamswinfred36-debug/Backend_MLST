const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// GET - Configurações públicas (sem auth)
router.get('/public', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json({
      pixKey: settings.pixKey || '',
      pixTxidDefault: settings.pixTxidDefault || 'ABC',
      whatsappNumber: settings.whatsappNumber || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
