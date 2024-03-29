const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const counter = require('./counter');

const Promise = require('bluebird');
const readFilePromise = Promise.promisify(fs.readFile);
const writeFilePromise = Promise.promisify(fs.writeFile);

var items = {};

// Public API - Fix these CRUD functions ///////////////////////////////////////

exports.create = (text, callback) => {

  counter.getNextUniqueId((err, id) => {
    if (err) throw err;
    items[id] = text;
    var newPath = path.join(exports.dataDir, `${id}.txt`);
    fs.writeFile(newPath, items[id], (err) => {
      if (err) throw err;
      callback(null, { id, text });
    });
  });
};

exports.readAll = (callback) => {
  fs.readdir(exports.dataDir, (err, fileNames) => {
    if (err) {
      callback(err);
    } else {
      if (fileNames.length === 0)  return callback(null, []);

      var data = _.map(fileNames, (file) => {
        var id = path.basename(file, '.txt');
        var filepath = path.join(exports.dataDir, file);
        return readFilePromise(filepath).then(fileData => {
          return {
            id: id,
            text: fileData.toString()
          };
        });
      });

      // data = [{Pending.Promise}, {Pending.Promise}, {Pending.Promise}, {Pending.Promise}]
      Promise.all(data) // [{id, text}, {id,text}, {Pending.Promise}, {id, text}]
        .then(items => callback(null, items), err => callback(err));

      // let allFileContents = [];

      // for (let i = 0; i < data.length; i++) {
      //   let id = data[i].split('.')[0];
      //   exports.readOne(id, (err, content) => {
      //     if (err) {
      //       callback(err);
      //     } else {
      //       allFileContents.push(content);
      //       if(allFileContents.length === data.length) {
      //         callback(null, allFileContents);
      //       }
      //     }
      //   })
      // }
    }
  });
};

exports.readOne = (id, callback) => {
  var text = items[id];
  if (!text) {
    callback(new Error(`No item with id: ${id}`));
  } else {
    callback(null, { id, text });
  }
};

exports.update = (id, text, callback) => {
  var item = items[id];
  var filePath = path.join(exports.dataDir, `${id}.txt`);
  if (!item) {
    callback(new Error(`No item with id: ${id}`));
  } else {
    items[id] = text;
    fs.writeFile(filePath, text, (err) => {
      if (err) throw err;
      callback(null, { id, text });
    });
  }
};

exports.delete = (id, callback) => {
  var item = items[id];
  var filePath = path.join(exports.dataDir, `${id}.txt`);
  delete items[id];
  if (!item) {
    // report an error if item not found
    callback(new Error(`No item with id: ${id}`));
  } else {
    fs.unlink(filePath, (err) => {
      if (err) throw err;
    });
    callback();
  }
};

// Config+Initialization code -- DO NOT MODIFY /////////////////////////////////

exports.dataDir = path.join(__dirname, 'data');

exports.initialize = () => {
  if (!fs.existsSync(exports.dataDir)) {
    fs.mkdirSync(exports.dataDir);
  }
};
