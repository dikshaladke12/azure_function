const { connect_client, closeDb, connectDb } = require("./db")

const createTableforUser = async () => {
    const client = connect_client();
    try {
        await connectDb(client);
        const query = `
            CREATE TABLE userTable (
                id SERIAL PRIMARY KEY,
                date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_superuser BOOLEAN DEFAULT FALSE,
                is_staff BOOLEAN DEFAULT FALSE,
                is_manager BOOLEAN DEFAULT FALSE,       
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                image VARCHAR(255),
                country_code VARCHAR(10) NOT NULL CHECK (country_code ~ '^\\+[1-9][0-9]{0,2}$'),
                phone VARCHAR(20) UNIQUE,
                password VARCHAR(255),
                is_email_verified BOOLEAN DEFAULT FALSE,
                is_phone_verified BOOLEAN DEFAULT FALSE,           
                invitation_status VARCHAR(50) CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
                role_id INTEGER,                
                created_by INT NOT NULL,
                updated_at TIMESTAMP DEFAULT TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_updated_by INT NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_by INT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
            );`

        console.log("Table Created");
        await client.query(query);
    } catch (error) {
        console.error('Error creating users table:', error);
        return;
    }
    finally {
        await closeDb(client);
    }
}

module.exports = {createTableforUser}