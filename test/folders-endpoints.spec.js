const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeFoldersArray, makeMaliciousFolder } = require("./folders.fixture");

describe("Folders Endpoints", function() {
  let db;
  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () =>
    db.raw(
      "TRUNCATE noteful_folders RESTART IDENTITY CASCADE"
    )
  );

  afterEach("cleanup", () =>
    db.raw(
      "TRUNCATE noteful_folders RESTART IDENTITY CASCADE"
    )
  );

  describe(`GET /api/folders`, () => {
    context(`Given no folders`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get("/api/folders")
          .expect(200, []);
      });
    });
    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();
      beforeEach("insert articles", () => {
        return db
        .into('noteful_folders')
        .insert(testFolders)
        .then(() => {
          return db 
        })
      });
      it("GET /api/articles responds with 200 and all of the articles", () => {
        return supertest(app)
          .get("/api/folders")
          .expect(200, testFolders);
      });
    });
    context(`Given an XSS attack folder`, () => {
      const testFolders = makeFoldersArray();
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

      beforeEach("insert malicious folder", () => {
        return db
        .into('noteful_folders')
        .insert([ maliciousFolder ])
          .then(() => {
            return db
          });
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/folders`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].folder_name).to.eql(expectedFolder.folder_name);
            
          });
      });
    });
});
})