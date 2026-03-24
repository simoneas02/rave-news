import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Tester <send-teste@gmail.com>",
      to: "get-test@gmail.com",
      subject: "Sending an email test",
      text: "This a sending email tester",
    });

    await email.send({
      from: "Tester <send-teste@gmail.com>",
      to: "get-test@gmail.com",
      subject: "Last email test sent",
      text: "This the last email tester",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<send-teste@gmail.com>");
    expect(lastEmail.recipients[0]).toBe("<get-test@gmail.com>");
    expect(lastEmail.subject).toBe("Last email test sent");
    expect(lastEmail.text).toBe("This the last email tester\n");
  });
});
