import { User } from "../entity/User";
import { createConfirmEmailLink } from "./createConfirmEmailLink";
import { createTypeormConn } from "./createTypeormConn";
import * as Redis from "ioredis";
import fetch from "node-fetch";

let userId = "";
const redis = new Redis();

beforeAll(async () => {
  await createTypeormConn();
  const user = await User.create({
    email: "mina2@mina.com",
    password: "nsdacind2",
  }).save();
  userId = user.id;
});

describe("test create email link", () => {
  test("check confirm email works", async () => {
    const url = await createConfirmEmailLink(
      process.env.TEST_HOST as string,
      userId,
      redis
    );

    const response = await fetch(url);
    const text = await response.text();
    expect(text).toEqual("ok");

    const user = await User.findOne({ where: { id: userId } });
    expect((user as User).confirmed).toBeTruthy;
    const chunks = url.split("/");
    const key = chunks[chunks.length - 1];
    const value = await redis.get(key);
    expect(value).toBeNull();
  });

  test("sends invalid back if bad id sent", async () => {
    const response = await fetch(`${process.env.TEST_HOST}/confirm/ddddd`);
    const text = await response.text();
    expect(text).toEqual("invalid");
  });
});
