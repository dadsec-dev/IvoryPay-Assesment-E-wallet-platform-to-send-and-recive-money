import pooll, { createInvitationsTable, createUsersTable, createUsersWallet } from "./db";

const initializeDatabase = async () => {
    await createInvitationsTable();
    await createUsersTable();
    await createUsersWallet();
    console.log("All tables created successfully!");
    pooll.end();  // Close the database connection
};

initializeDatabase();
