import pkg from 'pg';
const { Pool } = pkg;

const pooll = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'testing',
    user: 'postgres',
    password: 'chidera442',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pooll.on('connect', () => {
    console.log('Connected to the db');
});

pooll.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});


const dropTables = async () => {
    try {
        await pooll.query("DROP TABLE IF EXISTS Wallets");
        await pooll.query("DROP TABLE IF EXISTS Users");
        await pooll.query("DROP TABLE IF EXISTS Invitations");
        console.log('All tables dropped successfully!');
    } catch (error) {
        console.error('Error dropping tables:', error);
    }
};



const createInvitationsTable = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS Invitations (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token UUID NOT NULL
            );
        `;

        await pooll.query(createTableQuery);
        console.log("Invitations table created successfully!");

    } catch (error) {
        console.error("Error creating Invitations table:", error);
    }
};

const createUsersTable = async () => {
    try {
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL, 
            full_name VARCHAR(255) NOT NULL,
            balance DECIMAL(20, 2) DEFAULT 0.00 NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(255) DEFAULT 'user' NOT NULL,   
            is_active BOOLEAN DEFAULT true NOT NULL     
        );
        `;

        await pooll.query(createTableQuery);
        console.log("Users table created successfully!");

    } catch (error) {
        console.error("Error creating Users table:", error);
    }
};



const createUsersWallet = async () => {
    try {
        const createWalletQuery = `
        CREATE TABLE IF NOT EXISTS Wallets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
            wallet_address UUID UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        `;

        await pooll.query(createWalletQuery);
        console.log("Users wallet table created successfully!");

    } catch (error) {
        console.error("Error creating Users Wallet table:", error);
    }
};


const initializeDatabase = async () => {
    try {
        await dropTables();
        await createInvitationsTable();
        await createUsersTable();
        await createUsersWallet();
        console.log('Database initialization completed successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

initializeDatabase();


export {
    pooll as default,
    createInvitationsTable,
    createUsersTable,
    createUsersWallet
};









// import pkg from 'pg';
// const { Pool } = pkg;

// const pooll = new Pool({
//     host: 'localhost',
//     port: 5432,
//     database: 'testing',
//     user: 'postgres',
//     password: 'chidera442',
//     max: 20,
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 2000,
// });

// pooll.on('connect', () => {
//     console.log('Connected to the db');
// });

// pooll.on('error', (err) => {
//     console.error('Unexpected error on idle client', err);
//     process.exit(-1);
// });

// const dropTables = async () => {
//     try {
//         await pooll.query("DROP TABLE IF EXISTS Wallets;");
//         await pooll.query("DROP TABLE IF EXISTS Users;");
//         await pooll.query("DROP TABLE IF EXISTS Invitations;");
//         console.log("All tables dropped successfully!");
//     } catch (error) {
//         console.error("Error dropping tables:", error);
//     }
// };

// const createInvitationsTable = async () => {
//     try {
//         const createTableQuery = `
//             CREATE TABLE IF NOT EXISTS Invitations (
//                 id SERIAL PRIMARY KEY,
//                 email VARCHAR(255) NOT NULL,
//                 token UUID NOT NULL
//             );
//         `;

//         await pooll.query(createTableQuery);
//         console.log("Invitations table created successfully!");

//     } catch (error) {
//         console.error("Error creating Invitations table:", error);
//     }
// };

// const createUsersTable = async () => {
//     try {
//         const createTableQuery = `
//         CREATE TABLE IF NOT EXISTS Users (
//             id SERIAL PRIMARY KEY,
//             email VARCHAR(255) UNIQUE NOT NULL,
//             password VARCHAR(255) NOT NULL, 
//             full_name VARCHAR(255) NOT NULL,
//             balance DECIMAL(20, 2) DEFAULT 0.00 NOT NULL,
//             slug VARCHAR(255) UNIQUE NOT NULL
//         );
//         `;

//         await pooll.query(createTableQuery);
//         console.log("Users table created successfully!");

//     } catch (error) {
//         console.error("Error creating Users table:", error);
//     }
// };


// const createUsersWallet = async () => {
//     try {
//         const createWalletQuery = `
//         CREATE TABLE IF NOT EXISTS Wallets (
//             id SERIAL PRIMARY KEY,
//             user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
//             wallet_address UUID UNIQUE NOT NULL,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
//         );
//         `;

//         await pooll.query(createWalletQuery);
//         console.log("Users wallet table created successfully!");

//     } catch (error) {
//         console.error("Error creating Users Wallet table:", error);
//     }
// };

// // Drop and then Create the tables
// const initializeDatabase = async () => {
//     await dropTables();
//     await createInvitationsTable();
//     await createUsersTable();
//     await createUsersWallet();
// };


// // Call the function to drop and create the tables
// initializeDatabase();

// export default pooll;
