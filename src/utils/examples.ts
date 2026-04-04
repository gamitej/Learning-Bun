// import { auditLogs, db, invoices, students } from "@/database";
// import { sendResponse } from "@/utils/helper";
// import type { Handler } from "hono";

// export const processPayment: Handler = async (c) => {
//   const { studentId, amount } = await c.req.json();

//   const result = await db.transaction(async (tx) => {
//     // 1. NON-TRANSACTIONAL QUERY
//     // We use 'db' here, NOT 'tx'.
//     // If the payment fails later, this log entry stays in the DB!
//     await db.insert(auditLogs).values({
//       action: "PAYMENT_ATTEMPT",
//       details: `Student ${studentId} attempting to pay ${amount}`,
//     });

//     // 2. TRANSACTIONAL QUERIES
//     // We use 'tx' here.
//     // These will roll back if any error occurs.
//     const [invoice] = await tx
//       .insert(invoices)
//       .values({ studentId, amount, status: "PAID" })
//       .returning();

//     // Imagine a failure happens here (e.g., student balance check fails)
//     if (amount > 1000000) {
//       throw new Error("LIMIT_EXCEEDED");
//       // The invoice is ROLLED BACK.
//       // The 'PAYMENT_ATTEMPT' log above is COMMITTED (because it used 'db').
//     }

//     await tx.update(students).set({ lastPaymentDate: new Date() });

//     return invoice;
//   });

//   return sendResponse(c, 200, true, "Payment processed", result);
// };
