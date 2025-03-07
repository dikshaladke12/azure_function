require('dotenv').config();
const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


app.http("userSignin", {
    methods: ['POST'],
    authLevel: 'anonymous',
    headers: {
        'Content-Type': 'application/json'
    },
    handler: async function (req, context) {

        const client = connect_client()

        try {
            const bodyText = await req.text();
            const body = JSON.parse(bodyText);
            const { email, password } = body;
            if (!email || !password) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "All fields are required"
                    })

                }
            }

            await connectDb(client);
            const query = 'SELECT * FROM userTable WHERE email = $1';
            const values = [email]
            const result = await client.query(query, values);
            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({
                        error: "invalid email"
                    })
                }
            }

            const user = result.rows[0]
            const isMatched = await bcrypt.compare(password, user.password);
            if (!isMatched) {
                return context.res = {
                    status: 401,
                    success: false,
                    body: JSON.stringify({
                        error: "invalid password"
                    })
                }
            }

            const token = jwt.sign(
                { id: user.id, email: user.email},
                process.env.SECRET_KEY,
                { expiresIn: '1h' }
            )

            const update_lastlogin = `UPDATE userTable SET last_login = NOW() WHERE id=$1`
            await client.query(update_lastlogin, [user.id])


            // const userWithRoleResult = await client.query(
            //     `SELECT u.id, u.first_name, u.last_name, u.email, u.country_code, u.phone, r.role_name, u.last_login, u.date_joined, u.invitation_status, u.is_staff
            //         FROM userTable AS u
            //         JOIN roles AS r 
            //             ON u.role_id = r.id
            //         WHERE u.id = $1
            //     `,[user.role_id]
            // )

            // const data = userWithRoleResult.rows[0];
            // console.log(data, "datas")

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "login successful",
                    token: token,
                    user: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        country_code: user.country_code,
                        phone: user.phone,
                        role: user.role_id,
                        invitation_status: user.invitation_status,
                        last_login: new Date()

                    }
                })
            }
        }

        catch (error) {
            console.log(`error`, error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            }

        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
});