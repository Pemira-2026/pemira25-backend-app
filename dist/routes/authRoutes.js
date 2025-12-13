"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/otp-request', authController_1.requestOtp);
router.post('/otp-verify', authController_1.verifyOtp);
router.post('/reset-otp-limit', authController_1.resetOtpLimit);
exports.default = router;
