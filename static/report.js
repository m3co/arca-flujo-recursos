
(() => {
  var DTSym = Symbol();
  var TypeSym = Symbol();
  var APUIdSym = Symbol();
  var supplies = [];
  var periods = [];
  window.supplies = supplies;
  window.periods = periods;
  var lastSTO = null;

  const SUPPLIES_COLUMNS = [
    "SupplyId",
    "Supplies_description",
    "Supplies_unit",
    "Supplies_type"];

  const APU_COLUMNS = [
    "APUId",
    "APU_description",
    "APU_unit",
    "APU_type"];

  function Report() {

  }

  Report.prototype.render = function(row) {
    if (!row) return;
    var found, foundAPU;
    var period = {
      start: row.start,
      end: row.end,
      cost: row.cost,
      qop: row.qop
    };
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
    var APU = {
      APUId:              row.APUId,
      APU_description:    row.APU_description,
      APU_is_estimated:   row.APU_is_estimated,
      APU_unit:           row.APU_unit,
      Tasks_start:        row.Tasks_start,
      Tasks_end:          row.Tasks_end,
      periods: [period]
    };
    APU[TypeSym] = 'APU';
    APU[APUIdSym] = APU.APUId.split('.')
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
      APU: [APU]
    };
    supply[TypeSym] = 'supply';

    found = supplies.find(d => d.SupplyId == supply.SupplyId);
    if (found) {
      var foundAPU = found.APU.find(d => d.APUId == APU.APUId);
      if (foundAPU) {
        var foundPeriod = foundAPU.periods
          .find(d => d.start.valueOf() == period.start.valueOf());
        if (foundPeriod) {
          foundPeriod.cost += period.cost;
        } else {
          foundAPU.periods.push(period);
        }
      } else {
        found.APU.push(APU);
        found.APU.sort((a, b) => {
          if (a[APUIdSym] > b[APUIdSym]) return 1;
          if (a[APUIdSym] < b[APUIdSym]) return -1;
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
        d.periods = [];
        d.periods = (d.APU.reduce((acc, d) => {
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
      });
      render();
    }, 200);
    // </crutches and more crutches!>
  }

  function render() {
    var thead = d3.select('table thead tr');
    var tbody = d3.select('table tbody');

    thead.selectAll('th.periods').data(periods).enter().append('th')
      .attr('class', 'periods')
      .text(d => d.start.toLocaleDateString());
    var trs = tbody.selectAll('tr').data(supplies.reduce((acc, d) => {
      acc.push(d);
      acc.push(...d.APU);
      return acc;
    }, []));
    var tr = trs.enter().append('tr').attr('class', d => d[TypeSym])
      .style('background-color', (d, i) => {
        return i % 2 ? 'white' : '#f0f0f0';
      })
      .style('color', (d, i) => {
        return d[TypeSym] == 'supply' ? 'red' : '';
      });

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
      }))) : APU_COLUMNS.map(k => ({
        key: k,
        row: d,
        type: 'APU',
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
        if (d.type == 'period') {
          return d.value ? `$${Math.floor(Number(d.value.cost)).toLocaleString()}` : '';
        }
        if (d.type == 'supply') {
          return d.value ? d.value : 'Estimado'
        }
        return d.value ? d.value : '-'
      });
  }

  window.report = new Report();
})();
