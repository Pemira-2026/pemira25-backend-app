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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = void 0;
const redis_1 = require("../config/redis");
const checkRateLimit = (key, limit, durationSeconds) => __awaiter(void 0, void 0, void 0, function* () {
    const current = yield redis_1.redisConnection.incr(key);
    // Set expiry on first request
    if (current === 1) {
        yield redis_1.redisConnection.expire(key, durationSeconds);
    }
    // Get TTL to inform user when they can try again
    const ttl = yield redis_1.redisConnection.ttl(key);
    if (current > limit) {
        return { allowed: false, remaining: 0, ttl };
    }
    return { allowed: true, remaining: limit - current, ttl };
});
exports.checkRateLimit = checkRateLimit;
