//invocation of express
const express = require('express');
const app = express();

//set urlencoded to fetch form data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//invocation of dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

//Using the public directory
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//We set the ejs template engine
app.set('view engine', 'ejs');

//Session Variable Settings
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//invocation to the database
const connection = require('./database/db');

//establishing routes
// app.get('/', (req, res) => {
//     res.render('index');
// });

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/changePass', (req, res) => {
    res.render('changePass');
});

//Register
app.post('/register', (req, res) => {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const accountType = req.body.accountType;
    const password = temporaryPass(email, accountType);

    connection.query('SELECT COUNT(*) as nameCount FROM users WHERE email = ?', [email], function (err, rows) {
        if (err) {
            throw err;
        } else {
            let cant = rows[0].nameCount;
            if (cant >= 1) {
                res.render('register', {
                    alert: true,
                    alertTitle: "Sign up",
                    alertMessage: "User " + email + " already exists!",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: 10000,
                    ruta: ''
                })
            }
            else {
                connection.query('INSERT INTO users SET ?', {
                    email: email, password: password,
                    firstName: firstName, lastName: lastName,
                    accountType: accountType
                }, async (error, results) => {
                    if (error) {
                        res.render('register', {
                            alert: true,
                            alertTitle: "Sign up",
                            alertMessage: "Registry error!",
                            alertIcon: 'error',
                            showConfirmButton: true,
                            timer: 10000,
                            ruta: ''
                        })
                    } else {
                        res.render('register', {
                            alert: true,
                            alertTitle: "Successful registration!",
                            alertMessage: "The password has been sent to your email: " + email + "Password: " + password,
                            alertIcon: 'success',
                            showConfirmButton: true,
                            timer: 15000,
                            ruta: ''
                        })
                    }
                })
            }
        }
    });
});

//Password creation function
function temporaryPass(email, accountType) {
    let num = Math.random();

    let ret = email + accountType + num
    return ret;
}

//Login
app.post('/auth', (req, res) => {
    const email = req.body.email;
    const password = req.body.password

    if (email && password) {
        connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {

            if (results.length == 0 || results[0].password !== password) {
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Login error!",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: 10000,
                    ruta: 'login'
                });
            } else if (results[0].password == password && results[0].authe == 0) {
                req.session.loggedin = true;
                req.session.email = results[0].email;
                req.session.firstName = results[0].firstName;
                req.session.lastName = results[0].lastName;
                req.session.accountType = results[0].accountType;
                res.render('changePass', {
                    alert: true,
                    alertTitle: "Ready",
                    alertMessage: "Now, change your password",
                    alertIcon: 'success',
                    showConfirmButton: true,
                    timer: 10000,
                    ruta: 'changePass'
                });
            } else {
                req.session.loggedin = true;
                req.session.email = results[0].email;
                req.session.firstName = results[0].firstName;
                req.session.lastName = results[0].lastName;
                req.session.accountType = results[0].accountType;
                res.render('register', {
                    alert: true,
                    alertTitle: "Sign up",
                    alertMessage: "Successful login!",
                    alertIcon: 'success',
                    showConfirmButton: true,
                    timer: 10000,
                    ruta: ''
                });
            }
        })
    } else {
        res.render('login', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Enter email and password!",
            alertIcon: 'error',
            showConfirmButton: true,
            timer: 10000,
            ruta: 'login'
        });
    }
});

//change of password
app.post('/changePass', (req, res) => {
    const password = req.body.password;
    const email = req.session.email;

    connection.query('UPDATE users SET ? WHERE email = ?', [{ password: password, authe: 1 }, email], async (error, results) => {
        if (error) {
            res.render('changePass', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "Error",
                alertIcon: 'error',
                showConfirmButton: true,
                timer: 10000,
                ruta: ''
            })
        } else {
            req.session.loggedin = true;
            res.render('changePass', {
                alert: true,
                alertTitle: "Success",
                alertMessage: "The change was made",
                alertIcon: 'success',
                showConfirmButton: true,
                timer: 10000,
                ruta: ''
            })
        }
    });
});


//Auth pages
app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.render('index', {
            login: true,
            name: req.session.firstName + " " + req.session.lastName,
            group: req.session.accountType
        });
    } else {
        res.render('index', {
            login: false,
            name: 'You must log in or sign up',
            group: ""
        });
    }
})

//Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
})

app.listen(3002, (req, res) => {
    console.log('Server runnin in http://localhost:3002');
});