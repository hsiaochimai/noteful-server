const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeFoldersArray, makeMaliciousFolder } = require("./folders.fixture");
const { API_TOKEN } = process.env;

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
          .set("Authorization", `Bearer ${API_TOKEN}`)
          .expect(200, []);
      });
    });
    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();
      beforeEach("insert folders", () => {
        return db
        .into('noteful_folders')
        .insert(testFolders)
        .then(() => {
          return db 
        })
      });
      it("GET /api/folders responds with 200 and all of the folders", () => {
        return supertest(app)
          .get("/api/folders")
          .set("Authorization", `Bearer ${API_TOKEN}`)
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
          .set("Authorization", `Bearer ${API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].folder_name).to.eql(expectedFolder.folder_name);
            
          });
      });
    });
});
describe.only(`GET /api/folders/:folder_id `, () => {
  context(`Given no folders`, () => {
    it(`responds with 404`, () => {
      const folder_id = 123456;
      return supertest(app)
        .get(`/api/folders/${folder_id}`)
        .set("Authorization", `Bearer ${API_TOKEN}`)
        .expect(404, { error: { message: `Folder doesn't exist` } });
    });

  });
context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();
      beforeEach("insert folders", () => {
        return db.into('noteful_folders')
        .insert(testFolders)
        .then(() => {
          return db
        })
      });
      it(" responds with 200 and the specified folder", () => {
        const folderId = 2;
        const expectedFolder = testFolders[folderId - 1];
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .set("Authorization", `Bearer ${API_TOKEN}`)
          .expect(200, expectedFolder);
      });

})
context(`Given an XSS attack folder`, () => {
  const testFolders = makeFoldersArray();
  const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

  beforeEach("insert malicious Folder", () => {
    return db
    .into('noteful_folders')
    .insert(testFolders)
    .then(() => {
      return db
        .into('noteful_folders')
        .insert([ maliciousFolder ])
    });
  });

  it("removes XSS attack content", () => {
    return supertest(app)
      .get(`/api/folders/${maliciousFolder.id}`)
      .set("Authorization", `Bearer ${API_TOKEN}`)
      .expect(200)
      .expect(res => {
        expect(res.body.folder_name).to.eql(expectedFolder.folder_name);
      });
  });
});
})
describe.only(`POST /api/folders`, () => {
  it(`creates a folder, responding with 201 and the new folder`, function() {
    this.retries(3);
    const newFolder = {
      folder_name: "Test new folder",
    };
    return supertest(app)
      .post("/api/folders")
      .send(newFolder)
      .set("Authorization", `Bearer ${API_TOKEN}`)
      .expect(201)
      .expect(res => {
        expect(res.body.folder_name).to.eql(newFolder.folder_name);
        expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
      })
      .then(postRes =>
        supertest(app)
          .get(`/api/folders/${postRes.body.id}`)
          .set("Authorization", `Bearer ${API_TOKEN}`)
          .expect(postRes.body)
      );
  });
})
describe.only(`DELETE /api/folders/:folder_id`, () => {
  context(`Given no folders`, () => {
    it(`responds with 404`, () => {
      const folderId = 123456;
      return supertest(app)
        .delete(`/api/folders/${folderId}`)
        .set("Authorization", `Bearer ${API_TOKEN}`)
        .expect(404, { error: { message: `Folder doesn't exist` } });
    });
  });
  context("Given there are folders in the database", () => {
    const testFolders = makeFoldersArray();

    beforeEach("insert folders", () => {
      return db.into('noteful_folders')
      .insert(testFolders)
      .then(() => {
        return db
      })
  })
    it("responds with 204 and removes the folder", () => {
      const idToRemove = 2;
      const expectedFolders = testFolders.filter(
        folder => folder.id !== idToRemove
      );
      return supertest(app)
        .delete(`/api/folders/${idToRemove}`)
        .set("Authorization", `Bearer ${API_TOKEN}`)
        .expect(204)
        .then(res =>
          supertest(app)
            .get(`/api/folders`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(expectedFolders)
        );
    });
  });
});
describe.only(`PATCH /api/folders/:folder_id`, () => {
  context(`Given no folders`, () => {
    it(`responds with 404`, () => {
      const folderId = 123456;
      return supertest(app)
        .patch(`/api/folders/${folderId}`)
        .set("Authorization", `Bearer ${API_TOKEN}`)
        .expect(404, { error: { message: `Folder doesn't exist` } });
    });
  });
  context("Given there are folders in the database", () => {
    const testFolders = makeFoldersArray();

    beforeEach("insert folders", () => {
      return db.into('noteful_folders')
      .insert(testFolders)
      .then(() => {
        return db
      })
    });

    it("responds with 204 and updates the folder", () => {
      const idToUpdate = 2;
      const updateFolder = {
        folder_name: "updated folder title",
      };
      const expectedFolder = {
        ...testFolders[idToUpdate - 1],
        ...updateFolder
      };
      return supertest(app)
        .patch(`/api/folders/${idToUpdate}`)
        .set("Authorization", `Bearer ${API_TOKEN}`)
        .send(updateFolder)
        .expect(204)
        .then(res =>
          supertest(app)
            .get(`/api/folders/${idToUpdate}`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(expectedFolder)
        );
    });
    it(`responds with 400 when no required fields supplied`, () => {
           const idToUpdate = 2
           return supertest(app)
             .patch(`/api/folders/${idToUpdate}`)
             .set("Authorization", `Bearer ${API_TOKEN}`)
             .send({ irrelevantField: 'foo' })
             .expect(400, {
               error: {
                 message: `Request body must content 'folder_name'`
               }
             })
          })
          it(`responds with 204 when updating only a subset of fields`, () => {
                  const idToUpdate = 2
                  const updateFolder = {
                    folder_name: 'updated folder title',
                  }
                  const expectedFolder = {
                    ...testFolders[idToUpdate - 1],
                    ...updateFolder
                  }
            
                  return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send({
                      ...updateFolder,
                      fieldToIgnore: 'should not be in GET response'
                    })
                    .set("Authorization", `Bearer ${API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                      supertest(app)
                        .get(`/api/folders/${idToUpdate}`)
                        .set("Authorization", `Bearer ${API_TOKEN}`)
                        .expect(expectedFolder)
                    )
                })
              })
  });
})
