const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';
Web.on('loaded', (event) => Abis.config({serviceRoot,socketRoot}).init().then(async (abis) => {

  const {searchParams} = new URL(document.location.href);

  function excelDateToJSDate(serial) {
     var utc_days  = Math.floor(serial - 25569);
     var utc_value = utc_days * 86400;
     var date_info = new Date(utc_value * 1000);
     var fractional_day = serial - Math.floor(serial) + 0.0000001;
     var total_seconds = Math.floor(86400 * fractional_day);
     var seconds = total_seconds % 60;
     total_seconds -= seconds;
     var hours = Math.floor(total_seconds / (60 * 60));
     var minutes = Math.floor(total_seconds / 60) % 60;
     return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
  }
  function loadExcelData(src){
    return new Promise((succes,fail)=>{
      console.log(src);
      const data = {};
      fetch(src).then((response) => response.blob()).then(blob => {
        const reader = new FileReader();
        reader.readAsBinaryString(blob);
        reader.onload = (event) => {
          const workbook = XLSX.read(event.target.result, {type:'binary'});
          workbook.SheetNames.forEach(name => {
            const wbsheet = workbook.Sheets[name];
            if (!wbsheet['!ref']) return;
            // console.log(name,wbsheet['!ref']);
            const [start,end] = wbsheet['!ref'].split(':');
            const [end_colstr] = end.match(/[A-Z]+/);
            const [rowcount] = end.match(/\d+$/);
            const col_index = XLSX.utils.decode_col(end_colstr);
            const colnames = [];
            const rows = [];
            for (var c=0;c<=col_index;c++) {
              var cell = wbsheet[XLSX.utils.encode_cell({c,r:0})];
              if (cell) {
                colnames[c] = String(cell.v);
              }
            }
            for (var r=1;r<rowcount;r++) {
              const row = {};
              for (var c=0;c<=col_index;c++) {
                var cell = wbsheet[XLSX.utils.encode_cell({c,r})];
                if (cell && cell.v) {
                  row[colnames[c]] = cell.v;
                }
                // row[colnames[c]] = cell && cell.v ? cell.v : null;
              }
              rows.push(row);
              // console.log(excelDateToJSDate(row.date));
            }
            data[name] = rows;
            //
            // for (var c=0;c<=col_index;c++) {
            //   var cellstr = XLSX.utils.encode_cell({c:c,r:0});
            //   var cell = wbsheet[cellstr];
            //   if (!cell || !cell.v) {
            //     break;
            //   }
            //   properties[cell.v] = properties[cell.v] || { type: types[cell.t] || 'string' }
            //   // ////console.debug(cellstr, cell);
            // }


            // console.log(name,rowcount,colnames,rows);
          })
          // console.log(data);
          // Aim.fetch('https://elma.aliconnect.nl/api/data').body(data).post().then(succes);
          // console.log(searchParams);
          succes(data);
          // Web.search(searchParams.get('search'));
        }
      })
    }).catch(console.error);
  }

  [
    '.icn-navigation',
    '.icn-local_language',
    '.icn-settings',
    '.icn-question',
    '.icn-cart',
    '.icn-chat_multiple',
    '.icn-person',
  ].forEach(tag => $(tag).remove());


  $('nav>.mw').append(
    $('input').value(window.localStorage.getItem('username')).on('change', event => window.localStorage.setItem('username', event.target.value))
  )

  const {config,Client,Prompt,Pdf,Treeview,Listview,Statusbar,XLSBook,authClient,abisClient,socketClient,tags,treeview,listview,account,Aliconnect,getAccessToken} = abis;
  const {num} = Format;
  await Aim.fetch('https://elma.aliconnect.nl/elma/elma.github.io/assets/yaml/elma').get().then(config);


  // const people = config.obs.map(company => company.departments.map(department => department.people.map(person => Object.assign(person,{
  //   companyName: company.companyName,
  //   department: department.department,
  // })))).flat(3);
  // console.log(people);

  const {functionCodes,projects} = config;

  // const tasks = projects.map(project => project.tasks).flat(1).filter(Boolean)


  // Object.entries(functionCodes).forEach(([fc,item])=>Object.assign(item,{fc}));
  // const people = Object.values(functionCodes).map(fc => (fc.people||[]).map(person => Object.setPrototypeOf(person,fc))).flat(3).filter(Boolean);
  // const resources = people.filter(p => p.schedule || p.verlof || tasks.some(task => task.rc && task.rc === p.rc));
  // console.log(resources);
  // var src = 'elma-data.xlsx';
  // await Aim.fetch('https://elma.aliconnect.nl/api/data.json').get().then(config);

  config({verlof:[],planning:[]})
  // console.log(config.verlof, config.planning);

  const sum = {

  };

  const tasks = config.verlof.map(verlof => Object.assign(verlof,{date:excelDateToJSDate(verlof.date).toLocaleDateString()}));
  console.log(tasks);

  function details(title, open) {
    return $('details').open(open).append(
      $('summary').text(title),
    );
  }

  Object.entries(config.indienst).forEach(([name,item])=>Object.assign(item,{name}));
  const indienst = Object.values(config.indienst);
  config({
    mailer:{
      async projectvoortgang(elem) {
        const data = Object.fromEntries(new FormData(elem.target.form).entries());
        const offerteElem = $('body').append(
          $('link').rel('stylesheet').href('https://elma.aliconnect.nl/assets/css/elma-print.css'),
          $('header').append(
            $('table').style('color:#0A6EAC;').append(
              $('tr').append(
                $('td').style('width:80mm;').append(
                  $('img').src('https://elma.aliconnect.nl/assets/image/elma-logo.png'),
                ),
                $('td').append(
                  $('div').text('Elma B.V.'),
                  $('div').text('Centurionbaan 150'),
                  $('div').text('3769 AV Soesterberg'),
                  $('div').text('The Netherlands'),
                ),
                $('td').append(
                  $('div').text(''),
                  $('div').text('t +31(0)346 35 60 60'),
                  $('div').text('e elma@elmabv.nl'),
                  $('div').text('i www.elmatechnology.com'),
                ),
              ),
            ),
          ),
          $('main').append(
            $('table').append(
              $('tr').append(
                $('td').colspan(4).style('padding:10mm 0;').append(
                  $('div').text(data.companyName),
                  $('div').text('attn.', 'De heer aaa'),
                  $('div').text('Centurionbaan 150'),
                  $('div').text('3769 AV Soesterberg'),
                  $('div').text('The Netherlands'),
                ),
              ),
              $('tr').append(
                $('th').text('Date').style('width:30mm;'),
                $('td').text('20-20-2023').style('width:40mm;'),
                $('th').text('Related by').style('width:30mm;'),
                $('td').text('Aart Versluis').style('width:50mm;'),
              ),
              $('tr').append(
                $('th').text('Your reference'),
                $('td').text(data.yourReference),
                $('th').text('Direct phone'),
                $('td').text('Aart Versluis'),
              ),
              $('tr').append(
                $('th').text('Our reference'),
                $('td').text('412341'),
                $('th').text('Email address'),
                $('td').text('aart.versluis@elmabv.nl'),
              ),
            ),
            $('p').text('Geachte heer van Eck'),
            $('p').text('Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. '),
            $('h1').style('page-break-before: always;').text('Delivering conditions'),
            $('table').append(
              $('tr').append(
                $('th').text('Delivery time').style('width:30mm;'),
                $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
              ),
              $('tr').append(
                $('th').text('Delivery time'),
                $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
              ),
              $('tr').append(
                $('th').text('Delivery time'),
                $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
              ),
              $('tr').append(
                $('th').text('Delivery time'),
                $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
              ),
              $('tr').append(
                $('th').text('Delivery time'),
                $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
              ),
            ),
            // $('p').style('page-break-after: never;').text('Page 2'),
          ),
        );
        const content = offerteElem.el.outerHTML;
        offerteElem.print(event => {
          console.log(content);
          // return console.warn(2, event);
          if (confirm("Offerte versturen!")) {
            Aim.fetch('https://aliconnect.nl/v1/mailer').body({
              // prio: 2,
              to: 'max.van.kampen@alicon.nl',
              to: 'max.vankampen@elmabv.nl',
              from: 'max.van.kampen@alicon.nl',
              // 'bcc'=> 'max.van.kampen@alicon.nl',
              chapters: [
                {
                  title: "Offerte van Elma",
                  content: "Hierbij sturen wij u onze offerte",
                },
              ],
              attachements: [
                {
                  name: 'Offerte.pdf',
                  content,//: offerteElem.el.outerHTML,
                },
              ],
            }).post().then(body => {
              offerteElem.remove();
              console.log(body);
              // alert('Uw offerte is verstuurd');
            });
            // txt = "You pressed OK!";
          } else {
            // txt = "You pressed Cancel!";
          }
        });
      },
    },
  })

  const searchData = [].concat(
    Object.values(config.customers).map(item => Object.assign(item, {header: ['Klant',item.companyName].filter(Boolean).join(' > ')})),
    Object.values(config.suppliers).map(item => Object.assign(item, {header: ['Leverancier',item.companyName].filter(Boolean).join(' > ')})),
    // Object.values(config.indienst).map(item => Object.assign(item, {header: [item.department,item.jobTitle,item.name].filter(Boolean).join(' > ')})),
    Object.values(config.tasks).map(item => Object.assign(item, {header: ['Task',item.title].filter(Boolean).join(' > ')})),
    Object.values(config.forms).map(item => Object.assign(item, {header: ['Formulier',item.title].filter(Boolean).join(' > ')})),
    Object.values(config.abbreviations).map(item => Object.assign(item, {header: [item.afk,item.title].filter(Boolean).join(' > ')})),




    // Object.values(config.jobTitles).map(item => Object.assign(item, {
    //   header: ['Jobtitle',item.department,item.jobTitle].filter(Boolean).join(' > '),
    //   employees: indienst.filter(subitem => subitem.jobTitle === item.jobTitle).map(item => item.name),
    //   style: indienst.filter(subitem => subitem.jobTitle === item.jobTitle).length ? '' : 'color:red;' : '',
    // })),
    // Object.values(config.applications).map(item => Object.assign(item, {header: ['Application', item.title].filter(Boolean).join(' > ')})),
    // Object.values(config.systemen).map(item => Object.assign(item, {header: ['Server',item.name].filter(Boolean).join(' > ')})),
    // Object.values(config.iso).map(item => Object.assign(item, {header: ['ISO',item.nr,item.title].filter(Boolean).join(' > ')})),
    // Object.values(config.procedure).map(item => Object.assign(item, {header: ['Procedure',item.title].filter(Boolean).join(' > ')})),
  );
  $(document.documentElement).class('app',1);
  $('.treeview').remove();
  function select() {
    document.querySelectorAll('.pages>div').forEach(el => el.remove());
    $('.pages').clear();
    this.pageElem();
  }
  config({
    definitions:{
      mw:{
        prototype:{
          select,
        }
      },
      task:{
        prototype:{
          select,
        }
      },
      jobTitle:{
        prototype:{
          select,
        }
      },
      asset:{
        prototype:{
          select,
        }
      },
      application:{
        prototype:{
          select,
        }
      },
    }
  })
  Web.search = function(searchText){
    const url = new URL(document.location);
    url.searchParams.set('search', searchText);
    window.history.replaceState('','',url);
    $('input.search').value(searchText);
    const searchArray = searchText.split(' ');
    const rows = searchData.filter(row => searchArray.every(word => (row.header||row.title).match(new RegExp(word,'i'))));
    console.log(rows);
    // rows.forEach(row => {
    //   if (!row.headers) {
    //     row.headers = [
    //       row.header || row.title,
    //     ];
    //   }
    //   row.select = function(){
    //     console.log(row);
    //   }
    // })

    Web.listview.render(rows);
    $('.listview .list .search').remove();
    return;

    $('.listview').clear().append(
      $('div').class('search-results col').append(
        rows.map(item => $('details').append(
          $('summary').append(
            item.href ? $('a').target('doc').href(item.href.match(/^http/) ? item.href : '/engineering/'+item.href).text(item.header||item.title) : item.header||item.title,
          ).style(item.style),
          paragraph(item),
        ))
      )
    )
  }
  function lineSplit(line) {
    return line ? line.split('\r\n') : null;
  }
  function search(){
    Web.search(searchParams.get('search'));
  }

  loadExcelData('http://10.10.60.31/docs/data.xlsx').then(data => {
    return;
    data.search.forEach(item => searchData.push(item));
    data.iso.forEach(item => searchData.push(Object.assign({header: [
      'ISO-9001',
      item.nr,
      item.groep,
      item.procedure,
    ].filter(Boolean).join(' > ')}, item)));
    data.jstd.forEach(item => searchData.push(Object.assign({header: [
      'JSTD-016',
      item.name,
      item.title,
    ].filter(Boolean).join(' > ')}, item)));
    data.tasks.forEach(item => {
      searchData.push((({why,what,who,when,href}) => ({
        header: ['Todo',what,who].filter(Boolean).join(' > '),
        why,what,who,when,href
      }))(item));
    });

  }).finally(search);
  loadExcelData('http://10.10.60.31/docs/it.xlsx').then(data => {
    data.jobTitles.forEach(item => searchData.push(Object.assign(item, {
      schemaName: 'jobTitle',
      header: [
        'Jobtitle',
        item.department,
        item.jobTitle,
      ].filter(Boolean).join(' > '),
      activiteiten: lineSplit(item.activiteiten),
      complexiteit: lineSplit(item.complexiteit),
      zelfstandigheid: lineSplit(item.zelfstandigheid),
      afbreukrisico: lineSplit(item.afbreukrisico),
      competenties: lineSplit(item.competenties),
      employees: indienst.filter(subitem => subitem.jobTitle === item.jobTitle).map(item => item.name),
      style: indienst.filter(subitem => subitem.jobTitle === item.jobTitle).length ? '' : 'color:red;',
    })));
    data.assets.forEach(item => searchData.push(Object.assign(item, {
      schemaName: 'asset',
      header: [
        'Asset',
        item.name,
        item.user,
        item.type,
        item.werkplek,
        item.toelichting,
      ].filter(Boolean).join(' > '),
    })));
    data.applications.forEach(item => searchData.push(Object.assign(item, {
      schemaName: 'application',
      header: [
        'Application',
        item.department,
        item.title,
      ].filter(Boolean).join(' > '),
    })));
    data.mw.forEach(item => searchData.push(Object.assign(item, {
      schemaName: 'mw',
      header: [
        'Medewerker',
        item.department,
        item.jobTitle,
        item.name,
      ].filter(Boolean).join(' > '),
    })));
    // data.applications.forEach(item => searchData.push(Object.assign({header: ['Application', item.department, item.title].filter(Boolean).join(' > ')},item)));
    return;
    data.groepen.forEach(item => searchData.push(Object.assign({header: [
      'Group',
      item.source,
      item.groupType,
      item.displayName,
      item.mail,
    ].filter(Boolean).join(' > ')}, item)));
  }).finally(search);

  // loadExcelData('http://10.10.60.31/engineering/Projects/Planning/Engineering/elma-planning-engineering.xlsx').then(data => {
  loadExcelData('http://10.10.60.31/engineering/Projects/Planning/Planning Systems.xlsx').then(data => {
    console.log(data);
    const planweken = 25;

    const taken = data.Planning.filter(item => item.Taak);

    const resources = taken.map(item => item.Wie).unique().map(name => Object({name,weken:[]}));
    taken.forEach(item => {
      item.weken = [];
      var {TeGaan,weken,Wie} = item;
      const resource = resources.find(item => item.name === Wie);
      for (let i=0;i<planweken;i++) {
        resource.weken[i] = resource.weken[i]||0;
        const beschikbaar = Math.max(0,40-resource.weken[i]);
        let uren = Math.min(beschikbaar,TeGaan);
        item.weken[i] = uren;
        TeGaan -= uren;
        resource.weken[i] += uren;
      }

      searchData.push((({
        Klant, Project,Nr,Projectleider,Taak,Status,Start,Deadline,Wie,Soort,
        Calc,Besteed,Open,TeGaan,Gepland,
      }) => ({
        schemaName: 'task',
        title: ['Task', item.Nr,item.Klant,item.Projectleider,item.Project,item.Taak,item.Wie].filter(Boolean).join(' > '),
        Klant, Project,Nr,Projectleider,Taak,Status,Start,Deadline,Wie,Soort,
        Calc,Besteed,Open,TeGaan,Gepland,
      }))(item));
    })

    function planning() {
      const rows = [];
      return $('table').class('grid').style('font-size:8pt;white-space:nowrap;border-collapse:collapse;').append(
        $('thead').style('position:sticky;top:48px;').append(
          $('tr').append(
            $('th').text('Klant'),
            $('th').text('Project'),
            $('th').text('Nr'),
          ),
        ),
        $('tbody').append(
          data.Planning.filter(item => item.Taak).map(item => $('tr').append(
            $('td').text(item.Klant),
            $('td').text(item.Project),
            $('td').text(item.Nr),
            $('td').text(item.Projectleider),
            $('td').text(item.Taak),
            $('td').text(item.Wie),
            $('td').text(item.TeGaan),
            item.weken.map(aantal => $('td').text(aantal||'').style(aantal ? 'background:lightblue;color:black;' : '')),
          )),
        ),
      )


      // return;
      const maxweek = [32,32,32,32];
      const totweek = [];
      return console.log(data);
      projects.forEach(project => project.tasks.forEach(task => {
        Object.setPrototypeOf(task,functionCodes[task.fc]||{});
        task.project = project;
        task.calc = task.calc || 0;
        task.done = task.done || 0;
        task.togo = 'togo' in task ? task.togo : task.calc;
      }));

      const now = new Date();
      now.setDate(now.getDate() - now.getDay() + 1);

      resources.forEach(resource => {
        // Object.setPrototypeOf(resource,functionCodes[resource.fc]);
        resource.tasks = projects.map(project => project.tasks.filter(task => task.rc && task.rc === resource.rc)).flat(1);
        var week = 0;
        resource.workweek = [];
        // resource.tasks
        // Object.entries(resource.verlof||{}).forEach(([d,v]) => console.log(d,v,new Date(d), Math.ceil((new Date(d) - now)/1000/3600/24/7)));
        Object.entries(resource.verlof||{}).forEach(([d,v]) => resource.workweek[Math.ceil((new Date(d) - now)/1000/3600/24/7)] = v);
        resource.tasks.forEach(task => {
          // Object.setPrototypeOf(task,functionCodes[task.fc]);
          task.schedule = [];
          for (var work = task.togo; work > 0;) {
            const maxday = maxweek[week]||24;
            const daywork = task.schedule[week] = Math.max(0,Math.min( maxday - (resource.workweek[week]||0), work));
            resource.workweek[week] = (resource.workweek[week]||0) + daywork;
            work -= daywork;
            task.project.workweek = task.project.workweek || [];
            task.project.workweek[week] = (task.project.workweek[week] || 0) + daywork;
            totweek[week] = (totweek[week]||0) + daywork;
            if (resource.workweek[week] >= maxday) week++;
          }
        })
      });
      // console.log(planning);



      // console.log(now.getDay())
      const cols = [];
      for (var i=0;i<20;i++) {
        cols.push({
          day:now.toLocaleDateString('nl-NL', {
            // weekday: 'short',
            // year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          }),
        });
        now.setDate(now.getDate() + 7);
      }
      function plantable(items){
        const tot = {calc:0,res:0};
        return $('div').style('overflow:auto;').append(
          $('table').class('schedule').append(
            $('thead').append(
              $('tr').append(
                $('th').text('Omschrijving').style('min-width:60mm;'),
                $('th').text('Calc').style('min-width:16mm;'),
                $('th').text('Res').style('min-width:16mm;'),
                // $('th').text('togo').style('min-width:16mm;'),
                cols.map(col => $('th').text(col.day)),
              ),
            ),
            $('tbody').append(
              items.map(item => [
                $('tr').style('background-color:#eee;').append(
                  $('th').text(item.name).append(
                    $('sup').text(item.fc, item.rc),
                  ),
                  $('td').text(num(item.tc = item.tasks.map(task => task.rate * task.calc).reduce((a,v)=>a+v,0),0)),
                  // $('td').text(num(item.tf = item.tasks.map(task => task.cost * (task.done + task.togo)).reduce((a,v)=>a+v,0),0)).style(item.tf > item.tc ? 'color:red;' : null),
                  $('td').text(num(item.tc - (item.tf = item.tasks.map(task => task.cost * (task.done + task.togo)).reduce((a,v)=>a+v,0)),0)).style(item.tf > item.tc ? 'color:red;' : null),

                  cols.map((col,i) => $('td').text((item.workweek||[])[i]).class((item.workweek||[])[i] ? 'busy' : null)),
                ),
                item.tasks.map(task => $('tr').append(
                  $('th').text(task.title).append(
                    $('sup').text(task.fc, task.rc),
                  ),
                  $('td').text(num(task.tc = task.rate * task.calc,0)),
                  $('td').text(num(task.tc - (task.tf = task.cost * (task.done + task.togo)),0)).style(task.tf > task.tc ? 'color:red;' : null),
                  cols.map((col,i) => $('td').text((task.schedule||[])[i]).class((task.schedule||[])[i] ? 'busy' : null)),
                ))
              ]),
              $('tr').style('background-color:#eee;').append(
                $('th').text('Totaal'),
                $('td').text(num(items.map(i=>i.tc).reduce((a,b)=>a+b,0),0)),
                $('td').text(num(items.res = items.map(i=>i.tc - i.tf).reduce((a,b)=>a+b,0),0)).style(items.res < 0 ? 'color:red;' : null),
                cols.map((col,i) => $('td').text(totweek[i]).class(totweek[i] ? 'busy' : null)),
              ),
            ),
          ),
        );
      }
      return [
        $('details').append(
          $('summary').text('Resources'),
          plantable(resources),
        ),
        $('details').append(
          $('summary').text('Projects'),
          plantable(projects),
        ),
      ];
    }
    $('body>nav>div').append(
      $('button').class('icn-task_list_ltr').on('click', event => {
        $('.listview').clear().append(
          planning(),
        );
      }),
    );

  }).finally(search);


  // console.log(config.applications.map(i => [i.title, i.oms, i.afdeling].join('\t')).join('\r\n'));
  // console.log(config.jobTitles.map(i => [i.department, i.jobTitle, i.functionCode].join('\t')).join('\r\n'));
  // console.log(indienst.map(i => [i.department,i.jobTitle,i.name,i.indienst||i.start, i.uitdienst||i.end, i.mailaddress].join('\t')).join('\r\n'));

  return;
  // indienst.forEach(mw => {
  //   const {name} = mw;
  //   const verlof = (mw.verlofdagen||[]).map(date => Object({ soort:'Verlof', name, date, uren:8 }));
  //   // console.log(verlof);
  //   tasks.push(...verlof);
  // });
  const workdays = {};


  let date = new Date();
  date.setHours(8,0,0,0);
  for (let i=0;i<365;i++) {
    const datestring = date.toLocaleDateString();
    if ([1,2,3,4,5].includes(date.getDay())) workdays[datestring]={};
    date.addDays(1);
  }
  // return console.log(workdays,tasks);

  console.log(config.rws);

  const tasksVerlof = tasks.filter(task => task.soort === 'Verlof');

  // const body = await Aim.fetch('welkom.html').get();
  // const elem1 = $('div').html(body);
  // const {innerHTML} = elem1.el.querySelector('.WordSection1');
  // elem1.remove();

  $('.listview').loadPage().then(elem => {
    elem.class('headerindex')
    // .html(innerHTML)
    .append(
      $('button').text('spec_dennis').on('click', event => {
        $('div').append(
          config.rws.systemen.map(system => [
            $('h2').text(system.name),
            system.koppen.map(item => [
              $('h2').text(item.title),
              $('table').append(
                $('thead').append(
                  $('tr').append(
                    $('th').text('I/O'),
                    $('th').text('Tag'),
                    $('th').text('Naam'),
                  ),
                ),
                $('tbody').append(
                  item.testen.map(item => $('tr').append(
                    $('td').text(item.io),
                    $('td').text(item.tag),
                    $('td').text(item.naam.replace(/{name}/,system.name)),
                  )),
                ),
              ),
            ])
          ]),

        ).print();
      }),


      $('button').text('login').on('click', event => {
        console.log('LOGIN');
      }),
      // $('a').text('JA').href('file:///I:/01%20Kwaliteitsregistraties/Certificaten%20ISO%209001%20en%20VCA/ISO%209001_65874_NL%20-%2001122021%20-%2001122024.pdf'),
      details('Verlof', true).append(
        $('table').append(
          tasksVerlof.map(task => task.date).unique().sort((a,b)=>new Date(a)-new Date(b)).map(date => $('tr').append(
            $('td').text(date),
            $('td').append(tasksVerlof.filter(task => task.date === date).map(task => $('li').text(task.name))),
          ))
        )
      ),
      details('HRM').append(
        details('Functiehuis').append(
          config.jobTitles
          .map(item => Object.assign(item,{
            title: [item.department, item.jobTitle].filter(Boolean).join(' > '),
            cnt: indienst.filter(mw => mw.jobTitle === item.jobTitle).length,
          }))
          // .filter(item => item.cnt)
          // .sort((a,b)=>a.title.localeCompare(b.title))
          .map(item => [
            $('details').append(
              $('summary').text(item.title, `(${item.cnt})`).style(item.cnt ? '' : 'color:red;'),
              $('a').class('anchor').name(item.jobTitle.replace(/ /g,'')),
              $('table').class('grid').append(
                $('tr').append(
                  $('th').text('Organisatie'),
                  $('td').text('Elma'),
                  $('th').text('Functiecode'),
                  $('td').text(item.functionCode),
                ),
                $('tr').append(
                  $('th').text('Afdeling'),
                  $('td').text(item.department),
                  $('th').text('Status'),
                  $('td').text(item.status),
                ),
                Object.entries(item.profile||{}).map(([header,content])=>$('tr').append(
                  $('td').colspan(4).append(
                    $('b').text(header+': '),
                    paragraph(content),
                  ),
                )),
              ),
              // Object.entries(job.chapters||{}).map(([title,chapter]) => $('details').append(
              //   $('summary').text(title),
              //   Array.isArray(chapter) ? $('ul').append(chapter.flat().map(line => $('li').append(paragraph(line)))) : $('p').text(paragraph(chapter)),
              // )),
            )
          ]),
        ),
        details('Competentie woordenboek').append(
          Object.entries(config.CompetentieWoordenboek).map(([title,obj]) => $('details').append(
            $('summary').text(title),
            Object.entries(obj).map(([title,obj]) => $('details').append(
              $('summary').text(title),
              Object.entries(obj).map(([title,chapter]) => $('details').append(
                $('summary').text(title),
                Array.isArray(chapter) ? $('ul').append(chapter.flat().map(line => $('li').append(paragraph(line)))) : $('p').text(paragraph(chapter)),
              )),
            )),
          )),
        ),
        details('Competentie management vragen').append(
          Object.entries(config.CompetentieManagementVragen).map(([title,obj]) => $('details').append(
            $('summary').text(title),
            Object.entries(obj).map(([title,obj]) => $('details').append(
              $('summary').text(title),
              Object.entries(obj).map(([title,chapter]) => $('details').append(
                $('summary').text(title),
                Array.isArray(chapter) ? $('ul').append(chapter.flat().map(line => $('li').append(paragraph(line)))) : $('p').text(paragraph(chapter)),
              )),
            )),
          )),
        ),
      ),
      details('TODO').append(
        config.todo.map(item => details(item.title).append(
          $('table').append(
            $('thead').append(
              $('tr').append(
                $('th').text('What').style('width:100%;'),
                $('th').text('Who').style('min-width:12mm;'),
                $('th').text('When').style('min-width:12mm;'),
              ),
            ),
            $('tbody').append(
              item.items.map(item => $('tr').append(
                $('td').append(
                  $('details').append(
                    $('summary').text(item.title),
                    item.opm ? $('p').text(item.opm) : null,
                  ),
                ),
                $('td').text(item.who),
                $('td').text(item.when),
              )),
            ),
          ),
        )),
        details('Applicaties').append(
          config.applicaties.map(item => $('details').append(
            $('summary').text(item.name),
            $('table').append(
              Object.entries(item).map(([key,value]) => $('tr').append(
                $('th').text(key),
                $('td').append(paragraph(value)),
              )),
            ),
          )),
        ),
        details('Templates').append(
          config.templates.map((item) => $('details').append(
            $('summary').append(
              $('a').text(item.name, item.title).href(item.href),
            ),
            paragraph(item.content),
          )),
        ),
      ),
      details('FAQ').append(
        details('Afkortingen').append(
          $('table').append(
            config.abbreviations.map(abbr => $('tr').append(
              $('th').text(abbr.afk),
              $('td').text(abbr.title),
            ))
          ),
        ),
        Object.entries(config.faq).map(([title,item]) => $('details').append(
          $('summary').text(title),
          $('p').append(paragraph(item)),
        )),
      ),

      details('Medewerkers').append(
        Object.entries(config.indienst)
        .map(([name,item]) => Object.assign(item,{name,title: [item.department, item.jobTitle, name].filter(Boolean).join(' > ')}))
        .sort((a,b)=>a.title.localeCompare(b.title))
        .map(item => $('details').append(
          $('summary').text(item.title),
          $('a').class('anchor').name(item.name.replace(/ /g,'')),
          $('table').class('grid').append(
            $('tr').append(
              $('th'),
              $('td'),
              $('th').text('Afbeelding'),
              $('td').append(
                item.src ? $('img').src(item.src).style('max-width:100px;max-height:100px;') : null,
              ),
            ),
            $('tr').append(
              $('th').text('Organisatie'),
              $('td').text(item.companyName || 'Elma'),
              $('th').text('Functie'),
              $('td').append(
                $('a').text(item.jobTitle).href('#'+((item||{}).jobTitle||'').replace(/ /g,'')),
              ),
            ),
            $('tr').append(
              $('th').text('Afdeling'),
              $('td').text(item.department),
              $('th').text('Status'),
              $('td').text(item.status),
            ),
            $('tr').append(
              $('th').text('In dienst'),
              $('td').text(item.start || item.indienst),
              $('th').text('Uit dienst'),
              $('td').text(item.uitdienst),
            ),
            $('tr').append(
              $('th').text('FTE'),
              $('td').text(item.fte = item.fte || 1),
              $('th').text('Indirect'),
              $('td').text(item.indirect = item.indirect || 0),
            ),
            $('tr').append(
              $('th').text('Phone'),
              $('td').text(item.phone),
              $('th').text('Mail'),
              $('td').text(item.mailaddress),
            ),
          ),
        )),
        $('table').append(
          $('tr').append(
            $('td').text('FTE'),
            $('td').text(num(sum.fte = Object.values(config.indienst).filter(Boolean).reduce((t,item)=>t=t+item.fte,0),1)),
          ),
          $('tr').append(
            $('td').text('Indirect'),
            $('td').text(num(sum.indirect = Object.values(config.indienst).filter(Boolean).reduce((t,item)=>t=t+(item.indirect||5)/100,0),1)),
          ),
          $('tr').append(
            $('td').text('Indirect percentage'),
            $('td').text(num(sum.indirect / sum.fte * 100,1)),
          ),
        ),
      ),
      details('Projecten').append(
        config.plnummers.map(project => Object.assign(project,{title: [project.opdrachtgever, project.eindklant, project.name].filter(Boolean).join(' > ')})).sort((a,b)=>a.title.localeCompare(b.title)).map(project => $('details').append(
          $('summary').text(project.title),
          project.src ? $('img').src(project.src).style('max-width:300px;max-height:200px;') : null,
          $('table').append(
            Object.entries(project).filter(([key,value])=>!['src'].includes(key)).map(([key,value])=>$('tr').append(
              $('th').text(key),
              $('td').text(value),
            )),
          )
        )),
      ),
      details('Planning').append(
        planning(),
      ),
      // $('h1').text('Whitepapers'),
      // Object.entries(config.whitepapers).map(([title,item]) => $('details').append(
      //   $('summary').text(title),
      //   Object.entries(item).map(([title,item]) => $('details').append(
      //     $('summary').text(title),
      //     Object.entries(item).map(([title,item]) => $('details').append(
      //       $('summary').text(title),
      //       Array.isArray(item) ? $('ul').append(item.flat().map(line => $('p').append(paragraph(line)))) : $('p').text(paragraph(item)),
      //     )),
      //   )),
      // )),
    ).indexto('aside.right');
  })


  // var src = 'elma-data.xlsx';
}, err => {
  console.error(err);
  $(document.body).append(
    $('div').text('Deze pagina is niet beschikbaar'),
  )
}));
