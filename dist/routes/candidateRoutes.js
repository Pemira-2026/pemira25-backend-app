"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const candidateController_1 = require("../controllers/candidateController");
const router = (0, express_1.Router)();
router.get('/', candidateController_1.getCandidates);
exports.default = router;
