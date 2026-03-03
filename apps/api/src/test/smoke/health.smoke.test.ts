describe("API smoke", () => {
  it("responds from /health", async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/aeria";
    const { buildApp } = await import("../../app.js");
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });
});
