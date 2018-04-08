'use strict';
((io) => {
  var client = io();
  client.on('connect', () => {
    console.log('connection');

    client.emit('data', {
      query: 'select',
      module: 'viewAPUSuppliesCosts1MonthFlow',
      project: '2'
    });

  });

  client.on('response', (data) => {
    var query = data.query;
    if (data.row) {
    data.row.Tasks_start = new Date(data.row.Tasks_start);
    data.row.Tasks_end = new Date(data.row.Tasks_end);
    data.row.start = new Date(data.row.start);
    data.row.end = new Date(data.row.end);

    report.render(data.row);
    }
  });
  window.client = client;
})(io);
