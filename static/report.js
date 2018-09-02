
(() => {
  var urlparams = new URLSearchParams(window.location.search);
  var bytype = urlparams.get('bytype');
  document.querySelector('select#show-supply-type').value = bytype ? bytype : '';
  document.querySelector('select#show-supply-type').addEventListener('change', e => {
    var urlparams = new URLSearchParams(window.location.search);
    urlparams.set('bytype', e.target.value);
    window.location.search = urlparams.toString();
  });

  var DTSym = Symbol();
  var TypeSym = Symbol();
  var AAUIdSym = Symbol();
  var NoKey = 'NOKEY';
  var supplies = [];
  var periods = [];
  var allperiods = [];
  window.supplies = supplies;
  window.periods = periods;
  window.allperiods = allperiods;
  var lastSTO = null;

  const SUPPLIES_COLUMNS = [
    "SupplyId",
    "Supplies_description",
    "Supplies_unit",
    "Supplies_type",
    NoKey, NoKey, "total"];

  const AAU_COLUMNS = [
    "AAUId",
    "AAU_description",
    "AAU_unit",
    "AAU_type",
    "Tasks_start",
    "Tasks_end", "total"];

  function Report() {

  }

  Report.prototype.render = function(row) {
    if (!row) return;
    var found, foundAAU;
    var period = {
      start: row.start,
      end: row.end,
      cost: row.cost,
      qop: row.qop
    };
    allperiods.push({
      start: row.start,
      end: row.end,
      cost: row.cost,
      qop: row.qop
    });
    period[DTSym] = `${row.start.toISOString()}-${row.end.toISOString()}`;
    found = periods.find(d => d[DTSym] == period[DTSym]);
    if (!found) {
      periods.push(period);
      periods.sort((a, b) => {
        if (a.start.valueOf() > b.start.valueOf()) return 1;
        if (a.start.valueOf() < b.start.valueOf()) return -1;
        return 0;
      });
    }
    var AAU = {
      APU_defined:        row.APU_defined,
      AAUId:              row.AAUId,
      AAU_description:    row.AAU_description,
      AAU_is_estimated:   row.AAU_is_estimated,
      AAU_unit:           row.AAU_unit,
      Tasks_start:        row.Tasks_start,
      Tasks_end:          row.Tasks_end,
      periods: [period]
    };
    AAU[TypeSym] = 'AAU';
    AAU[AAUIdSym] = AAU.AAUId.split('.')
      .reduce((acc, d, i, array) => {
        acc.push(`${'0'.repeat(5 - d.length)}${d}`);
        if (i + 1 == array.length) {
          acc.push(...(new Array(8 - array.length)).fill('00000'));
        }
        return acc;
      }, []).join('');
    var supply = {
      SupplyId:             row.SupplyId,
      Supplies_cost:        row.Supplies_cost,
      Supplies_description: row.Supplies_description,
      Supplies_type:        row.Supplies_type,
      Supplies_unit:        row.Supplies_unit,
      AAU: [AAU]
    };
    supply[TypeSym] = 'supply';

    found = supplies.find(d => d.SupplyId == supply.SupplyId);
    if (found) {
      var foundAAU = found.AAU.find(d => d.AAUId == AAU.AAUId);
      if (foundAAU) {
        var foundPeriod = foundAAU.periods
          .find(d => d.start.valueOf() == period.start.valueOf());
        if (foundPeriod) {
          foundPeriod.cost += period.cost;
        } else {
          foundAAU.periods.push(period);
          if (foundAAU.Tasks_start > AAU.Tasks_start)
            foundAAU.Tasks_start = AAU.Tasks_start;
          if (foundAAU.Tasks_end < AAU.Tasks_end)
            foundAAU.Tasks_end = AAU.Tasks_end;
        }
      } else {
        found.AAU.push(AAU);
        found.AAU.sort((a, b) => {
          if (a[AAUIdSym] > b[AAUIdSym]) return 1;
          if (a[AAUIdSym] < b[AAUIdSym]) return -1;
          return 0;
        });
      }
    } else {
      supplies.push(supply);
      supplies.sort((a, b) => {
        if (a.SupplyId > b.SupplyId) return -1;
        if (a.SupplyId < b.SupplyId) return 1;
        return 0;
      });
    }

    // <crutches and more crutches!>
    if (lastSTO) {
      clearTimeout(lastSTO);
    }
    lastSTO = setTimeout(() => {
      if (lastSTO < 100) return;
      supplies.forEach(d => {
        d.periods = (d.AAU.reduce((acc, d) => {
          acc.push(...d.periods.map(d => {
            var b = {
              start: d.start,
              end: d.end,
              cost: d.cost,
              qop: d.qop
            }
            b[DTSym] = `${b.start.toISOString()}-${b.end.toISOString()}`;
            return b;
          }));
          return acc;
        }, [])).reduce((acc, d) => {
          var found = acc.find(b => b[DTSym] == d[DTSym]);
          if (found) {
            found.cost += d.cost;
            found.qop += d.qop;
          } else {
            acc.push(d);
          }
          return acc;
        }, []);
        d.total = {
          qop: d.periods.reduce((acc, d) => {
            acc += d.qop;
            return acc;
          }, 0),
          cost: d.periods.reduce((acc, d) => {
            acc += d.cost;
            return acc;
          }, 0)
        };
      });
      render();
    }, 200);
    // </crutches and more crutches!>
  }

  function render() {
    var tbody = d3.select('table tbody');

    var totals = d3.select('table thead tr.totals').selectAll('th.totals')
      .data(periods).enter().append('th')
      .attr('class', 'totals');

    totals.append('span').classed('cost', true).text(d => {
        return `$${Number(allperiods
          .filter(b => b.start.valueOf() == d.start.valueOf())
          .reduce((acc, d) => {
            acc += d.cost;
            return acc;
          }, 0).toFixed(0)).toLocaleString()}`;
      });

    totals.append('span').classed('qop', true).text(d => {
        return Number(allperiods
          .filter(b => b.start.valueOf() == d.start.valueOf())
          .reduce((acc, d) => {
            acc += d.qop;
            return acc;
          }, 0).toFixed(2)).toLocaleString();
      });

    d3.select('table thead tr.periods').selectAll('th.periods')
      .data(periods).enter().append('th')
      .attr('class', 'periods')
      .text(d => d.start.toLocaleDateString());

    d3.select('table thead tr').selectAll('th.periods')
      .data(periods).enter().append('th')
      .attr('class', 'periods')
      .text((d, i) => i + 1);

    var trs = tbody.selectAll('tr').data(supplies.reduce((acc, d) => {
      acc.push(d);
      acc.push(...d.AAU);
      return acc;
    }, []));
    var tr = trs.enter().append('tr').attr('class', d => d[TypeSym])
      .style('background-color', (d, i) => {
        return i % 2 ? 'white' : '#f0f0f0';
      })
      .style('color', (d, i) =>
        d[TypeSym] == 'supply' ? 'red' : (d.APU_defined ? 'yellow' : ''));

    tds = tr.selectAll('td').data(d =>
      d[TypeSym] == 'supply' ? SUPPLIES_COLUMNS.map(k => ({
        key: k,
        row: d,
        type: 'supply',
        value: d[k]
      })).concat(periods.map((p, i) => ({
        key: `period${i}`,
        type: 'period',
        value: d.periods.find(b => b.start.valueOf() == p.start.valueOf())
      }))) : AAU_COLUMNS.map(k => ({
        key: k,
        row: d,
        type: 'AAU',
        value: d[k]
      })).concat(periods.map((p, i) => ({
        key: `period${i}`,
        type: 'period',
        value: d.periods.find(b => b.start.valueOf() == p.start.valueOf())
      })))
    );
    tds.enter().append('td')
      .attr('key', d => d.key)
      .text(d => {
        if (d.key == 'total') {
          return '';
        }
        if (d.type == 'period') {
          return '';
        }
        if (d.type == 'supply') {
          return d.value ? d.value : (d.key == NoKey ? '' : 'Estimado');
        }
        return d.value ? (
          (d.key == 'Tasks_start' || d.key == 'Tasks_end') ?
            d.value.toLocaleDateString() : d.value) : '-';
      })
      .each(function(d, i, m) {
        if (d.key == 'total') {
          d3.select(this)
            .append('div')
            .classed('cost', true)
            .text(d.value
              ? `$${Math.floor(Number(d.value.cost)).toLocaleString()}`
              : ''
            );
          d3.select(this)
            .append('div')
            .classed('qop', true)
            .text(d.value
              ? `${Number(d.value.qop).toFixed(2).toLocaleString()}`
              : ''
            );
        }
        if (d.type == 'period') {
          d3.select(this)
            .append('div')
            .classed('cost', true)
            .text(d.value
              ? `$${Math.floor(Number(d.value.cost)).toLocaleString()}`
              : ''
            );
          d3.select(this)
            .append('div')
            .classed('qop', true)
            .text(d.value
              ? `${Number(d.value.qop).toFixed(2).toLocaleString()}`
              : ''
            );
        }
      });
  }

  window.report = new Report();
})();
