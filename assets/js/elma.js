const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';
Web.on('loaded', (event) => Abis.config({serviceRoot,socketRoot}).init().then(async (abis) => {
  const {config,Client,Prompt,Pdf,Treeview,Listview,Statusbar,XLSBook,authClient,abisClient,socketClient,tags,treeview,listview,account,Aliconnect,getAccessToken} = abis;
  const {num} = Format;
  await Aim.fetch('https://elma.aliconnect.nl/elma/elma.github.io/assets/yaml/elma').get().then(config);
  // console.log(config.jobDescriptions);

  function paragraph(line) {
    if (Array.isArray(line)) return line.map(paragraph).join(' ');
    if (typeof line === 'object') return Array.from(Object.entries(line)).map(([name,value]) => [name,paragraph(value)].join(': '));
    return line;
    // return typeof line === 'object' && !Array.isArray(line) ? Array.from(Object.entries(line)).map(([name,value]) => [name,textline(value)].join(': ')) : [line].flat().join(' ');
  }

  // const people = config.obs.map(company => company.departments.map(department => department.people.map(person => Object.assign(person,{
  //   companyName: company.companyName,
  //   department: department.department,
  // })))).flat(3);
  // console.log(people);

  const {functionCodes,projects} = config;

  const tasks = projects.map(project => project.tasks).flat(1).filter(Boolean)
  Object.entries(functionCodes).forEach(([fc,item])=>Object.assign(item,{fc}));
  const people = Object.values(functionCodes).map(fc => (fc.people||[]).map(person => Object.setPrototypeOf(person,fc))).flat(3).filter(Boolean);
  const resources = people.filter(p => p.schedule || p.verlof || tasks.some(task => task.rc && task.rc === p.rc));
  // console.log(resources);


  function planning() {
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
      $('h2').text('Resources'),
      plantable(resources),
      $('h2').text('Projects'),
      plantable(projects),
    ];
  }

  $('.listview').loadPage().then(elem => {
    elem.class('headerindex').append(
      // $('h1').text('Inleiding'),
      // $('details').append(
      //   $('summary').text('Afkortingen'),
      //   config.abbreviations.map(abbr => $('details').append(
      //     $('summary').text(abbr.afk+': '+abbr.title),
      //     $('p').text(abbr.decription),
      //   )),
      // ),

      // $('h1').text('Planning'),
      // planning(),

      $('h1').text('OBS'),
      // config.obs.map(item => $('details').append(
      //   $('summary').text([item.companyName].join(', ')),
      //   item.departments.map(item => $('details').append(
      //     $('summary').text([item.department].join(', ')),
      //     item.people.map(item => $('details').append(
      //       $('summary').html(`${item.name} (${item.jobTitle})`),
      //       $('img').src(item.src),
      //     )),
      //   )),
      // )),
      // $('li').text(['ELMA: '+people.length].concat(
      //   people.map(person => person.department).unique().map(department => department+': '+people.filter(person => person.department === department).length)
      // ).join(', ')),
      $('div').class('people').append(
        Object.entries(people).map(([initials,person]) => $('div').append(
          $('div').append(
            $('img').src(person.src),
            ['name','jobTitle','department','start'].map(name => $('div').class(name).text(person[name])),
          )
        )),
        $('div'),
        $('div'),
        $('div'),
        $('div'),
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
      // $('h1').text('Functiehuis'),
      // Object.entries(config.functionCodes).map(([fc,job]) => $('details').append(
      //   $('summary').text(job.jobTitle),
      //   Object.entries(job.chapters||{}).map(([title,chapter]) => $('details').append(
      //     $('summary').text(title),
      //     Array.isArray(chapter) ? $('ul').append(chapter.flat().map(line => $('li').append(paragraph(line)))) : $('p').text(paragraph(chapter)),
      //   )),
      // )),
      // $('h1').text('Competentie woordenboek'),
      // Object.entries(config.CompetentieWoordenboek).map(([title,obj]) => $('details').append(
      //   $('summary').text(title),
      //   Object.entries(obj).map(([title,obj]) => $('details').append(
      //     $('summary').text(title),
      //     Object.entries(obj).map(([title,chapter]) => $('details').append(
      //       $('summary').text(title),
      //       Array.isArray(chapter) ? $('ul').append(chapter.flat().map(line => $('li').append(paragraph(line)))) : $('p').text(paragraph(chapter)),
      //     )),
      //   )),
      // )),
      // $('h1').text('Competentie management vragen'),
      // Object.entries(config.CompetentieManagementVragen).map(([title,obj]) => $('details').append(
      //   $('summary').text(title),
      //   Object.entries(obj).map(([title,obj]) => $('details').append(
      //     $('summary').text(title),
      //     Object.entries(obj).map(([title,chapter]) => $('details').append(
      //       $('summary').text(title),
      //       Array.isArray(chapter) ? $('ul').append(chapter.flat().map(line => $('li').append(paragraph(line)))) : $('p').text(paragraph(chapter)),
      //     )),
      //   )),
      // )),
    ).indexto('aside.right');
  })



  Web.treeview.append([
    {
      name: 'Controls',
      icn: 'organization',
      children: [
        {
          name: 'OxyControl',
          $path: serviceRoot + '/oxycontrol',
          $search: '',
          $top: 2000,
        },
      ],
    },
  ]);
}, err => {
  console.error(err);
  $(document.body).append(
    $('div').text('Deze pagina is niet beschikbaar'),
  )
}));
