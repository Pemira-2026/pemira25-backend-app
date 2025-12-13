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
const db_1 = require("./config/db");
const schema_1 = require("./db/schema");
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding...');
        // Users
        yield db_1.db.insert(schema_1.users).values([
            { nim: 'admin', role: 'admin' },
            { nim: '12345', role: 'voter' }
        ]).onConflictDoNothing();
        // Candidates
        yield db_1.db.insert(schema_1.candidates).values([
            {
                orderNumber: 1,
                name: 'Budi Santoso & Siti Aminah',
                vision: 'Mewujudkan BEM STTNF yang inklusif, inovatif, dan berintegritas.',
                mission: 'Meningkatkan partisipasi mahasiswa dalam kegiatan kampus.\nMembangun kolaborasi strategis dengan pihak eksternal.\nMengoptimalkan penggunaan teknologi dalam layanan kemahasiswaan.',
                photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww'
            },
            {
                orderNumber: 2,
                name: 'Andi Pratama & Rina Wati',
                vision: 'STTNF Berdaya, Mahasiswa Berkarya.',
                mission: 'Memfasilitasi pengembangan minat dan bakat mahasiswa.\nMenciptakan lingkungan kampus yang aspiratif dan demokratis.\nMenjaga transparansi dan akuntabilitas organisasi.',
                photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXZhdGFyfGVufDB8fDB8fHww'
            }
        ]).onConflictDoNothing();
        console.log('Seeding complete');
        process.exit(0);
    });
}
seed();
