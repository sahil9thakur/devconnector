const express = require('express');
const router = express.Router();
const gravator = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {
  check,
  validationResult
} = require('express-validator/check');

const User = require('../../models/User');

// @route    POST api/users
// @desc     Register User
// @access   Public
router.post('/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password of 6 characters or more').isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.log(req.body);

      return res.status(400).json({
        req,
        errors: errors.array()
      })
    }

    const {
      name,
      email,
      password
    } = req.body;

    try {
      // See if the user exists
      let user = await User.findOne({
        email
      });

      if (user) {
        return res.status(400).json({
          errors: [{
            msg: 'User already exists'
          }]
        })
      }

      // Get users gravator
      const avatar = gravator.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      })

      user = new User({
        name,
        email,
        avatar,
        password
      })

      // Encrypt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return json web token
      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(
        payload,
        config.get('jwtSecret'), {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) console.log(err);
          else res.json({
            token
          })
        });

    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');

    }
  })

module.exports = router;