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
function updateEmails() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Updating emails...');
        // Update admin
        yield db_1.db.update(schema_1.users)
            .set({ email: 'admin@sttnf.ac.id' })
            .where((0, drizzle_orm_1.eq)(schema_1.users.nim, 'admin'));
        // Update student
        yield db_1.db.update(schema_1.users)
            .set({ email: '0110224174@student.nurulfikri.ac.id', name: 'Oktaa' }) // Adding name for testing
            .where((0, drizzle_orm_1.eq)(schema_1.users.nim, '12345'));
        console.log('Emails updated.');
        process.exit(0);
    });
}
updateEmails();
