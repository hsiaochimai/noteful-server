function makeFoldersArray() {
  return [
    {
      id: 1,
      folder_name: "test 1"
    },
    {
      id: 2,
      folder_name: "test 2"
    },
    {
      id: 3,
      folder_name: "test 3"
    }
  ];
}

function makeMaliciousFolder() {
  const maliciousFolder = {
    id: 911,
    folder_name: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
  };
  const expectedFolder = {
    ...maliciousFolder,
    folder_name: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  };
  return{
      maliciousFolder,
      expectedFolder
  }
}
module.exports={
    makeFoldersArray,
    makeMaliciousFolder
}