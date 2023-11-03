const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';
Web.on('loaded', (event) => Abis.config({serviceRoot,socketRoot}).init().then(async (abis) => {
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
            const [start,end] = wbsheet['!ref'].split(':');
            const [end_colstr] = end.match(/[A-Z]+/);
            const [rowcount] = end.match(/\d+$/);
            const col_index = XLSX.utils.decode_col(end_colstr);
            const colnames = [];
            const rows = [];
            for (var c=0;c<=col_index;c++) {
              var cell = wbsheet[XLSX.utils.encode_cell({c,r:0})];
              colnames[c] = cell.v;
            }
            for (var r=1;r<rowcount;r++) {
              const row = {};
              for (var c=0;c<=col_index;c++) {
                var cell = wbsheet[XLSX.utils.encode_cell({c,r})];
                if (cell && cell.v) {
                  row[colnames[c]] = cell.v;
                }
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
          console.log(data);
          Aim.fetch('https://elma.aliconnect.nl/api/data').body(data).post().then(succes);
        }
      })
    }).catch(console.error);
  }
  var src = 'elma-data.xlsx';

  // console.log(await loadExcelData(src));
  // await Aim.fetch('https://elma.aliconnect.nl/api/data.json').get().then(config);

  config({verlof:[],planning:[]})
  console.log(config.verlof, config.planning);

  function planning() {
    return;
    const maxweek = [32,32,32,32];
    const totweek = [];
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


  const tasksVerlof = tasks.filter(task => task.soort === 'Verlof');

  $('.listview').loadPage().then(elem => {
    elem.class('headerindex').append(
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
