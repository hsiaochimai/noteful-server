function makeNotesArray() {
    return [
      {
        id: 1,
        modified: new Date().toISOString(),
        note_name: "test note 1",
        folder_id: 1,
        content: "This is test note 1"
      },
      {
        id: 2,
        modified: new Date().toISOString(),
        note_name: "test note 2",
        folder_id: 2,
        content: "This is test note 2"
      },
      {
        id: 3,
        modified: new Date().toISOString(),
        note_name: "test note 3",
        folder_id: 3,
        content: "This is test note 3"
      }
    ];
  }
  
  function makeMaliciousNote() {
    const maliciousNote = {
        id: 911,
        modified: new Date().toISOString(),
        note_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        folder_id: 2,
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
    };
    const expectedNote = {
      ...maliciousNote,
      note_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
      content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    };
    return{
        maliciousNote,
        expectedNote
    }
  }
  module.exports={
      makeNotesArray,
      makeMaliciousNote
  }