// npx ts-node src/scripts/reset_test_user.ts

import { db } from '../config/db';
import { users, votes } from '../db/schema';
import { eq } from 'drizzle-orm';

async function resetUser() {
     const targetEmail = '0110224174@student.nurulfikri.ac.id';
     console.log(`Resetting vote status for ${targetEmail}...`);

     // Get user
     const userResult = await db.select().from(users).where(eq(users.email, targetEmail));

     if (userResult.length === 0) {
          console.error('User not found!');
          process.exit(1);
     }

     const user = userResult[0];

     // db.delete(votes) is not possible as votes are anonymous (no voterId column)
     // We only reset the user's flag so they can vote again.
     // The original vote will remain in the count.
     console.log('Skipping vote record deletion (votes are anonymous).');

     // Reset hasVoted flag
     await db.update(users)
          .set({ hasVoted: false })
          .where(eq(users.id, user.id));

     console.log('User hasVoted flag reset to false.');

     console.log('Done! valid for re-voting.');
     process.exit(0);
}

resetUser();
