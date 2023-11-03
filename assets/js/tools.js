function paragraph(line, listTagName = 'ol') {
  // console.log(typeof line, line);
  if (Array.isArray(line)) return $(listTagName).append(line.map(line => $('li').append(paragraph(line))));
  if (line && typeof line === 'object') {
    const lines = Object.entries(line).filter(([name,value]) => value && ![
      'header',
      'properties',
    ].includes(name));
    // console.log(lines);
    if (lines.length) {

      const result = lines.map(([name,value]) => $('p').append(
        $('b').text(name),
        ': ',
        paragraph(value),
      ));
      if (line.properties) {
        line.row = {};
        const elem = $('form').properties(line, true).append(
          $('nav').append(
            $('button').class('icn-send').type('button').text('Verwerken').on('click', Aim.config.mailer[line.name]),
          ),
        );
        result.push(elem);
      }
      return result;
    }
    return;
  }
  return line;
  // return typeof line === 'object' && !Array.isArray(line) ? Array.from(Object.entries(line)).map(([name,value]) => [name,textline(value)].join(': ')) : [line].flat().join(' ');
}
