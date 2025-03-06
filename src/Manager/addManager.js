const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const { transporter } = require('../utils/transporter');

app.http("addManager", {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const bodyText = await req.text();
            const body = JSON.parse(bodyText);
            const { first_name, last_name, email, country_code, phone } = body;
            if (!first_name || !last_name || !email || !country_code || !phone) {
                context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "All fields are required"
                    })
                }
                return
            }
            await connectDb(client);

            const countQuery = `SELECT * FROM userTable WHERE is_superuser = TRUE LIMIT 1`;
            const countResult = await client.query(countQuery);

            const superuserID = countResult.rows[0].id;

            if (countResult === 0) {
                context.res = {
                    status: 403,
                    success: false,
                    body: JSON.stringify({
                        error: "No superuser exists. Cannot add staff without a superuser."
                    })
                };
                return
            }


            // const hashedPassword = await bcrypt.hash(password, 10);
            const query = `
                    INSERT INTO userTable (first_name, last_name, email, country_code, phone, role_id, is_manager, invitation_status) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                    RETURNING *
                `;

            const values = [first_name, last_name, email, country_code, phone, 2, true, "pending"];
            const result = await client.query(query, values);

            const Manager_details = result.rows[0];

            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 3600000);
            // const resetTokenExpires = new Date(Date.now() + 60000); //2min

            const existingToken = await client.query(`
                    SELECT *
                    FROM oneTimeLink
                    WHERE user_id = $1
                `, [Manager_details.id]
            )
            if (existingToken.rowCount > 0) {
                await client.query(`
                    UPDATE oneTimeLink
                    SET token=$1, expires_at=$2, code_type=$3, is_expired= $4, invited_by=$5
                    WHERE user_id=$6
                `, [resetToken, resetTokenExpires, 'invite', false, superuserID, Manager_details.id])
            }
            else {
                await client.query(`
                    INSERT INTO oneTimeLink (user_id, token, expires_at, code_type, is_expired, invited_by)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [Manager_details.id, resetToken, resetTokenExpires, 'invite', false, superuserID])
            }

            const invitationLink = `http://localhost:7071/api/setPassword?resetToken=${resetToken}`;

            await transporter.sendMail({
                from: `Diksha Ladke ${process.env.SMTP_USER}`,
                to: email,
                subject: 'Staff Onboarding Invitation',
                text: `Hello ${first_name},\n\nYou have been invited to set your password.\nPlease click the following link to set your password: ${invitationLink}\n\nThis link will expire in ${resetTokenExpires}.`
            },
                (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                    } else {
                        console.log('Email sent:', info.response);
                    }
                }
            )

            context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "manager added successfully and invitation sent",
                    body: result.rows[0]
                })
            }
            return
        } catch (error) {
            console.error('Error while adding the manager', error);
            context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            }
            return

        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
})