async function tcd(yaml) {
  Web.on('loaded', async (event) => {
    const {config} = Aim;
    await Aim.fetch('https://elma.aliconnect.nl/elma/elma.github.io/assets/yaml/elma').get().then(config);
    const tcd = await Aim.fetch('https://elma.aliconnect.nl/api/tcd').body(yaml).post();
    // Aim.config(tcd);

    function safe(){
      Aim.fetch('https://elma.aliconnect.nl/api/tcd').body(tcd).post().then(body => console.log(body));
    }
    // if (tcd.fds) {
    const docs = {
      Projectplan() {
        $('body>main').clear().append(
          $('link').rel("stylesheet").href("https://elma.aliconnect.nl/assets/css/tcd.css"),
          $('h1').text('Projectplan'),
          $('img').src('Pre-engineering/Afbeelding1.png').style('max-height:50mm;'),
          $('h2').text('Contactpersonen'),
          $('table').append(
            $('thead').append(
              $('tr').append(
                $('th').text('Naam'),
                $('th').text('Organisatie'),
                $('th').text('Functie'),
              ),
            ),
            $('tbody').append(
              tcd.contacts.map(item => $('tr').append(
                $('td').text(item.name),
                $('td').text(item.companyName),
                $('td').text(item.jobTitle),
              )),
            ),
          ),
        );
      },
      FDS() {
        $('body>main').clear().append(
          $('link').rel("stylesheet").href("https://elma.aliconnect.nl/assets/css/tcd.css"),
          $('h1').text('Functional Design Specification'),
          $('img').src('Pre-engineering/Afbeelding1.png').style('max-height:50mm;'),
          $('h2').text('Functies'),
          $('table').append(
            $('thead').append(
              $('tr').append(
                $('th').text('Naam'),
                $('th').text('Toelichting'),
              ),
            ),
            $('tbody').append(
              tcd.functies.map(item => $('tr').append(
                $('td').text(item.name),
                $('td').text(item.description),
              )),
            ),
          ),
        );
      },
    }

    console.log(tcd.actie, docs);

    $(document.body).append(
      $('nav').append(
        Object.entries(docs).map(([title,fn]) => $('button').text(title).on('click', fn)),
      ),
      $('main').append(
        $('img').src('Pre-engineering/Afbeelding1.png'),
        // $('button').text('write').on('click', e => {
        //   Aim.fetch('http://10.10.60.31:8000/api/Engineering/test/test3.txt').body('TESTsdfgsdf1').post().then(body => console.log(body));
        // }),
        $('input').type('checkbox').checked(tcd.actie).on('click', event => safe(tcd.actie = event.target.checked))
      ),
    )
    // }
    // tcd.test = 1;
    // safe();
  });
}
