"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voteController_1 = require("../controllers/voteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authenticateToken, voteController_1.vote);
router.get('/status', authMiddleware_1.authenticateToken, voteController_1.getVoteStatus);
router.get('/stats', voteController_1.getStats); // Public
router.get('/results', voteController_1.getResults); // Public
exports.default = router;
