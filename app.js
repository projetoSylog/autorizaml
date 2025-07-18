const express = require('express');
const app = express();
const path = require('path');
const helmet = require('helmet');
const session = require('cookie-session');
require('dotenv').config();
const meli = require('mercadolibre');
const { validateToken } = require('./middlewares/tokens');
const { meli_get } = require('./utils');
const multer = require('multer');

const { CLIENT_ID, CLIENT_SECRET, SYS_PWD } = process.env;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './public/pictures'),
  filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
});

const upload = multer({ storage });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(helmet());
app.use(session({
  name: 'session',
  keys: ['bd7126f457237e4aab0d47124ce4aac2', '9009def68579d15d871a5bf346422839'],
  cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 60 * 1000 * 6) // 6 horas
  },
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/login', (req, res) => {
  if (req.body.password === SYS_PWD) {
    req.session.user = true;
    res.redirect('/home');
  } else {
    res.redirect('/?error=senha-incorreta');
  }
});

app.get('/home', validateToken, async (req, res) => {
  try {
    const meliObject = new meli.Meli(CLIENT_ID, CLIENT_SECRET, res.locals.access_token);
    const user = await meli_get(meliObject, '/users/me');
    const currencies = await meli_get(meliObject, '/currencies');
    const listing_types = await meli_get(meliObject, `/sites/${user.site_id}/listing_types`);
    res.render('home', {
      user,
      currencies,
      listing_types
    });
  } catch (err) {
    console.log('Something went wrong', err);
    res.status(500).send(`Error! ${err}`);
  }
});


app.get('/notifications', (req, res) => {
  res.send('ok');
  console.log(req.body);
  // Recomendamos enviar um status 200 o mais rapido possível.
  // Você pode fazer algo assíncrono logo em seguida. Salvar num
  // banco de dados de tempo real, como o firebase, por exemplo.
});

module.exports = app;