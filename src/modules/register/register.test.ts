import { request } from "graphql-request";
import { User } from "../../entity/User";
import { startServer } from "../../startServer";
import {
  badPassword,
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
} from "./errorMessages";

let getHost = () => "";

beforeAll(async () => {
  const app = await startServer();
  const { port } = app.address();
  getHost = () => `http://127.0.0.1:${port}`;
});

const email = "bob@bob.com";
const password = "bob";

const mutation = (e: string, p: string) => `
  mutation {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

describe("register user", async () => {
  it("check for duplicate emails", async () => {
    // make sure we can register a user
    const response = await request(getHost(), mutation(email, password));
    expect(response).toEqual({ register: null });
    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    const response2: any = await request(getHost(), mutation(email, password));
    expect(response2.register).toHaveLength(1);
    expect(response2.register[0]).toEqual({
      path: "email",
      message: duplicateEmail,
    });
  });

  it("check bad email", async () => {
    const response3: any = await request(getHost(), mutation("b", password));
    expect(response3).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough,
        },
        {
          path: "email",
          message: invalidEmail,
        },
      ],
    });
  });

  it("check bad password", async () => {
    const response4: any = await request(getHost(), mutation(email, "p"));
    expect(response4).toEqual({
      register: [
        {
          path: "password",
          message: badPassword,
        },
      ],
    });
  });

  it("check bad email and password", async () => {
    const response5: any = await request(getHost(), mutation("p", "p"));
    expect(response5).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough,
        },
        {
          path: "email",
          message: invalidEmail,
        },
        {
          path: "password",
          message: badPassword,
        },
      ],
    });
  });
});
