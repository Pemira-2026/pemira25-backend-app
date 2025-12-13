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
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
function resetUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetEmail = '0110224174@student.nurulfikri.ac.id';
        console.log(`Resetting vote status for ${targetEmail}...`);
        // Get user
        const userResult = yield db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, targetEmail));
        if (userResult.length === 0) {
            console.error('User not found!');
            process.exit(1);
        }
        const user = userResult[0];
        // Delete vote record
        yield db_1.db.delete(schema_1.votes).where((0, drizzle_orm_1.eq)(schema_1.votes.voterId, user.id));
        console.log('Vote record deleted.');
        // Reset hasVoted flag
        yield db_1.db.update(schema_1.users)
            .set({ hasVoted: false })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        console.log('User hasVoted flag reset to false.');
        console.log('Done! valid for re-voting.');
        process.exit(0);
    });
}
resetUser();
