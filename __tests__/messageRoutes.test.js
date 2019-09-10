const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


describe("Message Routes Test", function () {
  let testToken1;
  let testToken2;

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "TestFirstName",
      last_name: "TestLastName",
      phone: "+14155550000",
    });

    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "TestFirstName2",
      last_name: "TestLastName2",
      phone: "+19999999999"
    })

    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "u1-to-u2"
    });
    let payload1 = { username: u1.username };
    testToken1 = jwt.sign(payload1, SECRET_KEY);
    let payload2 = { username: u2.username };
    testToken2 = jwt.sign(payload2, SECRET_KEY);
  });


  describe("GET /messages/:id", function () {
    test("either the sender or the recipient of a message should be able to view the message by its' id", async function () {
      const result = await db.query(
        `SELECT * FROM messages`);
      let msgId = result.rows[0].id;
      let response = await request(app)
        .get(`/messages/${msgId}`)
        .send({ _token: testToken1 });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(
        {
          "id": msgId,
          "from_user": {
            "username": "test1",
            "first_name": "TestFirstName",
            "last_name": "TestLastName",
            "phone": "+14155550000"
          },
          "to_user": {
            "username": "test2",
            "first_name": "TestFirstName2",
            "last_name": "TestLastName2",
            "phone": "+19999999999"
          },
          "body": "u1-to-u2",
          "sent_at": expect.any(String),
          "read_at": null
        }
      );
    });
  })


  describe("GET /messages/:id/read", function () {
    test("the read_at of a message should update when the recipient of the message first reads the message.", async function () {
      const result = await db.query(
        `SELECT * FROM messages`);
      let msgId = result.rows[0].id;
      let response = await request(app)
        .post(`/messages/${msgId}/read`)
        .send({ _token: testToken2 });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(
        {
          "id": msgId,
          "to_username": "test2",
          "read_at": expect.any(String)
        }
      );
    });
  });



  describe("POST /messages/", function () {
    test("should be albe to create a new message by posting", async function () {
      let response = await request(app)
        .post("/messages")
        .send(
          {
            from_username: "test2",
            to_username: "test1",
            body: "u2-to-u1-test",
            _token: testToken2
          });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(
        {
          "id": expect.any(Number),
          "from_username": "test2",
          "to_username": "test1",
          "body": "u2-to-u1-test",
          "sent_at": expect.any(String)
        }
      );
    });
  });



});