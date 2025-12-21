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
exports.initEmailWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../config/redis"));
const mail_1 = require("../config/mail");
const emailQueue_1 = require("../queue/emailQueue");
const initEmailWorker = () => {
    const worker = new bullmq_1.Worker(emailQueue_1.EMAIL_QUEUE_NAME, (job) => __awaiter(void 0, void 0, void 0, function* () {
        const { email, otp, name } = job.data;
        console.log(`[Worker] Processing OTP email for ${email}`);
        const success = yield (0, mail_1.sendOtpEmail)(email, otp, name);
        if (!success) {
            throw new Error(`Failed to send email to ${email}`);
        }
        return { sent: true, email };
    }), {
        connection: redis_1.default,
        concurrency: 5, // Process 5 emails in parallel
    });
    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} completed. Email sent to ${job.data.email}`);
    });
    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job === null || job === void 0 ? void 0 : job.id} failed: ${err.message}`);
    });
    console.log('[Worker] Email worker started');
    return worker;
};
exports.initEmailWorker = initEmailWorker;
