const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


describe("User Routes Test", function () {
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

  /** VIEW ALL USERS GET / => {[users]} */
  describe("GET /users", function () {
    test("can view all users", async function () {
      let response = await request(app)
        .get("/users/")
        .send({ _token: testToken1 });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual([
        {
          "username": "test1",
          "first_name": "TestFirstName",
          "last_name": "TestLastName"
        },
        {
          "username": "test2",
          "first_name": "TestFirstName2",
          "last_name": "TestLastName2"
        }
      ]);
    });
  });

  describe("GET /users/test1", function () {
    test("can view specific user", async function () {
      let response = await request(app)
        .get("/users/test1")
        .send({ _token: testToken1 });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(
        {
          "username": "test1",
          "first_name": "TestFirstName",
          "last_name": "TestLastName",
          "join_at": expect.any(String),
          "last_login_at": null,
          "phone": "+14155550000"
        }
      );
    });
  });
  //happy to case
  describe("GET /users/test2/to", function () {
    test("the user that is logged in can view the messages that were sent to him/her", async function () {
      let response = await request(app)
        .get("/users/test2/to")
        .send({ _token: testToken2 });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(
        {
          "messages": [
            {
              "id": expect.any(Number),
              "body": "u1-to-u2",
              "sent_at": expect.any(String),
              "read_at": null,
              "from_user": {
                "username": "test1",
                "first_name": "TestFirstName",
                "last_name": "TestLastName",
                "phone": "+14155550000"
              }
            }
          ]
        }
      );
    });
  });
  //happy from case
  describe("GET /users/test1/from", function () {
    test("the user that is logged in can view the messages that he/she sent", async function () {
      let response = await request(app)
        .get("/users/test1/from")
        .send({ _token: testToken1 });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(
        {
          "messages": [
            {
              "id": expect.any(Number),
              "body": "u1-to-u2",
              "sent_at": expect.any(String),
              "read_at": null,
              "to_user": {
                "username": "test2",
                "first_name": "TestFirstName2",
                "last_name": "TestLastName2",
                "phone": "+19999999999"
              }
            }
          ]
        }
      );
    });
  });





});