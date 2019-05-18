const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const {makeNotesArray, makeMaliciousNote}= require ("./notes.fixture")
const {makeFoldersArray} = require('./folders.fixture')
const { API_TOKEN } = process.env;

describe("Notes Endpoints", function() {
    let db;
  
    before("make knex instance", () => {
      db = knex({
        client: "pg",
        connection: process.env.TEST_DB_URL
      });
      app.set("db", db);
    });
  
    after("disconnect from db", () => db.destroy());
  
    before("clean the table", () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));
  
    afterEach("cleanup", () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));
    describe(`GET /api/notes`, () => {
      context(`Given no notes`, () => {
        it(`responds with 200 and an empty list`, () => {
          return supertest(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(200, []);
        });
      });
      context("Given there are notes in the database", () => {
        const testFolders = makeFoldersArray();
        const testNotes = makeNotesArray();
        beforeEach("insert notes", () => {
          return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
        });
        it("GET /api/notes responds with 200 and all of the notes", () => {
          return supertest(app)
            .get("/api/notes")
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(200, testNotes);
        });
      });
      context(`Given an XSS attack note`, () => {
        const testFolders = makeFoldersArray();
        const { maliciousNote, expectedNote } = makeMaliciousNote();
  
        beforeEach("insert malicious note", () => {
          return db
            .into('noteful_folders')
            .insert(testFolders)
            .then(() => {
              return db
                .into('noteful_notes')
                .insert([ maliciousNote ])
            });
        });
  
        it("removes XSS attack content", () => {
          return supertest(app)
            .get(`/api/notes`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(200)
            .expect(res => {
              expect(res.body[0].note_name).to.eql(expectedNote.note_name);
              expect(res.body[0].content).to.eql(expectedNote.content);
            });
        });
      });
    });
    describe.only(`GET /api/notes/:note_id `, () => {
      context(`Given no notes`, () => {
        it(`responds with 404`, () => {
          const noteId = 123457;
          return supertest(app)
            .get(`/api/notes/${noteId}`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(404, { error: { message: `Note doesn't exist` } });
        });
      });
      context("Given there are notes in the database", () => {
        const testFolders = makeFoldersArray();
        const testNotes = makeNotesArray();
        beforeEach("insert notes", () => {
          return db.into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
        });
        it(" responds with 200 and the specified note", () => {
          const noteId = 2;
          const expectedNote = testNotes[noteId - 1];
          return supertest(app)
            .get(`/api/notes/${noteId}`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(200, expectedNote);
        });
      });
      context(`Given an XSS attack note`, () => {
        const testFolders = makeFoldersArray();
        const { maliciousNote, expectedNote } = makeMaliciousNote();
  
        beforeEach("insert malicious note", () => {
          return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert([ maliciousNote ])
          });
        });
  
        it("removes XSS attack content", () => {
          return supertest(app)
            .get(`/api/notes/${maliciousNote.id}`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(200)
            .expect(res => {
              expect(res.body.note_name).to.eql(expectedNote.note_name);
              expect(res.body.content).to.eql(expectedNote.content);
            });
        });
      });
    });
    describe.only(`POST /api/notes`, () => {
      const testFolders= makeFoldersArray();
      beforeEach("insert folders and notes", () => {
        return db.into('noteful_folders')
        .insert(testFolders)
        .then(() => {
        
        })
    })
      it(`creates an note, responding with 201 and the new note`, function() {
        
        const newNote = {
          note_name: "Test new note",
          folder_id: 1,
          content: "Test new note content..."
        };
        return supertest(app)
          .post("/api/notes")
          .send(newNote)
          .set("Authorization", `Bearer ${API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.note_name).to.eql(newNote.note_name);
            expect(res.body.folder_id).to.eql(newNote.folder_id)
            expect(res.body.content).to.eql(newNote.content);
            expect(res.body).to.have.property("id");
            expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
            const expected = new Date().toLocaleString();
            const actual = new Date(res.body.modified).toLocaleString(
              "en",
              { timeZone: "UTC" }
            );
            expect(actual).to.eql(expected);
          })
          .then(postRes =>
            supertest(app)
              .get(`/api/notes/${postRes.body.id}`)
              .set("Authorization", `Bearer ${API_TOKEN}`)
              .expect(postRes.body)
          );
      });
      const requiredFields = ["note_name", "folder_id", "content"];
  
      requiredFields.forEach(field => {
        const newNote = {
          note_name: "Test new note",
          folder_id: 1,
          content: "Test new note content..."
        };
  
        it(`responds with 400 and an error message when the '${field}' is missing`, () => {
          delete newNote[field];
  
          return supertest(app)
            .post("/api/notes")
            .send(newNote)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(400, {
              error: { message: `Missing '${field}' in request body` }
            });
        });
      });
      it("removes XSS attack content from response", () => {
        const { maliciousNote, expectedNote } = makeMaliciousNote();
        return supertest(app)
          .post(`/api/notes`)
          .send(maliciousNote)
          .set("Authorization", `Bearer ${API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.note_name).to.eql(expectedNote.note_name);
            expect(res.body.content).to.eql(expectedNote.content);
            expect(res.body).to.have.property("id");
          });
      });
    });
    describe.only(`DELETE /api/notes/:note_id`, () => {
      context(`Given no notes`, () => {
        it(`responds with 404`, () => {
          const noteId = 123456;
          return supertest(app)
            .delete(`/api/notes/${noteId}`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(404, { error: { message: `Note doesn't exist` } });
        });
      });
      context("Given there are notes in the database", () => {
        const testFolders = makeFoldersArray();
        const testNotes = makeNotesArray();
  
        beforeEach("insert notes", () => {
          return db.into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
      })
        it("responds with 204 and removes the note", () => {
          const idToRemove = 2;
          const expectedNotes = testNotes.filter(
            note => note.id !== idToRemove
          );
          return supertest(app)
            .delete(`/api/notes/${idToRemove}`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/api/notes`)
                .set("Authorization", `Bearer ${API_TOKEN}`)
                .expect(expectedNotes)
            );
        });
      });
    });
    describe.only(`PATCH /api/notes/:note_id`, () => {
      context(`Given no notes`, () => {
        it(`responds with 404`, () => {
          const noteId = 123456;
          return supertest(app)
            .patch(`/api/notes/${noteId}`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .expect(404, { error: { message: `Note doesn't exist` } });
        });
      });
      context("Given there are notes in the database", () => {
        const testFolders = makeFoldersArray();
        const testNotes = makeNotesArray();
  
        beforeEach("insert notes", () => {
          return db.into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
        });
  
        it("responds with 204 and updates the note", () => {
          const idToUpdate = 2;
          const updateNote = {
            note_name: "updated note note_name",
            content: "updated note content",
            folder_id: 2,

          };
          const expectedNote = {
            ...testNotes[idToUpdate - 1],
            ...updateNote
          };
          return supertest(app)
            .patch(`/api/notes/${idToUpdate}`)
            .set("Authorization", `Bearer ${API_TOKEN}`)
            .send(updateNote)
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/api/notes/${idToUpdate}`)
                .set("Authorization", `Bearer ${API_TOKEN}`)
                .expect(expectedNote)
            );
        });
        it(`responds with 400 when no required fields supplied`, () => {
               const idToUpdate = 2
               return supertest(app)
                 .patch(`/api/notes/${idToUpdate}`)
                 .send({ irrelevantField: 'foo' })
                 .set("Authorization", `Bearer ${API_TOKEN}`)
                 .expect(400, {
                   error: {
                     message: `Request body must content either 'note_name, folder_id, or content'`
                   }
                 })
              })
              it(`responds with 204 when updating only a subset of fields`, () => {
                      const idToUpdate = 2
                      const updateNote = {
                        note_name: 'updated note note_name',
                      }
                      const expectedNote = {
                        ...testNotes[idToUpdate - 1],
                        ...updateNote
                      }
                
                      return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .send({
                          ...updateNote,
                          fieldToIgnore: 'should not be in GET response'
                        })
                        .set("Authorization", `Bearer ${API_TOKEN}`)
                        .expect(204)
                        .then(res =>
                          supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .set("Authorization", `Bearer ${API_TOKEN}`)
                            .expect(expectedNote)
                        )
                    })
                  })
      });
    });
  
  