const Router = require("express").Router;
const router = new Router();
const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");
const ExpressError = require("../expressError");
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const message = await Message.get(req.params.id);
    //The following if statement ensures that the currently logged in user is
    //either the sender or the recipient of the message they are attempting to view.
    if (message.from_user.username === req.user.username || message.to_user.username === req.user.username) {
      return res.json(message);
    }
    else {
      throw new ExpressError("You have no business seeing this message.", 401);
    }
  } catch (err) {
    next(err);
  }
});



/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    let message = await Message.create({
      from_username: req.user.username,
      to_username: req.body.to_username,
      body: req.body.body
    });
    return res.json(message);
  } catch (err) {
    next(err);
  }
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
  try {
    let retrievedMsg = await Message.get(req.params.id);
    //The following if statement ensures that the currently logged in user is
    //the recipient of the message they are attempting to view/read.
    if (retrievedMsg.to_user.username === req.user.username) {
      const message = await Message.markRead(req.params.id);
      return res.json(message);
    } else {
      throw new ExpressError("You cannot read a message that was not sent to you.", 401);
    }
  } catch (err) {
    next(err);
  }
})

module.exports = router;