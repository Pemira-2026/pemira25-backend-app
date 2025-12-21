"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addOtpEmailJob = exports.emailQueue = exports.EMAIL_QUEUE_NAME = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../config/redis"));
// Define the queue name
exports.EMAIL_QUEUE_NAME = 'email-queue';
// Create the queue instance
exports.emailQueue = new bullmq_1.Queue(exports.EMAIL_QUEUE_NAME, {
    connection: redis_1.default,
});
// Helper to add OTP email job
const addOtpEmailJob = (email, otp, name) => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.emailQueue.add('send-otp', {
        email,
        otp,
        name,
    }, {
        attempts: 3, // Retry 3 times if fails
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: 1000, // Keep last 1000 failed jobs for inspection
    });
});
exports.addOtpEmailJob = addOtpEmailJob;
