const { connect_client, connectDb, closeDb } = require('../tables/db')

const project = async () => {
    const client = connect_client();
    try {
        await connectDb(client)
        const query =
            `CREATE TABLE IF NOT EXISTS project(
                id SERIAL PRIMARY KEY,
                project_name VARCHAR(255) NOT NULL,
                project_number VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                address TEXT,
                project_manager_id INTEGER NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP,
                file TEXT[],
                is_enable BOOLEAN DEFAULT TRUE,               
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                is_deleted BOOLEAN DEFAULT FALSE,
                timeline_id INTEGER,
                CONSTRAINT fk_project_timeline FOREIGN KEY (timeline_id)
                    REFERENCES public.project_timeline (id)
                    ON DELETE SET NULL            
            )`;
        console.log("Project table created successfully");
        await client.query(query);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return null;
    }
    finally {
        if (client)
            closeDb(client);
    }
}

module.exports = { project }
