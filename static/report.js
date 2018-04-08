
(() => {
  var DTSym = Symbol();
  var TypeSymb = Symbol();
  var supplies = [];
  var periods = [];
  window.supplies = supplies;
  window.periods = periods;

  const SUPPLIES_COLUMNS = [
    "SupplyId",
    "Supplies_description",
    "Supplies_unit",
    "Supplies_type",
    "Supplies_cost"];

  const APU_COLUMNS = [
    "APUId",
    "APU_description",
    "APU_unit",
    "APU_type",
    "APU_cost"];

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
    APU[TypeSymb] = 'APU';
    var supply = {
      SupplyId:             row.SupplyId,
      Supplies_cost:        row.Supplies_cost,
      Supplies_description: row.Supplies_description,
      Supplies_type:        row.Supplies_type,
      Supplies_unit:        row.Supplies_unit,
      APU: [APU]
    };
    supply[TypeSymb] = 'supply';

    found = supplies.find(d => d.SupplyId == supply.SupplyId);
    if (found) {
      var foundAPU = found.APU.find(d => d.APUId == APU.APUId);
      if (foundAPU) {
        foundAPU.periods.push(period);
      } else {
        found.APU.push(APU);
      }
    } else {
      supplies.push(supply);
    }

    render();
  }

  function render() {
    var thead = d3.select('table thead');
    var tbody = d3.select('table tbody');

    var trs = tbody.selectAll('tr').data(supplies.reduce((acc, d) => {
      acc.push(d);
      acc.push(...d.APU);
      return acc;
    }, []));
    var tr = trs.enter().append('tr').attr('class', d => d[TypeSymb]);

    tds = tr.selectAll('td').data(d =>
      d[TypeSymb] == 'supply' ? SUPPLIES_COLUMNS.map(k => ({
        key: k,
        value: d[k]
      })) : APU_COLUMNS.map(k => ({
        key: k,
        value: d[k]
      }))
    );
    tds.enter().append('td')
      .attr('key', d => d.key)
      .text(d => d.value ? d.value : '-');
  }

  window.report = new Report();
})();
