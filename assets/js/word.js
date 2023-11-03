const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';
Web.on('loaded', async event => {
  const {config,Client,Prompt,Pdf,Treeview,Listview,Statusbar,XLSBook,authClient,abisClient,socketClient,tags,treeview,listview,account,Aliconnect,getAccessToken} = Aim;
  const {num} = Format;
  await Aim.fetch('https://elma.aliconnect.nl/elma/elma.github.io/assets/yaml/elma').get().then(config);
  $(document.body).append(
    config.word.templates.map(template => $('button').text(template.title).on('click', event => {
      // console.log('HOI');
      const elem = $('div').append(
        $('p'),
        $('p').append(
          paragraph(template.content),
        ),
        $('p'),
      );

      Word.run(function (context) {
        // context.document.body.insertParagraph(elem.el.outerHTML, Word.InsertLocation.start);

        // context.document.body.insertParagraph('test', Word.InsertLocation.end);
        var range = context.document.getSelection();
        range.insertHtml(elem.el.outerHTML, Word.InsertLocation.end);
        // for (var i = 0, line; line = wrlines[i]; i++) {
        //   var html = [];
        //   if (line.html) range.insertHtml(line.html, Word.InsertLocation.end);
        //   if (line.Base64String) range.insertInlinePictureFromBase64(line.Base64String, Word.InsertLocation.end);
        // }
        return context.sync().then(() => elem.remove());
      });
    }))
  );
  const AimWord = Object.create({
    lines2word: function (writelines) {
      if (!writelines.length) {
        Word.run(function (context) {
          var range = context.document.getSelection();
          for (var i = 0, line; line = wrlines[i]; i++) {
            var html = [];
            if (line.html) range.insertHtml(line.html, Word.InsertLocation.end);
            if (line.Base64String) range.insertInlinePictureFromBase64(line.Base64String, Word.InsertLocation.end);
          }
          return context.sync().then(function () { });
        });
      }
      var line = writelines.shift();
      if (line.src) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
          var reader = new FileReader();
          reader.onload = function (e) {
            wrlines.push({ Base64String: e.target.result.split(',').pop() });
            word.lines2word(writelines);
          }
          reader.readAsDataURL(this.response);
        };
        xhr.open('GET', line.src);
        xhr.responseType = 'blob';
        xhr.send();
        return;
      }
      wrlines.push(line);
      word.lines2word(writelines);
    },
    write2word: function (row) {
      var row = row || this.row;
      writelines = []; wrlines = [];
      if (row.images) for (var iImg = 0, file; file = row.images[iImg]; iImg++) writelines.push({ src: file.src });
      for (var key in api.definitions[row.schema].properties) if (row.values[key]) {
        var prop = api.definitions[row.schema].properties;
        writelines.push({ html: '<br><p><small>' + (prop.title || key) + '</small><br>' + row.values[key] + '</p>' });
      }
      console.log('lines', writelines);
      word.lines2word(writelines);
    },
    })

  try {
    Office.initialize = function (reason) {
      if (Office.context.requirements.isSetSupported('WordApi', 1.1)) mswordapi = true;
      else document.getElementById('aPage').innerText = 'This code requires Word 2016 or greater.';
    };
  } catch (err) { }

});
//     Object.assign(aim, {
//       api: {
//         definitions: {
//           task: {
//             method: {
//               write: function () { word.write2word(this.row); },
//             },
//           },
//         },
//       },
//       lines2word: function (writelines) {
//         if (!writelines.length) {
//           Word.run(function (context) {
//             var range = context.document.getSelection();
//             for (var i = 0, line; line = wrlines[i]; i++) {
//               var html = [];
//               if (line.html) range.insertHtml(line.html, Word.InsertLocation.end);
//               if (line.Base64String) range.insertInlinePictureFromBase64(line.Base64String, Word.InsertLocation.end);
//             }
//             return context.sync().then(function () { });
//           });
//         }
//         var line = writelines.shift();
//         if (line.src) {
//           var xhr = new XMLHttpRequest();
//           xhr.onload = function () {
//             var reader = new FileReader();
//             reader.onload = function (e) {
//               wrlines.push({ Base64String: e.target.result.split(',').pop() });
//               word.lines2word(writelines);
//             }
//             reader.readAsDataURL(this.response);
//           };
//           xhr.open('GET', line.src);
//           xhr.responseType = 'blob';
//           xhr.send();
//           return;
//         }
//         wrlines.push(line);
//         word.lines2word(writelines);
//       },
//       write2word: function (row) {
//         var row = row || this.row;
//         writelines = []; wrlines = [];
//         if (row.images) for (var iImg = 0, file; file = row.images[iImg]; iImg++) writelines.push({ src: file.src });
//         for (var key in api.definitions[row.schema].properties) if (row.values[key]) {
//           var prop = api.definitions[row.schema].properties;
//           writelines.push({ html: '<br><p><small>' + (prop.title || key) + '</small><br>' + row.values[key] + '</p>' });
//         }
//         console.log('lines', writelines);
//         word.lines2word(writelines);
//       },
//     })
//   });
