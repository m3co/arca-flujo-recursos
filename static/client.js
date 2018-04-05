'use strict';
((io) => {
  var client = io();
  client.on('connect', () => {
    console.log('connection');

    client.emit('data', {
      query: 'select',
      module: 'viewQtakeoffSuppliesCosts1MonthFlow',
      project: '2'
    });

  });

  client.on('response', (data) => {
    var query = data.query;
    console.log(data);
  });
  window.client = client;
})(io);
