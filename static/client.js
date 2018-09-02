'use strict';
((io) => {
  var client = io();
  var params = new URLSearchParams(location.search);
  var ProjectId = params.get('ProjectId');
  var bytype = params.get('bytype');
  console.log(ProjectId, bytype);
  client.on('connect', () => {
    const req = {
      query: 'select',
      module: 'viewAAUSuppliesCosts1MonthFlow',
    };
    let doreq = false;
    if (ProjectId) {
      req.project = ProjectId;
      doreq = true;
    }
    if (bytype) {
      req.bytype = bytype;
    }

    client.emit('data', req);
    client.emit('data', {
      query: 'select',
      module: 'Projects'
    });
  });

  client.on('response', (data) => {
    var query = data.query;
    if (query == 'select' && data.module == 'viewAAUSuppliesCosts1MonthFlow') {
      if (data.row) {
        data.row.Tasks_start = new Date(data.row.Tasks_start);
        data.row.Tasks_end = new Date(data.row.Tasks_end);
        data.row.start = new Date(data.row.start);
        data.row.end = new Date(data.row.end);

        report.render(data.row);
      }
    } else if (query == 'select' && data.module == 'Projects') {
      window.projects.doselect(data.row);
    } else {
      console.log('not processed', data);
    }
  });
  window.client = client;
})(io);
